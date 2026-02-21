// Interceptor Extension Content Script
class ContentScript {
  constructor() {
    this.overlayVisible = false;
    this.scanResults = [];
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupMessageHandlers();
    this.setupMediaObserver();
    this.addMediaEventListeners();
  }

  injectStyles() {
    // Inject CSS for overlay and indicators
    const style = document.createElement('style');
    style.textContent = `
      .interceptor-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .interceptor-overlay.visible {
        transform: translateX(0);
      }

      .interceptor-overlay-header {
        background: #3b82f6;
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .interceptor-overlay-title {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .interceptor-overlay-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .interceptor-overlay-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .interceptor-overlay-content {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }

      .interceptor-scan-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 12px;
        border: 1px solid #e2e8f0;
      }

      .interceptor-scan-item.fake {
        background: #fef2f2;
        border-color: #fecaca;
      }

      .interceptor-scan-item.suspicious {
        background: #fffbeb;
        border-color: #fed7aa;
      }

      .interceptor-scan-item.safe {
        background: #f0fdf4;
        border-color: #bbf7d0;
      }

      .interceptor-scan-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        background: #e2e8f0;
      }

      .interceptor-scan-info {
        flex: 1;
        min-width: 0;
      }

      .interceptor-scan-title {
        font-size: 14px;
        font-weight: 500;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .interceptor-scan-result {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }

      .interceptor-scan-confidence {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .interceptor-scan-confidence.high {
        background: #dcfce7;
        color: #166534;
      }

      .interceptor-scan-confidence.medium {
        background: #fef3c7;
        color: #92400e;
      }

      .interceptor-scan-confidence.low {
        background: #fee2e2;
        color: #991b1b;
      }

      .interceptor-media-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .interceptor-media-indicator.safe {
        background: #10b981;
        color: white;
      }

      .interceptor-media-indicator.suspicious {
        background: #f59e0b;
        color: white;
      }

      .interceptor-media-indicator.fake {
        background: #ef4444;
        color: white;
        animation: pulse 2s infinite;
      }

      .interceptor-media-indicator:hover {
        transform: scale(1.1);
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .interceptor-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #64748b;
      }

      .interceptor-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e2e8f0;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 12px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .interceptor-no-results {
        text-align: center;
        padding: 40px 20px;
        color: #64748b;
      }

      @media (prefers-color-scheme: dark) {
        .interceptor-overlay {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }

        .interceptor-scan-item {
          background: #334155;
          border-color: #475569;
        }

        .interceptor-scan-item.fake {
          background: #450a0a;
          border-color: #7f1d1d;
        }

        .interceptor-scan-item.suspicious {
          background: #451a03;
          border-color: #78350f;
        }

        .interceptor-scan-item.safe {
          background: #052e16;
          border-color: #166534;
        }

        .interceptor-scan-title {
          color: #f8fafc;
        }

        .interceptor-scan-result {
          color: #cbd5e1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupMessageHandlers() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'scanPage':
          this.scanCurrentPage();
          break;
        case 'showResults':
          this.showOverlay(request.results);
          break;
        case 'hideOverlay':
          this.hideOverlay();
          break;
      }
    });
  }

  setupMediaObserver() {
    // Observe DOM changes to detect new media elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const mediaElements = node.querySelectorAll('video, img');
            mediaElements.forEach((element) => {
              this.addMediaEventListener(element);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addMediaEventListeners() {
    // Add event listeners to existing media elements
    document.querySelectorAll('video, img').forEach((element) => {
      this.addMediaEventListener(element);
    });
  }

  addMediaEventListener(element) {
    // Skip if already processed
    if (element.dataset.interceptorProcessed) return;
    element.dataset.interceptorProcessed = 'true';

    // Add click handler for quick analysis
    element.addEventListener('contextmenu', (e) => {
      // Add a small delay to allow context menu to appear
      setTimeout(() => {
        this.analyzeMediaElement(element);
      }, 100);
    });

    // For videos, also listen to play events
    if (element.tagName === 'VIDEO') {
      element.addEventListener('play', () => {
        this.checkAutoScan(element);
      });
    }

    // For images, check when they load
    if (element.tagName === 'IMG' && element.complete) {
      this.checkAutoScan(element);
    } else if (element.tagName === 'IMG') {
      element.addEventListener('load', () => {
        this.checkAutoScan(element);
      });
    }
  }

  async checkAutoScan(element) {
    // Check if auto-scan is enabled
    const settings = await chrome.storage.sync.get(['autoScan']);
    if (!settings.autoScan) return;

    // Only auto-scan larger media elements
    const rect = element.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 200) return;

    // Avoid scanning the same element multiple times
    if (element.dataset.interceptorScanned) return;
    element.dataset.interceptorScanned = 'true';

    this.analyzeMediaElement(element, true);
  }

  async analyzeMediaElement(element, isAutoScan = false) {
    const src = element.src || element.currentSrc;
    if (!src) return;

    const type = element.tagName.toLowerCase();
    
    try {
      // Show loading indicator
      if (!isAutoScan) {
        this.addLoadingIndicator(element);
      }

      // Send analysis request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeMedia',
        url: src,
        type: type
      });

      if (response.success) {
        this.addMediaIndicator(element, response.result);
        
        // Store result for overlay display
        this.scanResults.push({
          element: element,
          src: src,
          type: type,
          result: response.result
        });

        // Show notification for suspicious content (only if not auto-scan)
        if (!isAutoScan && (response.result.prediction === 'fake' || response.result.prediction === 'suspicious')) {
          this.showQuickNotification(
            `${response.result.prediction.toUpperCase()} detected (${(response.result.confidence * 100).toFixed(1)}% confidence)`,
            response.result.prediction === 'fake' ? 'error' : 'warning'
          );
        }
      }
    } catch (error) {
      console.error('Media analysis failed:', error);
    } finally {
      this.removeLoadingIndicator(element);
    }
  }

  addLoadingIndicator(element) {
    const indicator = document.createElement('div');
    indicator.className = 'interceptor-media-indicator interceptor-loading-indicator';
    indicator.innerHTML = '<div class="interceptor-spinner"></div>';
    indicator.style.background = '#3b82f6';
    
    element.style.position = 'relative';
    element.parentNode.appendChild(indicator);
    
    // Position the indicator
    const rect = element.getBoundingClientRect();
    indicator.style.position = 'absolute';
    indicator.style.top = (rect.top + window.scrollY + 8) + 'px';
    indicator.style.left = (rect.right + window.scrollX - 32) + 'px';
  }

  removeLoadingIndicator(element) {
    const indicator = element.parentNode?.querySelector('.interceptor-loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  addMediaIndicator(element, result) {
    // Remove any existing indicator
    const existingIndicator = element.parentNode?.querySelector('.interceptor-media-indicator:not(.interceptor-loading-indicator)');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.className = `interceptor-media-indicator ${result.prediction}`;
    
    // Set indicator content based on result
    if (result.prediction === 'fake') {
      indicator.textContent = '⚠';
      indicator.title = `DEEPFAKE DETECTED (${(result.confidence * 100).toFixed(1)}% confidence)`;
    } else if (result.prediction === 'suspicious') {
      indicator.textContent = '?';
      indicator.title = `SUSPICIOUS (${(result.confidence * 100).toFixed(1)}% confidence)`;
    } else {
      indicator.textContent = '✓';
      indicator.title = `AUTHENTIC (${(result.confidence * 100).toFixed(1)}% confidence)`;
    }

    // Add click handler to show details
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showResultDetails(result, element);
    });

    element.style.position = 'relative';
    element.parentNode.appendChild(indicator);
    
    // Position the indicator
    const rect = element.getBoundingClientRect();
    indicator.style.position = 'absolute';
    indicator.style.top = (rect.top + window.scrollY + 8) + 'px';
    indicator.style.left = (rect.right + window.scrollX - 32) + 'px';
  }

  showResultDetails(result, element) {
    const modal = document.createElement('div');
    modal.className = 'interceptor-result-modal';
    modal.innerHTML = `
      <div class="interceptor-modal-backdrop">
        <div class="interceptor-modal-content">
          <div class="interceptor-modal-header">
            <h3>Analysis Result</h3>
            <button class="interceptor-modal-close">×</button>
          </div>
          <div class="interceptor-modal-body">
            <div class="interceptor-result-summary">
              <div class="interceptor-result-prediction ${result.prediction}">
                ${result.prediction.toUpperCase()}
              </div>
              <div class="interceptor-result-confidence">
                ${(result.confidence * 100).toFixed(1)}% confidence
              </div>
            </div>
            <div class="interceptor-result-details">
              <p><strong>Models used:</strong> ${result.models_used.join(', ')}</p>
              <p><strong>Processing time:</strong> ${result.processing_time}</p>
              <p><strong>Media type:</strong> ${result.media_type}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      .interceptor-result-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 20000;
      }
      .interceptor-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .interceptor-modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 400px;
        overflow: hidden;
      }
      .interceptor-modal-header {
        background: #3b82f6;
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .interceptor-modal-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      }
      .interceptor-modal-body {
        padding: 20px;
      }
      .interceptor-result-summary {
        text-align: center;
        margin-bottom: 20px;
      }
      .interceptor-result-prediction {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .interceptor-result-prediction.fake {
        color: #ef4444;
      }
      .interceptor-result-prediction.suspicious {
        color: #f59e0b;
      }
      .interceptor-result-prediction.real {
        color: #10b981;
      }
      .interceptor-result-confidence {
        font-size: 18px;
        color: #64748b;
      }
      .interceptor-result-details {
        font-size: 14px;
        line-height: 1.5;
      }
      .interceptor-result-details p {
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(modalStyle);

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.interceptor-modal-close').addEventListener('click', () => {
      modal.remove();
      modalStyle.remove();
    });

    modal.querySelector('.interceptor-modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.remove();
        modalStyle.remove();
      }
    });
  }

  async scanCurrentPage() {
    this.showOverlay([], true); // Show loading state
    
    const mediaElements = this.findAllMedia();
    const results = [];

    for (const media of mediaElements.slice(0, 10)) { // Limit to 10 items
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'analyzeMedia',
          url: media.src,
          type: media.type
        });

        if (response.success) {
          results.push({
            media: media,
            result: response.result
          });
        }
      } catch (error) {
        console.error('Failed to analyze media:', media, error);
      }
    }

    this.showOverlay(results);
  }

  findAllMedia() {
    const mediaElements = [];
    
    // Find videos
    document.querySelectorAll('video').forEach(video => {
      if (video.src || video.currentSrc) {
        mediaElements.push({
          type: 'video',
          src: video.src || video.currentSrc,
          element: video
        });
      }
    });

    // Find images
    document.querySelectorAll('img').forEach(img => {
      if (img.src && img.complete && img.naturalWidth > 100) {
        mediaElements.push({
          type: 'image',
          src: img.src,
          element: img
        });
      }
    });

    return mediaElements;
  }

  showOverlay(results, loading = false) {
    // Remove existing overlay
    const existingOverlay = document.querySelector('.interceptor-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'interceptor-overlay';
    
    let content;
    if (loading) {
      content = `
        <div class="interceptor-overlay-header">
          <div class="interceptor-overlay-title">
            🔍 Interceptor
          </div>
          <button class="interceptor-overlay-close">×</button>
        </div>
        <div class="interceptor-overlay-content">
          <div class="interceptor-loading">
            <div class="interceptor-spinner"></div>
            Scanning page for media...
          </div>
        </div>
      `;
    } else if (results.length === 0) {
      content = `
        <div class="interceptor-overlay-header">
          <div class="interceptor-overlay-title">
            🔍 Interceptor
          </div>
          <button class="interceptor-overlay-close">×</button>
        </div>
        <div class="interceptor-overlay-content">
          <div class="interceptor-no-results">
            No media found on this page
          </div>
        </div>
      `;
    } else {
      const resultItems = results.map(item => this.createResultItem(item)).join('');
      content = `
        <div class="interceptor-overlay-header">
          <div class="interceptor-overlay-title">
            🔍 Interceptor - ${results.length} items scanned
          </div>
          <button class="interceptor-overlay-close">×</button>
        </div>
        <div class="interceptor-overlay-content">
          ${resultItems}
        </div>
      `;
    }

    overlay.innerHTML = content;
    document.body.appendChild(overlay);

    // Add event listeners
    overlay.querySelector('.interceptor-overlay-close').addEventListener('click', () => {
      this.hideOverlay();
    });

    // Show overlay with animation
    setTimeout(() => {
      overlay.classList.add('visible');
    }, 10);

    // Auto-hide after 10 seconds if not loading
    if (!loading) {
      setTimeout(() => {
        this.hideOverlay();
      }, 10000);
    }
  }

  createResultItem(item) {
    const { media, result } = item;
    const confidenceClass = result.confidence > 0.8 ? 'high' : 
                           result.confidence > 0.5 ? 'medium' : 'low';
    
    const filename = media.src.split('/').pop().substring(0, 30);
    
    return `
      <div class="interceptor-scan-item ${result.prediction}">
        <div class="interceptor-scan-icon" style="background-image: url('${media.type === 'image' ? media.src : ''}')"></div>
        <div class="interceptor-scan-info">
          <div class="interceptor-scan-title">${filename}</div>
          <div class="interceptor-scan-result">${result.prediction.toUpperCase()} - ${media.type}</div>
        </div>
        <div class="interceptor-scan-confidence ${confidenceClass}">
          ${(result.confidence * 100).toFixed(1)}%
        </div>
      </div>
    `;
  }

  hideOverlay() {
    const overlay = document.querySelector('.interceptor-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  }

  showQuickNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `interceptor-notification interceptor-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      z-index: 15000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript();
  });
} else {
  new ContentScript();
}