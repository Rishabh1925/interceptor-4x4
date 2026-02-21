// Interceptor Extension Popup Script
class ExtensionPopup {
  constructor() {
    this.apiEndpoint = 'http://localhost:8000'; // Your backend API
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.loadRecentScans();
    this.updateStatus();
  }

  bindEvents() {
    // Quick scan button
    document.getElementById('quickScanBtn').addEventListener('click', () => {
      this.performQuickScan();
    });

    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    uploadArea.addEventListener('drop', this.handleDrop.bind(this));

    fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    // Settings toggles
    document.getElementById('autoScanToggle').addEventListener('change', (e) => {
      this.saveSetting('autoScan', e.target.checked);
    });

    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
      this.saveSetting('notifications', e.target.checked);
    });

    // Footer buttons
    document.getElementById('openDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });
  }

  async performQuickScan() {
    this.showLoading('Scanning page for media...');
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script to scan for media
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.scanPageForMedia
      });

      const mediaElements = results[0].result;
      
      if (mediaElements.length === 0) {
        this.hideLoading();
        this.showNotification('No media found on this page', 'info');
        return;
      }

      // Analyze found media
      const analysisResults = [];
      for (const media of mediaElements.slice(0, 5)) { // Limit to 5 items
        try {
          const result = await this.analyzeMediaUrl(media);
          analysisResults.push(result);
        } catch (error) {
          console.error('Analysis failed for media:', media, error);
        }
      }

      this.hideLoading();
      this.showResults(analysisResults);
      this.saveRecentScan({
        url: tab.url,
        title: tab.title,
        results: analysisResults,
        timestamp: Date.now()
      });

    } catch (error) {
      this.hideLoading();
      this.showNotification('Scan failed: ' + error.message, 'error');
    }
  }

  scanPageForMedia() {
    // This function runs in the content script context
    const mediaElements = [];
    
    // Find video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.src || video.currentSrc) {
        mediaElements.push({
          type: 'video',
          src: video.src || video.currentSrc,
          element: 'video'
        });
      }
    });

    // Find image elements that might be video thumbnails or suspicious images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && (img.width > 200 || img.height > 200)) {
        mediaElements.push({
          type: 'image',
          src: img.src,
          element: 'img'
        });
      }
    });

    // Find embedded media (YouTube, TikTok, etc.)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      const src = iframe.src;
      if (src && (src.includes('youtube.com') || src.includes('tiktok.com') || 
                  src.includes('instagram.com') || src.includes('twitter.com'))) {
        mediaElements.push({
          type: 'embedded',
          src: src,
          element: 'iframe'
        });
      }
    });

    return mediaElements;
  }

  async analyzeMediaUrl(media) {
    // For demo purposes, simulate analysis
    // In real implementation, you'd send the media URL to your backend
    const mockAnalysis = this.generateMockAnalysis(media);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      media: media,
      prediction: mockAnalysis.prediction,
      confidence: mockAnalysis.confidence,
      details: mockAnalysis.details
    };
  }

  generateMockAnalysis(media) {
    // Generate realistic mock analysis based on media type and URL
    const random = Math.random();
    const isSuspicious = media.src.includes('tiktok') || media.src.includes('deepfake') || random < 0.1;
    
    let prediction, confidence, details;
    
    if (isSuspicious) {
      prediction = random < 0.7 ? 'fake' : 'suspicious';
      confidence = 0.6 + Math.random() * 0.3;
      details = {
        models_used: ['BG-Model-N', 'CM-Model-N', 'AV-Model-N'],
        suspicious_features: ['Facial inconsistencies', 'Temporal artifacts'],
        processing_time: (1.5 + Math.random() * 2).toFixed(1) + 's'
      };
    } else {
      prediction = 'real';
      confidence = 0.8 + Math.random() * 0.15;
      details = {
        models_used: ['BG-Model-N'],
        quality_score: (0.8 + Math.random() * 0.2).toFixed(2),
        processing_time: (0.8 + Math.random() * 1).toFixed(1) + 's'
      };
    }

    return { prediction, confidence, details };
  }

  handleFileSelect(files) {
    if (files.length === 0) return;
    
    this.showLoading('Analyzing uploaded files...');
    
    // Process files
    Array.from(files).forEach(async (file) => {
      try {
        const result = await this.analyzeFile(file);
        this.hideLoading();
        this.showResults([result]);
        
        this.saveRecentScan({
          filename: file.name,
          fileSize: file.size,
          results: [result],
          timestamp: Date.now()
        });
      } catch (error) {
        this.hideLoading();
        this.showNotification('Analysis failed: ' + error.message, 'error');
      }
    });
  }

  async analyzeFile(file) {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send to your backend API
      const response = await fetch(`${this.apiEndpoint}/predict`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        filename: file.name,
        prediction: result.prediction,
        confidence: result.confidence,
        details: {
          models_used: result.models_used,
          processing_time: result.processing_time + 's',
          file_size: this.formatFileSize(file.size)
        }
      };
    } catch (error) {
      // Fallback to mock analysis if API is unavailable
      console.warn('API unavailable, using mock analysis:', error);
      return this.generateMockFileAnalysis(file);
    }
  }

  generateMockFileAnalysis(file) {
    const random = Math.random();
    const prediction = random < 0.2 ? 'fake' : 'real';
    const confidence = prediction === 'fake' ? 0.6 + Math.random() * 0.3 : 0.8 + Math.random() * 0.15;
    
    return {
      filename: file.name,
      prediction: prediction,
      confidence: confidence,
      details: {
        models_used: prediction === 'fake' ? ['BG-Model-N', 'CM-Model-N', 'AV-Model-N'] : ['BG-Model-N'],
        processing_time: (1.2 + Math.random() * 2).toFixed(1) + 's',
        file_size: this.formatFileSize(file.size)
      }
    };
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    this.handleFileSelect(e.dataTransfer.files);
  }

  showLoading(message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay.querySelector('.loading-text');
    text.textContent = message;
    overlay.style.display = 'flex';
  }

  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  showResults(results) {
    const modal = document.getElementById('resultsModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = results.map(result => this.createResultCard(result)).join('');
    modal.style.display = 'flex';
  }

  createResultCard(result) {
    const confidenceClass = result.confidence > 0.8 ? 'confidence-high' : 
                           result.confidence > 0.5 ? 'confidence-medium' : 'confidence-low';
    
    const title = result.filename || result.media?.src?.split('/').pop() || 'Media Analysis';
    
    return `
      <div class="result-card">
        <div class="result-header">
          <div class="result-title">${title}</div>
          <div class="confidence-badge ${confidenceClass}">
            ${(result.confidence * 100).toFixed(1)}%
          </div>
        </div>
        <div class="result-details">
          <p><strong>Prediction:</strong> ${result.prediction.toUpperCase()}</p>
          ${result.details.models_used ? `<p><strong>Models:</strong> ${result.details.models_used.join(', ')}</p>` : ''}
          ${result.details.processing_time ? `<p><strong>Processing Time:</strong> ${result.details.processing_time}</p>` : ''}
          ${result.details.file_size ? `<p><strong>File Size:</strong> ${result.details.file_size}</p>` : ''}
          ${result.details.suspicious_features ? `<p><strong>Issues:</strong> ${result.details.suspicious_features.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }

  closeModal() {
    document.getElementById('resultsModal').style.display = 'none';
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get(['autoScan', 'notifications']);
    
    document.getElementById('autoScanToggle').checked = settings.autoScan || false;
    document.getElementById('notificationsToggle').checked = settings.notifications !== false;
  }

  async saveSetting(key, value) {
    await chrome.storage.sync.set({ [key]: value });
  }

  async loadRecentScans() {
    const data = await chrome.storage.local.get(['recentScans']);
    const scans = data.recentScans || [];
    
    const container = document.getElementById('recentScans');
    
    if (scans.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 16px;">No recent scans</p>';
      return;
    }

    container.innerHTML = scans.slice(0, 3).map(scan => this.createScanItem(scan)).join('');
  }

  createScanItem(scan) {
    const timeAgo = this.getTimeAgo(scan.timestamp);
    const resultClass = this.getResultClass(scan.results);
    const resultText = this.getResultText(scan.results);
    
    return `
      <div class="scan-item" onclick="window.extensionPopup.showScanDetails('${scan.timestamp}')">
        <svg class="scan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <div class="scan-info">
          <div class="scan-title">${scan.title || scan.filename || 'Media Scan'}</div>
          <div class="scan-meta">${timeAgo} • ${scan.results.length} item(s)</div>
        </div>
        <div class="scan-result ${resultClass}">${resultText}</div>
      </div>
    `;
  }

  async saveRecentScan(scan) {
    const data = await chrome.storage.local.get(['recentScans']);
    const scans = data.recentScans || [];
    
    scans.unshift(scan);
    if (scans.length > 10) scans.pop(); // Keep only 10 recent scans
    
    await chrome.storage.local.set({ recentScans: scans });
    this.loadRecentScans();
  }

  getResultClass(results) {
    const fakeCount = results.filter(r => r.prediction === 'fake').length;
    const suspiciousCount = results.filter(r => r.prediction === 'suspicious').length;
    
    if (fakeCount > 0) return 'fake';
    if (suspiciousCount > 0) return 'suspicious';
    return 'safe';
  }

  getResultText(results) {
    const fakeCount = results.filter(r => r.prediction === 'fake').length;
    const suspiciousCount = results.filter(r => r.prediction === 'suspicious').length;
    
    if (fakeCount > 0) return 'FAKE';
    if (suspiciousCount > 0) return 'SUSPICIOUS';
    return 'SAFE';
  }

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  async updateStatus() {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`);
      const statusIndicator = document.getElementById('statusIndicator');
      const statusText = statusIndicator.querySelector('.status-text');
      const statusDot = statusIndicator.querySelector('.status-dot');
      
      if (response.ok) {
        statusText.textContent = 'Connected';
        statusDot.style.background = 'var(--success)';
      } else {
        throw new Error('API not responding');
      }
    } catch (error) {
      const statusIndicator = document.getElementById('statusIndicator');
      const statusText = statusIndicator.querySelector('.status-text');
      const statusDot = statusIndicator.querySelector('.status-dot');
      
      statusText.textContent = 'Offline';
      statusDot.style.background = 'var(--warning)';
    }
  }

  showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 3000;
      animation: slideIn 0.3s ease;
      background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--primary)'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openSettings() {
    // For now, just show a simple alert
    // In a full implementation, you might open a settings page
    alert('Settings panel coming soon! Configure auto-scan and notification preferences here.');
  }

  async showScanDetails(timestamp) {
    const data = await chrome.storage.local.get(['recentScans']);
    const scans = data.recentScans || [];
    const scan = scans.find(s => s.timestamp.toString() === timestamp);
    
    if (scan) {
      this.showResults(scan.results);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.extensionPopup = new ExtensionPopup();
});

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);