/**
 * OnDemand.io Agents Integration
 * Specific agent implementations for E-Raksha deepfake detection
 */

import { getOnDemandClient, AgentResponse } from './ondemand-client';

// Agent IDs from OnDemand.io marketplace
export const AGENT_IDS = {
  DEMO_VIDEO_ANALYSIS: '696ae690c7d6dfdf7e337e7e',
  MEDIA_AUTHENTICITY: '', // TODO: Get this ID
  EXPERIENCE_CONSISTENCY: '', // TODO: Get this ID
  SMARTFLOW_MARKETING: '' // TODO: Get this ID
} as const;

export interface VideoAnalysisInput {
  videoUrl?: string;
  videoBase64?: string;
  filename: string;
  fileSize: number;
  perspectives?: number;
}

export interface VideoAnalysisResult {
  perspectives: string[];
  confidence: number;
  insights: string[];
  processingTime: number;
  agentId: string;
}

export interface MediaAuthenticityResult {
  isAuthentic: boolean;
  confidence: number;
  suspiciousIndicators: string[];
  metadataAnalysis: any;
  processingTime: number;
  agentId: string;
}

export interface ConsistencyAnalysisResult {
  consistencyScore: number;
  temporalAnomalies: any[];
  frameAnalysis: any[];
  processingTime: number;
  agentId: string;
}

/**
 * Demo Video Analysis Agent
 * Analyzes video from different perspectives as requested by user
 */
export async function analyzeVideoWithPerspectives(
  input: VideoAnalysisInput
): Promise<VideoAnalysisResult | null> {
  try {
    const client = getOnDemandClient();
    
    // Format input for the perspective generation agent
    const agentInput = {
      video_data: input.videoBase64 || input.videoUrl,
      filename: input.filename,
      perspectives_requested: input.perspectives || 3,
      analysis_type: "deepfake_detection_perspectives"
    };

    const response = await client.executeAgent(
      AGENT_IDS.DEMO_VIDEO_ANALYSIS,
      agentInput
    );

    if (!response.success || !response.data) {
      console.error('Video perspective analysis failed:', response.error);
      return null;
    }

    // Parse the agent response based on the fulfillment prompt
    const result: VideoAnalysisResult = {
      perspectives: response.data.perspectives || [],
      confidence: response.data.confidence || 0,
      insights: response.data.insights || [],
      processingTime: response.executionTime,
      agentId: response.agentId
    };

    return result;
  } catch (error) {
    console.error('Video perspective analysis error:', error);
    return null;
  }
}

/**
 * Media Authenticity Agent
 * Performs initial authenticity verification
 */
export async function checkMediaAuthenticity(
  input: VideoAnalysisInput
): Promise<MediaAuthenticityResult | null> {
  try {
    const client = getOnDemandClient();
    
    if (!AGENT_IDS.MEDIA_AUTHENTICITY) {
      console.warn('Media authenticity agent ID not configured');
      return null;
    }

    const agentInput = {
      media_data: input.videoBase64 || input.videoUrl,
      filename: input.filename,
      file_size: input.fileSize
    };

    const response = await client.executeAgent(
      AGENT_IDS.MEDIA_AUTHENTICITY,
      agentInput
    );

    if (!response.success || !response.data) {
      console.error('Media authenticity check failed:', response.error);
      return null;
    }

    const result: MediaAuthenticityResult = {
      isAuthentic: response.data.is_authentic || false,
      confidence: response.data.confidence || 0,
      suspiciousIndicators: response.data.suspicious_indicators || [],
      metadataAnalysis: response.data.metadata_analysis || {},
      processingTime: response.executionTime,
      agentId: response.agentId
    };

    return result;
  } catch (error) {
    console.error('Media authenticity check error:', error);
    return null;
  }
}

/**
 * Experience Consistency Agent
 * Analyzes temporal consistency across video frames
 */
export async function analyzeConsistency(
  input: VideoAnalysisInput
): Promise<ConsistencyAnalysisResult | null> {
  try {
    const client = getOnDemandClient();
    
    if (!AGENT_IDS.EXPERIENCE_CONSISTENCY) {
      console.warn('Experience consistency agent ID not configured');
      return null;
    }

    const agentInput = {
      video_data: input.videoBase64 || input.videoUrl,
      filename: input.filename,
      analysis_type: "temporal_consistency"
    };

    const response = await client.executeAgent(
      AGENT_IDS.EXPERIENCE_CONSISTENCY,
      agentInput
    );

    if (!response.success || !response.data) {
      console.error('Consistency analysis failed:', response.error);
      return null;
    }

    const result: ConsistencyAnalysisResult = {
      consistencyScore: response.data.consistency_score || 0,
      temporalAnomalies: response.data.temporal_anomalies || [],
      frameAnalysis: response.data.frame_analysis || [],
      processingTime: response.executionTime,
      agentId: response.agentId
    };

    return result;
  } catch (error) {
    console.error('Consistency analysis error:', error);
    return null;
  }
}

/**
 * Orchestrate all OnDemand agents for comprehensive analysis
 */
export async function runComprehensiveAnalysis(
  input: VideoAnalysisInput
): Promise<{
  videoAnalysis: VideoAnalysisResult | null;
  authenticity: MediaAuthenticityResult | null;
  consistency: ConsistencyAnalysisResult | null;
  overallConfidence: number;
  processingTime: number;
}> {
  const startTime = Date.now();
  
  // Run agents in parallel where possible
  const [videoAnalysis, authenticity, consistency] = await Promise.all([
    analyzeVideoWithPerspectives(input),
    checkMediaAuthenticity(input),
    analyzeConsistency(input)
  ]);

  // Calculate overall confidence based on agent results
  let overallConfidence = 0;
  let confidenceCount = 0;

  if (videoAnalysis?.confidence) {
    overallConfidence += videoAnalysis.confidence;
    confidenceCount++;
  }

  if (authenticity?.confidence) {
    overallConfidence += authenticity.confidence;
    confidenceCount++;
  }

  if (consistency?.consistencyScore) {
    overallConfidence += consistency.consistencyScore;
    confidenceCount++;
  }

  overallConfidence = confidenceCount > 0 ? overallConfidence / confidenceCount : 0;

  return {
    videoAnalysis,
    authenticity,
    consistency,
    overallConfidence,
    processingTime: Date.now() - startTime
  };
}