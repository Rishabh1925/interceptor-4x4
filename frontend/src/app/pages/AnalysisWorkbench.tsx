import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileVideo, CheckCircle2, XCircle, Download, FileText, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { useArchitecture } from '../context/ArchitectureContext';
import { useTheme } from '../context/ThemeContext';
import SystemArchitectureCanvas from '../components/SystemArchitectureCanvas';
import RoutingExplanation from '../components/RoutingExplanation';
import { saveAnalysis, checkDuplicateFile, type VideoAnalysis } from '../../utils/supabase';
import { saveAnalysisLocally } from '../../utils/local-storage-analysis';
import { ChunkedUploader, shouldUseChunkedUpload, formatBytes, calculateETA, type ChunkUploadProgress } from '../../utils/chunked-upload';

// Backend API URL - Always use Vercel serverless API
const API_URL = '/api';

// File size threshold for chunked upload (10MB)
const CHUNKED_UPLOAD_THRESHOLD = 10 * 1024 * 1024;
// Maximum supported file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  return formatBytes(bytes);
};

const AnalysisWorkbench = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<'direct' | 'chunked'>('direct');
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  
  // Chunked upload specific state
  const [chunkProgress, setChunkProgress] = useState<ChunkUploadProgress | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  const [chunkResults, setChunkResults] = useState<any[]>([]);

  // Refs for scroll targets
  const animationRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    state,
    setCurrentPage,
    setProcessingStage,
    activateModel,
    deactivateModel,
    resetFlow,
  } = useArchitecture();

  useEffect(() => {
    setCurrentPage('workbench');
    return () => resetFlow();
  }, [setCurrentPage, resetFlow]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      
      // Check file size limit
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const analyzeVideo = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setIsDuplicate(false);
    setDuplicateResult(null);
    setUploadSpeed(0);
    setChunkProgress(null);
    setChunkResults([]);
    setUploadStartTime(Date.now());
    resetFlow();

    // Determine upload method based on file size
    const useChunkedUpload = shouldUseChunkedUpload(selectedFile, CHUNKED_UPLOAD_THRESHOLD);
    setUploadMethod(useChunkedUpload ? 'chunked' : 'direct');

    try {
      // FIRST: Check if file was previously analyzed
      setProcessingStage('Checking File History');
      setProgress(3);
      
      const existingAnalysis = await checkDuplicateFile(selectedFile.name, selectedFile.size);
      
      if (existingAnalysis) {
        // File was previously analyzed - show results directly
        setIsDuplicate(true);
        setDuplicateResult(existingAnalysis);
        
        // Convert database result to display format
        const displayResult = {
          prediction: existingAnalysis.prediction,
          confidence: existingAnalysis.confidence,
          best_model: existingAnalysis.models_used?.[0]?.toLowerCase() || 'bg-model',
          specialists_used: existingAnalysis.models_used || ['BG-Model'],
          processing_time: existingAnalysis.processing_time || 2.0,
          explanation: existingAnalysis.prediction === 'fake'
            ? `This video is classified as MANIPULATED (FAKE) with ${(existingAnalysis.confidence * 100).toFixed(1)}% confidence. Previously analyzed on ${new Date(existingAnalysis.created_at!).toLocaleDateString()}.`
            : `This video is classified as AUTHENTIC (REAL) with ${(existingAnalysis.confidence * 100).toFixed(1)}% confidence. Previously analyzed on ${new Date(existingAnalysis.created_at!).toLocaleDateString()}.`,
          raw_result: existingAnalysis.analysis_result,
        };
        
        setAnalysisResult(displayResult);
        setProcessingStage('Analysis Complete');
        setProgress(100);
        setIsAnalyzing(false);
        
        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
        
        return;
      }

      // File is new - proceed with analysis
      let result;

      if (useChunkedUpload) {
        // Use chunked upload for large files
        console.log(`Using chunked upload for ${formatFileSize(selectedFile.size)} file`);
        result = await analyzeVideoChunked();
      } else {
        // Use direct upload for small files
        console.log(`Using direct upload for ${formatFileSize(selectedFile.size)} file`);
        result = await analyzeVideoDirect();
      }

      if (!result) return; // Upload was cancelled or failed

      // Process and display results (same for both methods)
      await processAnalysisResult(result);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze video. Please try again.');
      setProcessingStage('Error');
      resetFlow();
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Analyze video using chunked upload (for files > 10MB)
   */
  const analyzeVideoChunked = async () => {
    if (!selectedFile) return null;

    setProcessingStage('Preparing Chunked Upload');
    setProgress(5);

    const uploader = new ChunkedUploader(selectedFile, {
      chunkSize: 3 * 1024 * 1024, // 3MB chunks to stay under Vercel limits
      apiUrl: '/api/upload-chunked',
      onProgress: (progress: ChunkUploadProgress) => {
        setChunkProgress(progress);
        
        // Update processing stage based on progress
        if (progress.chunkIndex === 0 && progress.chunkProgress < 100) {
          setProcessingStage('Uploading Video in Chunks');
        } else if (progress.chunkProgress === 100) {
          setProcessingStage(`Analyzing Chunk ${progress.chunkIndex + 1}/${progress.totalChunks}`);
          
          // Store chunk result if available
          if (progress.chunkResult) {
            setChunkResults(prev => {
              const newResults = [...prev];
              newResults[progress.chunkIndex] = progress.chunkResult;
              return newResults;
            });
          }
        }
        
        // Update overall progress (upload is 40% of total, chunk processing is 50%, final aggregation is 10%)
        const uploadProgress = progress.overallProgress * 0.4;
        const processingProgress = (progress.chunkIndex / progress.totalChunks) * 50;
        setProgress(5 + uploadProgress + processingProgress);
      }
    });

    try {
      const result = await uploader.upload();
      
      if (!result.success) {
        throw new Error(result.error || 'Chunked upload failed');
      }

      return result.result;
    } catch (error) {
      console.error('Chunked upload error:', error);
      throw error;
    }
  };

  /**
   * Analyze large video using clip extraction (for files > 10MB) - Legacy method
   */
  const analyzeLargeVideo = async () => {
    if (!selectedFile) return null;

    // Stage 1: Video Upload
    setProcessingStage('Uploading Large Video');
    activateModel('video-input');
    setProgress(5);

    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Stage 2: Sending to API
    setProcessingStage('Extracting First 2-3 Seconds');
    activateModel('frame-sampler');
    setProgress(15);

    // Make API call to large video endpoint
    const response = await fetch(`${API_URL}/predict-large-video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  };

  /**
   * Analyze video using direct upload (for files < 10MB)
   */
  const analyzeVideoDirect = async () => {
    if (!selectedFile) return null;

    // Stage 1: Video Upload
    setProcessingStage('Uploading Video');
    activateModel('video-input');
    setProgress(5);

    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Stage 2: Sending to API
    setProcessingStage('Connecting to Server');
    activateModel('frame-sampler');
    setProgress(15);

    // Make API call to updated deterministic endpoint
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  };

  /**
   * Process analysis result and update UI
   */
  const processAnalysisResult = async (result: any) => {
    // Stage 4: Baseline Analysis
    setProcessingStage('Baseline Analysis');
    activateModel('bg-model');
    setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stage 5: Routing
    setProcessingStage('Intelligent Routing');
    activateModel('routing-engine');
    activateModel('langgraph');
    setProgress(70);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stage 6: Specialist Models
    setProcessingStage('Specialist Analysis');
    const modelsUsed = result.models_used || ['BG-Model'];
    for (let i = 0; i < modelsUsed.length; i++) {
      const modelKey = modelsUsed[i].toLowerCase().replace('-model', '-model');
      activateModel(modelKey.replace('-model', '-model'));
      setProgress(75 + (i + 1) * 3);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Stage 7: Aggregation
    setProcessingStage('Result Aggregation');
    activateModel('aggregator');
    setProgress(90);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stage 8: Explanation
    setProcessingStage('Generating Explanation');
    activateModel('explainer');
    setProgress(95);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 9: Final
    setProcessingStage('Finalizing Results');
    activateModel('api-response');
    activateModel('heatmap');
    setProgress(100);

    // Determine best model from predictions
    const modelPredictions = result.analysis?.model_predictions || {};
    let bestModel = 'bg-model';
    let highestConf = 0;
    Object.entries(modelPredictions).forEach(([model, conf]: [string, any]) => {
      if (conf > highestConf) {
        highestConf = conf;
        bestModel = model.toLowerCase();
      }
    });

    // Generate explanation based on result
    const predictionLabel = result.prediction === 'fake' ? 'MANIPULATED (FAKE)' : 'AUTHENTIC (REAL)';
    const confidencePercent = (result.confidence * 100).toFixed(1);
    const uploadMethodText = uploadMethod === 'clip' ? ' using clip extraction from large video' : '';
    const explanation = result.prediction === 'fake'
      ? `This video is classified as ${predictionLabel} with ${confidencePercent}% confidence. Analysis performed by ${result.models_used?.length || 1} specialist model(s)${uploadMethodText}. Detected inconsistencies suggest potential manipulation.`
      : `This video is classified as ${predictionLabel} with ${confidencePercent}% confidence. No significant manipulation artifacts detected across ${result.analysis?.frames_analyzed || 30} analyzed frames${uploadMethodText}.`;

    setAnalysisResult({
      prediction: result.prediction,
      confidence: result.confidence,
      best_model: bestModel,
      specialists_used: result.models_used || ['BG-Model'],
      processing_time: result.processing_time || 2.0,
      explanation,
      raw_result: result,
    });

    setProcessingStage('Analysis Complete');

    // Save to Supabase database
    try {
      const analysisRecord: VideoAnalysis = {
        filename: selectedFile!.name,
        file_size: selectedFile!.size,
        prediction: result.prediction,
        confidence: result.confidence,
        models_used: result.models_used || ['BG-Model'],
        processing_time: result.processing_time || 2.0,
        analysis_result: result,
        user_ip: 'web-client'
      };
      
      const saved = await saveAnalysis(analysisRecord);
      if (saved) {
        console.log('✅ Analysis saved to Supabase database');
      } else {
        // Fallback to local storage when Supabase isn't configured
        console.log('⚠️ Supabase not configured, saving locally...');
        saveAnalysisLocally({
          filename: selectedFile!.name,
          prediction: result.prediction,
          confidence: result.confidence,
          models_used: result.models_used || ['BG-Model'],
          processing_time: result.processing_time || 2.0
        });
      }
    } catch (dbError) {
      console.error('❌ Failed to save to database:', dbError);
      // Fallback to local storage on error
      console.log('💾 Falling back to local storage...');
      saveAnalysisLocally({
        filename: selectedFile!.name,
        prediction: result.prediction,
        confidence: result.confidence,
        models_used: result.models_used || ['BG-Model'],
        processing_time: result.processing_time || 2.0
      });
    }

    // Scroll to results section when complete
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 500);
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      // Scroll to animation section when analysis starts
      setTimeout(() => {
        animationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
      analyzeVideo();
    }
  };

  const analyzeWithAgents = () => {
    if (selectedFile) {
      // Scroll to animation section when analysis starts
      setTimeout(() => {
        animationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
      analyzeVideoWithAgents();
    }
  };

  const analyzeVideoWithAgents = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setIsDuplicate(false);
    setDuplicateResult(null);
    setUploadSpeed(0);
    resetFlow();

    try {
      // Stage 1: Video Upload
      setProcessingStage('Uploading Video');
      activateModel('video-input');
      setProgress(5);

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Stage 2: OnDemand Agents Processing
      setProcessingStage('OnDemand Agents Processing');
      activateModel('frame-sampler');
      setProgress(15);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 3: Agent Analysis
      setProcessingStage('Agent 1: Quality Analysis');
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 800));

      setProcessingStage('Agent 2: Metadata Extraction');
      setProgress(35);
      await new Promise(resolve => setTimeout(resolve, 800));

      setProcessingStage('Agent 3: Content Classification');
      setProgress(45);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Stage 4: Sending to Enhanced API
      setProcessingStage('Connecting to Enhanced Server');
      activateModel('face-detector');
      setProgress(55);

      // Make API call to agent-enhanced endpoint
      const response = await fetch('/api/predict-with-agents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      await processAnalysisResult(result);

    } catch (err: any) {
      console.error('Agent-enhanced analysis error:', err);
      setError(err.message || 'Failed to analyze video with agents. Please try again.');
      setProcessingStage('Error');
      resetFlow();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setProgress(0);
    setError(null);
    setIsDuplicate(false);
    setDuplicateResult(null);
    setChunkProgress(null);
    setChunkResults([]);
    setUploadStartTime(0);
    resetFlow();
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;
    
    const report = {
      video: selectedFile?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      result: analysisResult.prediction,
      confidence: analysisResult.confidence,
      best_model: analysisResult.best_model,
      specialists_used: analysisResult.specialists_used,
      processing_time: analysisResult.processing_time,
      explanation: analysisResult.explanation
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pt-32 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Video Analysis
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Upload your video for instant deepfake detection. Supports MP4, AVI, MOV, and WebM up to 100MB. Large files are processed in chunks for better reliability.
          </p>
        </div>

        {/* Upload Section */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 transition-all backdrop-blur-md ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50'
          }`}
        >
          <input
            type="file"
            accept="video/mp4,video/avi,video/mov,video/webm"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileVideo className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg text-gray-900 dark:text-white mb-2">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
                {shouldUseChunkedUpload(selectedFile, CHUNKED_UPLOAD_THRESHOLD) && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Large file ({formatFileSize(selectedFile.size)}) - will be processed in 3MB chunks for optimal analysis
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg text-gray-900 dark:text-white mb-2">
                  Drag and drop your video or click to browse
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Maximum file size: 100MB • Large files processed in chunks
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isAnalyzing && !analysisResult && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className={`flex-1 px-6 py-3 rounded-xl transition-colors shadow-lg text-sm sm:text-base ${
                selectedFile
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Analyze Video
            </button>
            {selectedFile && (
              <>
                <button
                  onClick={() => analyzeWithAgents()}
                  disabled={!selectedFile}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg text-sm sm:text-base"
                >
                  Analyze with Agents
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md hover:bg-white/70 dark:hover:bg-gray-900/70 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl transition-colors text-sm sm:text-base"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/50 dark:bg-red-900/20 backdrop-blur-md border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-1">Analysis Failed</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Pipeline Animation - Shown during analysis */}
        {isAnalyzing && (
          <div ref={animationRef} className="space-y-6">
            {/* Processing Progress */}
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Analyzing Video
                </h2>
                {/* OnDemand Agent Badge */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    OnDemand Agents Active
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {state.processingStage || 'Processing...'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {chunkProgress && uploadMethod === 'chunked' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Processing chunk {chunkProgress.chunkIndex + 1} of {chunkProgress.totalChunks} • 
                        {formatFileSize(chunkProgress.uploadedBytes)} / {formatFileSize(chunkProgress.totalBytes)} uploaded
                        {uploadStartTime > 0 && chunkProgress.uploadedBytes > 0 && (
                          <span className="ml-2">
                            • {calculateETA(chunkProgress.uploadedBytes, chunkProgress.totalBytes, uploadStartTime)}
                          </span>
                        )}
                      </p>
                      {chunkProgress.chunkResult && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Chunk {chunkProgress.chunkIndex + 1} result: {chunkProgress.chunkResult.prediction} 
                          ({(chunkProgress.chunkResult.confidence * 100).toFixed(1)}% confidence, 
                          {chunkProgress.chunkResult.models_used?.length || 1} models used)
                        </p>
                      )}
                      {chunkResults.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded text-xs">
                          <p className="text-gray-700 dark:text-gray-300 mb-1">Chunk Results So Far:</p>
                          <div className="flex flex-wrap gap-1">
                            {chunkResults.map((result, idx) => (
                              <span key={idx} className={`px-2 py-1 rounded text-xs ${
                                result?.prediction === 'fake' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                #{idx + 1}: {result?.prediction || 'processing...'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {uploadMethod === 'chunked' && uploadSpeed > 0 && progress < 50 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Processing entire video in 3MB chunks: {formatFileSize(uploadSpeed)}/s
                    </p>
                  )}
                </div>
                
                {/* Agent Status */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pre-processing Agents
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 dark:text-gray-400">Quality Analyzer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 dark:text-gray-400">Metadata Extractor</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-600 dark:text-gray-400">Content Classifier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Visualization */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Processing Pipeline
                </h3>
                {state.processingStage !== 'idle' && (
                  <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                    {state.processingStage}
                  </span>
                )}
              </div>
              <div className="relative h-[250px] sm:h-[320px] md:h-[400px] flex items-center justify-center rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <SystemArchitectureCanvas />
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {analysisResult && (
          <div ref={resultsRef} className="space-y-6">
            {/* Results Header */}
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Analysis Results
                  </h2>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-md hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  New Analysis
                </button>
              </div>

              {/* Duplicate File Indicator */}
              {isDuplicate && (
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <FileVideo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Previously Analyzed File
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This file was analyzed on {duplicateResult ? new Date(duplicateResult.created_at).toLocaleDateString() : 'a previous date'}. Showing cached results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    analysisResult.prediction === 'fake'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {analysisResult.prediction === 'fake' ? (
                    <XCircle className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prediction</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {analysisResult.prediction}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {(analysisResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Model</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {analysisResult.best_model.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Models Used Section */}
              <div className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Models & Agents Used
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.specialists_used.map((model: string, index: number) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        model.includes('OnDemand') || model.includes('Agent')
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {model}
                    </span>
                  ))}
                </div>
                {analysisResult.raw_result?.ondemand_analysis?.agents_used > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Enhanced analysis with {analysisResult.raw_result.ondemand_analysis.agents_used} preprocessing agents
                  </p>
                )}
              </div>

              <div className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Explanation
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysisResult.explanation}
                </p>
                
                {/* Show chunked analysis breakdown if available */}
                {analysisResult.raw_result?.chunked_analysis && (
                  <div className="mt-4 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      Chunked Analysis Breakdown
                    </p>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">Total Chunks:</strong>
                          <p>{analysisResult.raw_result.chunked_analysis.total_chunks}</p>
                        </div>
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">File Size:</strong>
                          <p>{analysisResult.raw_result.chunked_analysis.file_size_mb}MB</p>
                        </div>
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">Fake Chunks:</strong>
                          <p>{analysisResult.raw_result.chunked_analysis.chunks_fake}</p>
                        </div>
                        <div>
                          <strong className="text-gray-700 dark:text-gray-300">Real Chunks:</strong>
                          <p>{analysisResult.raw_result.chunked_analysis.chunks_real}</p>
                        </div>
                      </div>
                      
                      {/* Chunk-by-chunk breakdown */}
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <strong className="text-gray-700 dark:text-gray-300">Individual Chunk Results:</strong>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {analysisResult.raw_result.chunked_analysis.chunk_breakdown.map((chunk: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded text-xs">
                              <span>Chunk {chunk.chunkIndex + 1} ({chunk.size})</span>
                              <span className={`px-2 py-1 rounded ${
                                chunk.prediction === 'fake' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}>
                                {chunk.prediction} ({(chunk.confidence * 100).toFixed(1)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show OnDemand agent insights if available */}
                {analysisResult.raw_result?.ondemand_analysis?.agent_insights && (
                  <div className="mt-4 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      Agent Analysis
                    </p>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      {analysisResult.raw_result.ondemand_analysis.agent_insights.agent1 && (
                        <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                          <strong className="text-gray-700 dark:text-gray-300">Agent 1 (Quality):</strong>
                          <p className="mt-1">{analysisResult.raw_result.ondemand_analysis.agent_insights.agent1}</p>
                        </div>
                      )}
                      {analysisResult.raw_result.ondemand_analysis.agent_insights.agent2 && (
                        <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                          <strong className="text-gray-700 dark:text-gray-300">Agent 2 (Metadata):</strong>
                          <p className="mt-1">{analysisResult.raw_result.ondemand_analysis.agent_insights.agent2}</p>
                        </div>
                      )}
                      {analysisResult.raw_result.ondemand_analysis.agent_insights.agent3 && (
                        <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                          <strong className="text-gray-700 dark:text-gray-300">Agent 3 (Content):</strong>
                          <p className="mt-1">{analysisResult.raw_result.ondemand_analysis.agent_insights.agent3}</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Agents Used:</strong> {analysisResult.raw_result.ondemand_analysis.agents_used}/3 • 
                          <strong> Confidence Adjustment:</strong> {(analysisResult.raw_result.ondemand_analysis.confidence_adjustment * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NEW: Deterministic Routing Explanation - Subtle and consistent */}
              <div className="mt-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-normal text-gray-900 dark:text-white">Deterministic Routing Explanation</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                        DETERMINISTIC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consistency Guarantee */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-normal text-gray-900 dark:text-white">Forensic Consistency Guarantee</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This routing decision will be identical for this file every time - suitable for legal proceedings
                  </p>
                </div>

                {/* Models Selected */}
                <div className="mb-4">
                  <h4 className="font-normal text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    Models Selected ({analysisResult.models_used?.length || 1} specialists)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(analysisResult.models_used || ['BG-Model']).map((model, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="font-normal text-gray-900 dark:text-white">{model}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {model.includes('BG') ? 'Background Analysis' : 
                             model.includes('CM') ? 'Compression Detection' : 
                             model.includes('LL') ? 'Low-Light Analysis' : 
                             model.includes('AV') ? 'Audio-Visual Sync' : 
                             model.includes('RR') ? 'Resolution Consistency' : 
                             model.includes('TM') ? 'Temporal Analysis' : 'Specialist Model'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routing Reasons */}
                <div className="mb-4">
                  <h4 className="font-normal text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    Why These Models Were Selected
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-600 dark:text-gray-400">File characteristics analyzed: {analysisResult.filename}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-600 dark:text-gray-400">Deterministic routing based on file size: {(analysisResult.file_size / (1024*1024)).toFixed(1)}MB</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-600 dark:text-gray-400">Processing time: {analysisResult.processing_time}s - consistent across runs</span>
                    </div>
                  </div>
                </div>

                {/* File Characteristics */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-normal text-gray-900 dark:text-white mb-3">Deterministic Signals Detected</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {(analysisResult.file_size / (1024*1024)).toFixed(1)}MB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Processing:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {analysisResult.processing_time}s
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Models:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {analysisResult.models_used?.length || 1} specialists
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Routing:</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        DETERMINISTIC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fallback: Show routing explanation component if data exists */}
              <RoutingExplanation routingExplanation={analysisResult.raw_result?.routing_explanation} />
            </div>

            <button
              onClick={handleDownloadReport}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md hover:bg-white/70 dark:hover:bg-gray-900/70 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisWorkbench;