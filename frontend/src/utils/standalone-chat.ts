/**
 * Standalone Chat Service for E-Raksha Chatbot
 * Provides intelligent responses without external APIs
 * Uses analysis context and smart response logic
 */

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
  responseTime?: number;
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

export class StandaloneChatService {
  private static instance: StandaloneChatService;

  static getInstance(): StandaloneChatService {
    if (!StandaloneChatService.instance) {
      StandaloneChatService.instance = new StandaloneChatService();
    }
    return StandaloneChatService.instance;
  }

  /**
   * Send a message and get an intelligent response
   */
  async sendMessage(
    userMessage: string, 
    analysisContext?: AnalysisContext
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // Simulate processing time for realistic feel
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      const response = this.generateIntelligentResponse(userMessage, analysisContext);
      
      return {
        success: true,
        message: response,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: "I apologize, but I encountered an error processing your message. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate intelligent responses based on user message and context
   */
  private generateIntelligentResponse(userMessage: string, analysisContext?: AnalysisContext): string {
    const lowerMessage = userMessage.toLowerCase();
    
    console.log('🤖 Generating response for:', userMessage);
    console.log('📊 Has analysis context:', !!analysisContext);
    if (analysisContext) {
      console.log('📊 Context filename:', analysisContext.filename);
    }
    
    // Analysis-specific responses (when user has analysis context)
    if (analysisContext) {
      console.log('✅ Using analysis-specific response');
      return this.getAnalysisSpecificResponse(lowerMessage, analysisContext);
    }
    
    // General responses (no analysis context)
    console.log('⚠️ Using general response (no analysis context)');
    return this.getGeneralResponse(lowerMessage);
  }

  /**
   * Generate responses specific to user's analysis results
   */
  private getAnalysisSpecificResponse(lowerMessage: string, analysis: AnalysisContext): string {
    const confidenceLevel = analysis.confidence > 0.8 ? 'high' : analysis.confidence > 0.6 ? 'moderate' : 'lower';
    const confidencePercentage = (analysis.confidence * 100).toFixed(1);
    const timeAgo = this.getTimeAgo(analysis.created_at);
    
    // Result explanation
    if (lowerMessage.includes('result') || lowerMessage.includes('mean') || lowerMessage.includes('analysis')) {
      let response = `I can see you analyzed "${analysis.filename}" ${timeAgo}. Here's what our Interceptor system found:\n\n`;
      
      if (analysis.prediction === 'fake') {
        response += `🚨 DEEPFAKE DETECTED\n`;
        response += `• Verdict: Manipulated/Fake video\n`;
        response += `• Confidence: ${confidencePercentage}% (${confidenceLevel} certainty)\n`;
        response += `• Risk Level: ${confidenceLevel === 'high' ? 'HIGH - Strong evidence of manipulation' : confidenceLevel === 'moderate' ? 'MEDIUM - Moderate signs of manipulation' : 'LOW - Some suspicious indicators'}\n\n`;
        
        response += `What this means: Your video shows clear signs of artificial generation or digital manipulation. `;
        if (analysis.confidence > 0.8) {
          response += `With ${confidencePercentage}% confidence, we're very certain this is not authentic content.`;
        } else if (analysis.confidence > 0.6) {
          response += `The ${confidencePercentage}% confidence suggests probable manipulation, though some features may be ambiguous.`;
        } else {
          response += `While we detected suspicious patterns, the ${confidencePercentage}% confidence means this should be verified manually.`;
        }
      } else {
        response += `✅ AUTHENTIC VIDEO\n`;
        response += `• Verdict: Real/Genuine video\n`;
        response += `• Confidence: ${confidencePercentage}% (${confidenceLevel} certainty)\n`;
        response += `• Safety Level: ${confidenceLevel === 'high' ? 'HIGH - Very likely authentic' : confidenceLevel === 'moderate' ? 'MEDIUM - Probably authentic' : 'LOW - Needs verification'}\n\n`;
        
        response += `What this means: Your video appears to be genuine, unmanipulated content. `;
        if (analysis.confidence > 0.8) {
          response += `With ${confidencePercentage}% confidence, we're very certain this is authentic.`;
        } else if (analysis.confidence > 0.6) {
          response += `The ${confidencePercentage}% confidence suggests it's likely real, though some characteristics made analysis challenging.`;
        } else {
          response += `While no clear manipulation was found, the ${confidencePercentage}% confidence suggests manual review might be helpful.`;
        }
      }
      
      response += `\n\nTechnical Details:\n`;
      response += `• Processing Time: ${analysis.processing_time}s\n`;
      response += `• Models Used: ${analysis.models_used.length} specialist models (${analysis.models_used.slice(0, 3).join(', ')}${analysis.models_used.length > 3 ? '...' : ''})\n`;
      response += `• File Size: ${this.getFileSizeFromName(analysis.filename)}\n`;
      
      if (analysis.enhanced_by_agents && analysis.ondemand_analysis) {
        response += `• Agent Enhancement: Yes (${analysis.ondemand_analysis.agents_used} agents provided additional insights)\n`;
      }
      
      return response;
    }
    
    // Confidence-related questions
    if (lowerMessage.includes('confidence') || lowerMessage.includes('sure') || lowerMessage.includes('certain')) {
      let response = `For your video "${analysis.filename}", the confidence score is ${confidencePercentage}%.\n\n`;
      
      if (analysis.confidence > 0.85) {
        response += `🎯 Very High Confidence\n`;
        response += `This is an extremely reliable result. Our models are very certain about the ${analysis.prediction} classification. You can trust this assessment with high confidence.`;
      } else if (analysis.confidence > 0.75) {
        response += `🎯 High Confidence\n`;
        response += `This is a reliable result. Our models show strong agreement on the ${analysis.prediction} classification. The evidence is clear and consistent.`;
      } else if (analysis.confidence > 0.6) {
        response += `⚖️ Moderate Confidence\n`;
        response += `This is a reasonably reliable result. While our models lean toward ${analysis.prediction}, there may be some ambiguous features that make the decision less certain.`;
      } else {
        response += `⚠️ Lower Confidence\n`;
        response += `This result should be interpreted carefully. The video has challenging characteristics that make classification difficult. Consider manual review or additional analysis.`;
      }
      
      response += `\n\nConfidence Breakdown:\n`;
      response += `• Score: ${confidencePercentage}% out of 100%\n`;
      response += `• Classification: ${analysis.prediction.toUpperCase()}\n`;
      response += `• Reliability: ${confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)}\n`;
      
      if (analysis.enhanced_by_agents && analysis.ondemand_analysis?.confidence_adjustment) {
        response += `• Agent Adjustment: +${(analysis.ondemand_analysis.confidence_adjustment * 100).toFixed(1)}% (agents improved accuracy)\n`;
      }
      
      return response;
    }
    
    // Agent-related questions
    if (lowerMessage.includes('agent') || lowerMessage.includes('discover') || lowerMessage.includes('found')) {
      if (analysis.enhanced_by_agents && analysis.ondemand_analysis) {
        let response = `🤖 Agent Analysis Results for "${analysis.filename}":\n\n`;
        
        if (analysis.ondemand_analysis.agent_insights) {
          response += `🎥 Quality Analysis Agent:\n${analysis.ondemand_analysis.agent_insights.agent1}\n\n`;
          response += `📊 Metadata Analysis Agent:\n${analysis.ondemand_analysis.agent_insights.agent2}\n\n`;
          response += `🔍 Content Analysis Agent:\n${analysis.ondemand_analysis.agent_insights.agent3}\n\n`;
        }
        
        response += `Agent Summary:\n`;
        response += `• Agents Used: ${analysis.ondemand_analysis.agents_used} specialist agents\n`;
        response += `• Enhancement: +${(analysis.ondemand_analysis.confidence_adjustment * 100).toFixed(1)}% confidence boost\n`;
        response += `• Final Result: ${analysis.prediction.toUpperCase()} with ${confidencePercentage}% confidence\n`;
        response += `• Processing: Enhanced analysis completed in ${analysis.processing_time}s\n`;
        
        return response;
      } else {
        return `Your analysis of "${analysis.filename}" was processed using our core specialist models without additional agent enhancement.\n\nModels Used: ${analysis.models_used.join(', ')}\n\nResult: ${analysis.prediction.toUpperCase()} detection with ${confidencePercentage}% confidence\n\nWhile this analysis wasn't enhanced by additional agents, our specialist models provided reliable detection based on the video's characteristics.`;
      }
    }
    
    // Specific video questions
    if (lowerMessage.includes('video') || lowerMessage.includes('file') || lowerMessage.includes(analysis.filename.toLowerCase().replace(/\.[^/.]+$/, ""))) {
      let response = `📹 About Your Video: "${analysis.filename}"\n\n`;
      response += `• Analyzed: ${timeAgo}\n`;
      response += `• Result: ${analysis.prediction.toUpperCase()} (${confidencePercentage}% confidence)\n`;
      response += `• Processing Time: ${analysis.processing_time} seconds\n`;
      response += `• Models: ${analysis.models_used.length} specialist models analyzed this video\n`;
      
      if (analysis.prediction === 'fake') {
        response += `\n🚨 Key Findings: This video contains signs of digital manipulation or artificial generation. The detection algorithms identified patterns consistent with deepfake technology.`;
      } else {
        response += `\n✅ Key Findings: This video appears to be authentic with no significant signs of manipulation detected by our analysis.`;
      }
      
      response += `\n\nWould you like me to explain the confidence score, describe what the models found, or provide recommendations for next steps?`;
      
      return response;
    }
    
    // Models-related questions  
    if (lowerMessage.includes('model') || lowerMessage.includes('which') || lowerMessage.includes('used')) {
      let response = `🧠 Models Used for "${analysis.filename}":\n\n`;
      
      analysis.models_used.forEach((model, index) => {
        response += `${index + 1}. ${model}\n`;
        if (model.includes('BG')) response += '   → Background & Compression Analysis\n   → Detects compression artifacts and background inconsistencies\n\n';
        else if (model.includes('AV')) response += '   → Audio-Visual Synchronization\n   → Checks if lip movements match speech patterns\n\n';
        else if (model.includes('CM')) response += '   → Compression Metadata Analysis\n   → Examines file encoding and compression signatures\n\n';
        else if (model.includes('RR')) response += '   → Resolution & Reconstruction Analysis\n   → Analyzes upscaling and resolution artifacts\n\n';
        else if (model.includes('LL')) response += '   → Low-Light Analysis\n   → Specialized for videos with challenging lighting\n\n';
        else if (model.includes('TM')) response += '   → Temporal Consistency Analysis\n   → Checks frame-to-frame consistency over time\n\n';
        else response += '   → Specialist Detection Model\n   → Advanced deepfake detection algorithms\n\n';
      });
      
      response += `How They Work Together:\n`;
      response += `• Each model specializes in different aspects of deepfake detection\n`;
      response += `• Results are combined using our agentic workflow\n`;
      response += `• Final confidence: ${confidencePercentage}% based on model consensus\n`;
      response += `• Processing completed in ${analysis.processing_time} seconds\n`;
      
      return response;
    }
    
    // Next steps / recommendations
    if (lowerMessage.includes('next') || lowerMessage.includes('should') || lowerMessage.includes('do') || lowerMessage.includes('recommend')) {
      let response = `📋 Recommendations for "${analysis.filename}" (${analysis.prediction.toUpperCase()}):\n\n`;
      
      if (analysis.prediction === 'fake') {
        response += `🚨 For Manipulated/Fake Video (${confidencePercentage}% confidence):\n\n`;
        response += `Immediate Actions:\n`;
        response += `• ⚠️ Do not share this video as authentic content\n`;
        response += `• 🔍 Investigate source - where did this video come from?\n`;
        response += `• 📋 Document findings - save this analysis for reference\n`;
        response += `• 🚨 Report if harmful - consider reporting malicious deepfakes\n\n`;
        
        response += `Verification Steps:\n`;
        response += `• 🔎 Reverse image search frames to find original content\n`;
        response += `• 📞 Contact source directly to verify authenticity\n`;
        response += `• 🔍 Look for inconsistencies in lighting, shadows, or facial features\n`;
        
        if (analysis.confidence < 0.7) {
          response += `\n⚠️ Note: Lower confidence (${confidencePercentage}%) suggests getting a second opinion or manual review might be helpful.`;
        }
      } else {
        response += `✅ For Authentic Video (${confidencePercentage}% confidence):\n\n`;
        response += `Safe Actions:\n`;
        response += `• ✅ Safe to share - no manipulation detected\n`;
        response += `• 💾 Archive original - keep the source file safe\n`;
        response += `• 📝 Document authenticity - save this analysis as proof\n`;
        response += `• 🔄 Use with confidence - this appears to be genuine content\n\n`;
        
        response += `Best Practices:\n`;
        response += `• 🛡️ Maintain chain of custody if this is evidence\n`;
        response += `• 📱 Share responsibly with proper context\n`;
        response += `• 🔍 Stay vigilant - always verify suspicious content\n`;
        
        if (analysis.confidence < 0.7) {
          response += `\n💡 Note: Lower confidence (${confidencePercentage}%) suggests staying alert, though no manipulation was clearly detected.`;
        }
      }
      
      response += `\n\nAnalysis Summary: Processed ${timeAgo} with ${analysis.models_used.length} models in ${analysis.processing_time}s`;
      
      return response;
    }
    
    // Default analysis-aware response with specific details
    const randomResponses = [
      `I can help you understand your analysis of "${analysis.filename}". This video was classified as ${analysis.prediction.toUpperCase()} with ${confidencePercentage}% confidence ${timeAgo}. What specific aspect interests you?`,
      
      `Your video "${analysis.filename}" shows a ${analysis.prediction.toUpperCase()} result (${confidencePercentage}% confidence). I can explain the confidence score, detail which models were used, or provide recommendations. What would you like to know?`,
      
      `Based on the analysis ${timeAgo}, "${analysis.filename}" was detected as ${analysis.prediction.toUpperCase()} with ${confidencePercentage}% confidence. I can dive deeper into the results, explain the technology, or suggest next steps. What interests you most?`
    ];
    
    return randomResponses[Math.floor(Math.random() * randomResponses.length)];
  }

  /**
   * Generate general responses when no analysis context is available
   */
  private getGeneralResponse(lowerMessage: string): string {
    // How it works
    if (lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('interceptor'))) {
      return `🛡️ How Interceptor Works:\n\nInterceptor uses an advanced agentic workflow with multiple specialist AI models to detect deepfakes:\n\n1. Video Upload & Preprocessing\n• Extract frames, audio, and metadata\n• Analyze technical characteristics\n\n2. Intelligent Routing\n• Smart agent routes video to appropriate specialist models\n• Based on compression, lighting, resolution, etc.\n\n3. Specialist Model Analysis\n• BG Model: Background/compression analysis\n• AV Model: Audio-visual synchronization\n• CM Model: Compression metadata\n• RR Model: Resolution reconstruction\n• LL Model: Low-light conditions\n• TM Model: Temporal consistency\n\n4. Agent Enhancement\n• Quality analysis agents assess video characteristics\n• Metadata agents examine file properties\n• Content agents analyze visual patterns\n\n5. Final Prediction\n• Aggregate results from all models and agents\n• Provide confidence score and explanation\n• Generate Grad-CAM heatmaps for transparency`;
    }
    
    // Agentic workflow
    if (lowerMessage.includes('agentic') || lowerMessage.includes('workflow') || lowerMessage.includes('agent')) {
      return `🤖 **Agentic Workflow in Interceptor:**\n\nOur agentic system uses intelligent agents to enhance deepfake detection:\n\n**🎯 Routing Agent**\n• Analyzes video characteristics\n• Routes to appropriate specialist models\n• Optimizes processing pipeline\n\n**🔍 Quality Analysis Agent**\n• Assesses video resolution, brightness, contrast\n• Evaluates compression artifacts\n• Determines optimal analysis parameters\n\n**📊 Metadata Analysis Agent**\n• Examines file creation timestamps\n• Analyzes encoding parameters\n• Detects suspicious modifications\n\n**👁️ Content Analysis Agent**\n• Analyzes facial consistency\n• Detects lighting anomalies\n• Identifies visual artifacts\n\n**Benefits:**\n• Higher accuracy through specialization\n• Adaptive processing based on video type\n• Explainable AI with detailed insights\n• Robust detection across various scenarios`;
    }
    
    // Deepfake detection general
    if (lowerMessage.includes('deepfake') || lowerMessage.includes('detection') || lowerMessage.includes('fake')) {
      return `🎭 **Deepfake Detection Technology:**\n\nDeepfakes are AI-generated videos that swap faces or manipulate content. Here's how we detect them:\n\n**🔍 Detection Methods:**\n• **Facial Inconsistencies**: Unnatural facial movements or expressions\n• **Temporal Artifacts**: Frame-to-frame inconsistencies\n• **Compression Patterns**: Unusual encoding signatures\n• **Audio-Visual Sync**: Mismatched lip movements and speech\n• **Metadata Analysis**: File modification indicators\n\n**⚡ Our Advantages:**\n• Multiple specialist models working together\n• Agentic workflow for intelligent processing\n• Real-time analysis (average 2.1 seconds)\n• High accuracy across different deepfake types\n• Explainable results with confidence scores\n\n**🎯 Accuracy:**\n• Overall detection confidence: ~94.9%\n• Tested on multiple deepfake datasets\n• Robust against various generation methods`;
    }
    
    // Accuracy and confidence
    if (lowerMessage.includes('accura') || lowerMessage.includes('confiden') || lowerMessage.includes('reliable')) {
      return `📊 **Interceptor Accuracy & Reliability:**\n\n**🎯 Performance Metrics:**\n• Overall Detection Accuracy: ~94.9%\n• Average Processing Time: 2.1 seconds\n• False Positive Rate: <5%\n• Tested on 47.2M parameters\n\n**🔍 Confidence Scoring:**\n• **High (80-99%)**: Very reliable, strong evidence\n• **Moderate (60-79%)**: Reasonably reliable, some ambiguity\n• **Lower (40-59%)**: Requires careful interpretation\n\n**🛡️ Reliability Features:**\n• Multiple model consensus\n• Agent-enhanced analysis\n• Grad-CAM visualization for transparency\n• Continuous model updates and improvements\n\n**⚖️ Limitations:**\n• Very high-quality deepfakes may be challenging\n• Extremely low-resolution videos may have lower accuracy\n• New deepfake techniques require model updates`;
    }
    
    // File formats and technical
    if (lowerMessage.includes('format') || lowerMessage.includes('file') || lowerMessage.includes('support')) {
      return `📁 **Supported File Formats & Technical Specs:**\n\n**🎥 Video Formats:**\n• MP4 (recommended)\n• AVI\n• MOV\n• WebM\n• MKV\n\n**📏 Technical Requirements:**\n• Maximum file size: 100MB\n• Minimum resolution: 240p\n• Maximum resolution: 4K\n• Duration: Up to 10 minutes\n• Frame rate: 15-60 FPS\n\n**⚡ Processing:**\n• Automatic format conversion\n• Frame extraction and analysis\n• Audio track processing\n• Metadata examination\n\n**💡 Tips for Best Results:**\n• Higher resolution videos = better accuracy\n• Good lighting conditions help detection\n• Avoid heavily compressed videos when possible`;
    }
    
    // Getting started
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('upload')) {
      return `🚀 **Getting Started with Interceptor:**\n\n**1. Upload Your Video**\n• Go to the Analysis page\n• Drag & drop or select your video file\n• Supported: MP4, AVI, MOV, WebM (up to 100MB)\n\n**2. Wait for Analysis**\n• Processing takes ~2.1 seconds on average\n• Our agentic workflow analyzes your video\n• Multiple specialist models work together\n\n**3. Review Results**\n• Get REAL or FAKE classification\n• See confidence percentage\n• View detailed analysis breakdown\n• Check Grad-CAM heatmaps\n\n**4. Ask Questions**\n• Use this chat to understand results\n• Get explanations about confidence levels\n• Learn about the detection process\n\n**💡 Pro Tip:** Upload a video first, then come back to chat for personalized insights about your specific analysis!`;
    }
    
    // Default helpful response
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return `👋 Hello! I'm your Interceptor AI Assistant.\n\nI can help you with:\n\nAnalysis Results (after you upload a video):\n• Explain your detection results\n• Clarify confidence scores\n• Detail which models were used\n• Provide recommendations\n\nSystem Information:\n• How Interceptor works\n• Agentic workflow explanation\n• Deepfake detection technology\n• Accuracy and reliability info\n\nGetting Started:\n• File format requirements\n• Upload process\n• Best practices for analysis\n\nWhat would you like to know? Try asking "How does Interceptor work?" or upload a video first for personalized analysis insights!`;
    }
    
    // Fallback response
    return `I'm here to help you understand Interceptor's deepfake detection system! I can explain:\n\n• How our agentic workflow works\n• Video analysis results and confidence scores\n• The technology behind deepfake detection\n• File requirements and best practices\n\nCould you be more specific about what you'd like to know? Or try uploading a video first for personalized analysis insights!`;
  }

  /**
   * Helper function to get time ago string
   */
  private getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Helper function to estimate file size from filename
   */
  private getFileSizeFromName(filename: string): string {
    // Simple estimation based on filename patterns
    if (filename.includes('4k') || filename.includes('4K')) return '~50-100MB';
    if (filename.includes('1080') || filename.includes('HD')) return '~20-50MB';
    if (filename.includes('720')) return '~10-30MB';
    return 'Standard size';
  }

  /**
   * Test the service (always returns true for standalone)
   */
  async testConnection(): Promise<boolean> {
    return true;
  }
}

// Export singleton instance
export const standaloneChatService = StandaloneChatService.getInstance();