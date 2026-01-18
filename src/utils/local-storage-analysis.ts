/**
 * Local storage fallback for analysis data when Supabase isn't configured
 */

export interface LocalAnalysisData {
  id: string;
  filename: string;
  prediction: 'real' | 'fake';
  confidence: number;
  models_used: string[];
  processing_time: number;
  created_at: string;
  enhanced_by_agents: boolean;
  ondemand_analysis?: {
    agents_used: number;
    preprocessing_complete: boolean;
    agent_insights: {
      agent1: string;
      agent2: string;
      agent3: string;
    };
    confidence_adjustment: number;
  };
}

const STORAGE_KEY = 'interceptor_analyses';

/**
 * Save analysis to local storage
 */
export function saveAnalysisLocally(analysis: {
  filename: string;
  prediction: 'real' | 'fake';
  confidence: number;
  models_used: string[];
  processing_time: number;
}): LocalAnalysisData {
  const analysisData: LocalAnalysisData = {
    id: Date.now().toString(),
    filename: analysis.filename,
    prediction: analysis.prediction,
    confidence: analysis.confidence,
    models_used: analysis.models_used,
    processing_time: analysis.processing_time,
    created_at: new Date().toISOString(),
    enhanced_by_agents: false
  };

  // Get existing analyses
  const existing = getLocalAnalyses();
  
  // Add new analysis at the beginning
  const updated = [analysisData, ...existing];
  
  // Keep only last 10 analyses
  const trimmed = updated.slice(0, 10);
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  
  console.log('✅ Analysis saved locally:', analysisData.filename);
  return analysisData;
}

/**
 * Get recent analyses from local storage
 */
export function getLocalAnalyses(): LocalAnalysisData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const analyses = JSON.parse(stored);
    return Array.isArray(analyses) ? analyses : [];
  } catch (error) {
    console.error('Error reading local analyses:', error);
    return [];
  }
}

/**
 * Get the most recent analysis
 */
export function getLatestLocalAnalysis(): LocalAnalysisData | null {
  const analyses = getLocalAnalyses();
  return analyses.length > 0 ? analyses[0] : null;
}

/**
 * Clear all local analyses
 */
export function clearLocalAnalyses(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ Local analyses cleared');
}