/**
 * OnDemand Chat Service for E-Raksha Chatbot
 * Integrates with OnDemand.io Chat API for intelligent responses
 */

import { getOnDemandClient } from './ondemand-client';

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
  agentId?: string;
  executionTime?: number;
}

export interface AnalysisContext {
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
      agent1: string; // Quality Analysis
      agent2: string; // Metadata Analysis  
      agent3: string; // Content Analysis
    };
    confidence_adjustment: number;
  };
}

export class OnDemandChatService {
  private static instance: OnDemandChatService;
  private sessionId: string | null = null;
  private agentId = '696ae690c7d6dfdf7e337e7e'; // DEMO_VIDEO_ANALYSIS agent

  static getInstance(): OnDemandChatService {
    if (!OnDemandChatService.instance) {
      OnDemandChatService.instance = new OnDemandChatService();
    }
    return OnDemandChatService.instance;
  }

  /**
   * Create a chat session with OnDemand API
   */
  async createSession(): Promise<string | null> {
    try {
      const response = await fetch('https://api.on-demand.io/chat/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ONDEMAND_API_KEY}`,
          'X-Organization-ID': process.env.NEXT_PUBLIC_ONDEMAND_ORGANIZATION_ID || '696e5c1c994f1554f9f957fa'
        },
        body: JSON.stringify({
          agentId: this.agentId,
          context: {
            system: "You are an AI assistant for E-Raksha, a deepfake detection platform. You help users understand their video analysis results, explain how the agentic workflow works, and provide insights about deepfake detection. You have access to analysis results from multiple specialist models and OnDemand agents."
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.sessionId || data.id;
        return this.sessionId;
      }

      console.warn('Session creation failed, will use direct queries');
      return null;
    } catch (error) {
      console.warn('Session creation error:', error);
      return null;
    }
  }

  /**
   * Send a message to the OnDemand chat API
   */
  async sendMessage(
    userMessage: string, 
    analysisContext?: AnalysisContext
  ): Promise<ChatResponse> {
    try {
      // Ensure we have a session
      if (!this.sessionId) {
        await this.createSession();
      }

      // Build context-aware prompt
      const contextualPrompt = this.buildContextualPrompt(userMessage, analysisContext);

      const endpoint = 'https://api.on-demand.io/chat/v1/sessions/query';
      
      const payload = {
        agentId: this.agentId,
        sessionId: this.sessionId,
        query: contextualPrompt,
        context: analysisContext ? {
          hasAnalysis: true,
          filename: analysisContext.filename,
          prediction: analysisContext.prediction,
          confidence: analysisContext.confidence,
          enhanced_by_agents: analysisContext.enhanced_by_agents,
          agent_insights: analysisContext.ondemand_analysis?.agent_insights
        } : {
          hasAnalysis: false
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ONDEMAND_API_KEY}`,
          'X-Organization-ID': process.env.NEXT_PUBLIC_ONDEMAND_ORGANIZATION_ID || '696e5c1c994f1554f9f957fa'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.response || data.message || data.answer || 'I received your message but couldn\'t generate a proper response.',
          agentId: this.agentId,
          executionTime: data.executionTime
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('OnDemand chat error:', error);
      
      // Fallback response
      return {
        success: false,
        message: this.getFallbackResponse(userMessage, analysisContext),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build a contextual prompt based on user message and analysis context
   */
  private buildContextualPrompt(userMessage: string, analysisContext?: AnalysisContext): string {
    let prompt = `User Question: ${userMessage}\n\n`;

    if (analysisContext) {
      prompt += `Analysis Context:\n`;
      prompt += `- Video: ${analysisContext.filename}\n`;
      prompt += `- Result: ${analysisContext.prediction.toUpperCase()} (${(analysisContext.confidence * 100).toFixed(1)}% confidence)\n`;
      prompt += `- Models Used: ${analysisContext.models_used.join(', ')}\n`;
      prompt += `- Processing Time: ${analysisContext.processing_time}s\n`;
      
      if (analysisContext.enhanced_by_agents && analysisContext.ondemand_analysis) {
        prompt += `- Enhanced by OnDemand Agents: Yes\n`;
        prompt += `- Agents Used: ${analysisContext.ondemand_analysis.agents_used}\n`;
        
        if (analysisContext.ondemand_analysis.agent_insights) {
          prompt += `\nAgent Insights:\n`;
          prompt += `- Quality Analysis: ${analysisContext.ondemand_analysis.agent_insights.agent1}\n`;
          prompt += `- Metadata Analysis: ${analysisContext.ondemand_analysis.agent_insights.agent2}\n`;
          prompt += `- Content Analysis: ${analysisContext.ondemand_analysis.agent_insights.agent3}\n`;
        }
      }
      
      prompt += `\nPlease provide a helpful response about this analysis result. Be specific about the findings and explain what they mean for the user.`;
    } else {
      prompt += `Context: The user is asking a general question about E-Raksha's deepfake detection system or agentic workflow. Please provide helpful information about how our system works, what our OnDemand agents do, or general guidance about deepfake detection.`;
    }

    return prompt;
  }

  /**
   * Provide fallback responses when OnDemand API is unavailable
   */
  private getFallbackResponse(userMessage: string, analysisContext?: AnalysisContext): string {
    const lowerMessage = userMessage.toLowerCase();

    if (analysisContext) {
      if (lowerMessage.includes('result') || lowerMessage.includes('mean')) {
        return `Based on your analysis of "${analysisContext.filename}", our system detected this video as ${analysisContext.prediction.toUpperCase()} with ${(analysisContext.confidence * 100).toFixed(1)}% confidence. ${analysisContext.enhanced_by_agents ? 'This analysis was enhanced by our OnDemand agents for more accurate detection.' : 'The analysis used our specialist models for detection.'}`;
      }
      
      if (lowerMessage.includes('agent') || lowerMessage.includes('ondemand')) {
        if (analysisContext.enhanced_by_agents && analysisContext.ondemand_analysis) {
          return `Our OnDemand agents provided additional insights for your video analysis:\n\n• Quality Analysis: Assessed video technical quality\n• Metadata Analysis: Examined file metadata patterns\n• Content Analysis: Analyzed visual content for anomalies\n\nThese agents helped achieve a confidence score of ${(analysisContext.confidence * 100).toFixed(1)}%.`;
        } else {
          return `Your analysis wasn't processed by OnDemand agents, but our specialist models (${analysisContext.models_used.join(', ')}) provided the detection result.`;
        }
      }
      
      if (lowerMessage.includes('confidence') || lowerMessage.includes('sure')) {
        return `The confidence score of ${(analysisContext.confidence * 100).toFixed(1)}% indicates ${analysisContext.confidence > 0.8 ? 'high' : analysisContext.confidence > 0.6 ? 'moderate' : 'lower'} certainty in the ${analysisContext.prediction} classification. ${analysisContext.enhanced_by_agents ? 'OnDemand agents helped refine this confidence score.' : ''}`;
      }
    }

    // General fallback responses
    if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      return `E-Raksha uses an agentic workflow with multiple specialist models and OnDemand agents to detect deepfakes. The system analyzes video quality, metadata, and content patterns to provide accurate detection results.`;
    }

    if (lowerMessage.includes('agent')) {
      return `Our OnDemand agents include:\n• Quality Analysis Agent - Assesses technical video quality\n• Metadata Analysis Agent - Examines file metadata\n• Content Analysis Agent - Analyzes visual content\n\nThese agents work together to enhance detection accuracy.`;
    }

    return `I'm here to help you understand your video analysis results and how our agentic deepfake detection system works. Could you please be more specific about what you'd like to know?`;
  }

  /**
   * Test the OnDemand connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage("Hello, can you help me understand how E-Raksha works?");
      return response.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const onDemandChat = OnDemandChatService.getInstance();