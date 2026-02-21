// Interceptor Extension Background Script
class ExtensionBackground {
  constructor() {
    this.apiEndpoint = 'http://localhost:8000';
    this.init();
  }

  init() {
    this.setupContextMenus();
    this.setupMessageHandlers();
    this.setupTabHandlers();
    this.setupAlarms();
  }

  setupContextMenus() {
    // Create context menu items
    chrome.runtime.onInstalled.addListener(() => {
      // Context menu for images
      chrome.contextMenus.create({
        id: 'analyzeImage',
        title: 'Analyze with Interceptor',
        contexts: ['image']
      });

      // Context menu for videos
      chrome.contextMenus.create({
        id: 'analyzeVideo',
        title: 'Analyze with Interceptor',
        contexts: ['video']
      });

      // Context menu for links
      chrome.contextMenus.create({
        id: 'analyzeLink',
        title: 'Analyze media with Interceptor',
        contexts: ['link']
      });

      // Context menu for page
      chrome.contextMenus.create({
        id: 'scanPage',
        title: 'Scan page for deepfakes',
        contexts: ['page']
      });
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  setupMessageHandlers() {
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  setupTabHandlers() {
    // Monitor tab updates for auto-scanning
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        const settings = await chrome.storage.sync.get(['autoScan']);
        if (settings.autoScan) {
          this.autoScanTab(tabId, tab);
        }
      }
    });
  }

  setupAlarms() {
    // Set up periodic tasks
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'cleanupStorage') {
        this.cleanupStorage();
      }
    });

    // Create cleanup alarm (runs daily)
    chrome.alarms.create('cleanupStorage', {
      delayInMinutes: 60,
      periodInMinutes: 24 * 60 // 24 hours
    });
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'analyzeImage':
          await this.analyzeMediaFromUrl(info.srcUrl, 'image', tab);
          break;
        case 'analyzeVideo':
          await this.analyzeMediaFromUrl(info.srcUrl, 'video', tab);
          break;
        case 'analyzeLink':
          await this.analyzeMediaFromUrl(info.linkUrl, 'link', tab);
          break;
        case 'scanPage':
          await this.scanPageForMedia(tab);
          break;
      }
    } catch (error) {
      console.error('Context menu action failed:', error);
      this.showNotification('Analysis failed: ' + error.message, 'error');
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'analyzeMedia':
          const result = await this.analyzeMediaFromUrl(request.url, request.type);
          sendResponse({ success: true, result });
          break;
        
        case 'scanPage':
          const scanResults = await this.scanPageForMedia(sender.tab);
          sendResponse({ success: true, results: scanResults });
          break;
        
        case 'getSettings':
          const settings = await chrome.storage.sync.get();
          sendResponse({ success: true, settings });
          break;
        
        case 'saveSettings':
          await chrome.storage.sync.set(request.settings);
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async analyzeMediaFromUrl(url, type, tab = null) {
    try {
      // Show loading notification
      this.showNotification('Analyzing media...', 'info');

      // For demo purposes, simulate analysis
      // In real implementation, you'd download and analyze the media
      const mockResult = this.generateMockAnalysis(url, type);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show result notification
      const resultText = mockResult.prediction === 'fake' ? 
        `⚠️ DEEPFAKE DETECTED (${(mockResult.confidence * 100).toFixed(1)}% confidence)` :
        `✅ Media appears authentic (${(mockResult.confidence * 100).toFixed(1)}% confidence)`;
      
      this.showNotification(resultText, mockResult.prediction === 'fake' ? 'error' : 'success');

      // Save to recent scans
      if (tab) {
        await this.saveAnalysisResult({
          url: tab.url,
          title: tab.title,
          mediaUrl: url,
          mediaType: type,
          result: mockResult,
          timestamp: Date.now()
        });
      }

      return mockResult;
    } catch (error) {
      this.showNotification('Analysis failed: ' + error.message, 'error');
      throw error;
    }
  }

  async scanPageForMedia(tab) {
    try {
      // Inject content script to find media
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.findMediaOnPage
      });

      const mediaElements = results[0].result;
      
      if (mediaElements.length === 0) {
        this.showNotification('No media found on this page', 'info');
        return [];
      }

      this.showNotification(`Found ${mediaElements.length} media items. Analyzing...`, 'info');

      // Analyze each media item (limit to 5 for performance)
      const analysisResults = [];
      for (const media of mediaElements.slice(0, 5)) {
        try {
          const result = await this.analyzeMediaFromUrl(media.src, media.type);
          analysisResults.push({
            media: media,
            result: result
          });
        } catch (error) {
          console.error('Failed to analyze media:', media, error);
        }
      }

      // Show summary notification
      const fakeCount = analysisResults.filter(r => r.result.prediction === 'fake').length;
      const suspiciousCount = analysisResults.filter(r => r.result.prediction === 'suspicious').length;
      
      let summaryText;
      if (fakeCount > 0) {
        summaryText = `⚠️ Found ${fakeCount} potential deepfake(s)`;
      } else if (suspiciousCount > 0) {
        summaryText = `⚠️ Found ${suspiciousCount} suspicious media item(s)`;
      } else {
        summaryText = `✅ All media appears authentic`;
      }
      
      this.showNotification(summaryText, fakeCount > 0 ? 'error' : suspiciousCount > 0 ? 'warning' : 'success');

      // Save scan results
      await this.saveScanResults({
        url: tab.url,
        title: tab.title,
        results: analysisResults,
        timestamp: Date.now()
      });

      return analysisResults;
    } catch (error) {
      this.showNotification('Page scan failed: ' + error.message, 'error');
      throw error;
    }
  }

  findMediaOnPage() {
    // This function runs in the content script context
    const mediaElements = [];
    
    // Find video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.src || video.currentSrc) {
        mediaElements.push({
          type: 'video',
          src: video.src || video.currentSrc,
          width: video.videoWidth || video.clientWidth,
          height: video.videoHeight || video.clientHeight
        });
      }
    });

    // Find image elements
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && img.complete && img.naturalWidth > 100 && img.naturalHeight > 100) {
        mediaElements.push({
          type: 'image',
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });

    // Find embedded media
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src;
      if (src && (src.includes('youtube.com') || src.includes('vimeo.com') || 
                  src.includes('tiktok.com') || src.includes('instagram.com'))) {
        mediaElements.push({
          type: 'embedded',
          src: src,
          width: iframe.clientWidth,
          height: iframe.clientHeight
        });
      }
    });

    return mediaElements;
  }

  async autoScanTab(tabId, tab) {
    // Only auto-scan certain domains to avoid spam
    const allowedDomains = [
      'youtube.com', 'tiktok.com', 'instagram.com', 'twitter.com', 
      'facebook.com', 'reddit.com', 'linkedin.com'
    ];
    
    const url = new URL(tab.url);
    const isAllowedDomain = allowedDomains.some(domain => url.hostname.includes(domain));
    
    if (!isAllowedDomain) return;

    try {
      // Wait a bit for page to load completely
      setTimeout(async () => {
        const results = await this.scanPageForMedia(tab);
        
        // Only show notification if suspicious content is found
        const suspiciousResults = results.filter(r => 
          r.result.prediction === 'fake' || r.result.prediction === 'suspicious'
        );
        
        if (suspiciousResults.length > 0) {
          this.showNotification(
            `Auto-scan detected ${suspiciousResults.length} suspicious media item(s)`,
            'warning'
          );
        }
      }, 3000);
    } catch (error) {
      console.error('Auto-scan failed:', error);
    }
  }

  generateMockAnalysis(url, type) {
    // Generate realistic mock analysis
    const random = Math.random();
    const isSuspiciousDomain = url.includes('tiktok') || url.includes('deepfake') || 
                              url.includes('fake') || url.includes('synthetic');
    
    let prediction, confidence;
    
    if (isSuspiciousDomain || random < 0.15) {
      prediction = random < 0.7 ? 'fake' : 'suspicious';
      confidence = 0.6 + Math.random() * 0.3;
    } else {
      prediction = 'real';
      confidence = 0.8 + Math.random() * 0.15;
    }

    return {
      prediction,
      confidence,
      models_used: prediction === 'fake' ? 
        ['BG-Model-N', 'CM-Model-N', 'AV-Model-N'] : 
        ['BG-Model-N'],
      processing_time: (1.2 + Math.random() * 2).toFixed(1) + 's',
      media_type: type,
      url: url
    };
  }

  async saveAnalysisResult(data) {
    const storage = await chrome.storage.local.get(['analysisHistory']);
    const history = storage.analysisHistory || [];
    
    history.unshift(data);
    if (history.length > 100) history.pop(); // Keep only 100 recent analyses
    
    await chrome.storage.local.set({ analysisHistory: history });
  }

  async saveScanResults(data) {
    const storage = await chrome.storage.local.get(['scanHistory']);
    const history = storage.scanHistory || [];
    
    history.unshift(data);
    if (history.length > 50) history.pop(); // Keep only 50 recent scans
    
    await chrome.storage.local.set({ scanHistory: history });
  }

  async cleanupStorage() {
    // Clean up old data to prevent storage bloat
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const storage = await chrome.storage.local.get(['analysisHistory', 'scanHistory']);
    
    if (storage.analysisHistory) {
      const filteredAnalysis = storage.analysisHistory.filter(
        item => item.timestamp > oneWeekAgo
      );
      await chrome.storage.local.set({ analysisHistory: filteredAnalysis });
    }
    
    if (storage.scanHistory) {
      const filteredScans = storage.scanHistory.filter(
        item => item.timestamp > oneWeekAgo
      );
      await chrome.storage.local.set({ scanHistory: filteredScans });
    }
  }

  showNotification(message, type = 'info') {
    const settings = chrome.storage.sync.get(['notifications']);
    settings.then(data => {
      if (data.notifications !== false) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Interceptor',
          message: message
        });
      }
    });
  }
}

// Initialize background script
new ExtensionBackground();