# Interceptor Browser Extension

A powerful browser extension for detecting deepfakes and manipulated media across the web using AI-powered analysis.

## Features

### 🔍 **Real-time Media Scanning**
- Automatically detects and analyzes videos and images on web pages
- Shows visual indicators on suspicious media
- Context menu integration for quick analysis

### 🎯 **Smart Detection**
- Uses multiple AI models for accurate deepfake detection
- Supports various media formats (MP4, WebM, JPG, PNG, etc.)
- Analyzes embedded content from YouTube, TikTok, Instagram, and more

### ⚡ **Quick Analysis**
- One-click page scanning
- Drag-and-drop file analysis
- Real-time confidence scoring

### 🛡️ **Privacy-Focused**
- Local processing when possible
- Secure API communication
- No data collection or tracking

### 🎨 **Beautiful UI**
- Modern, responsive design matching your existing frontend
- Dark mode support
- Smooth animations and transitions

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Clone or download** the extension files to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the `extension` folder
5. **Pin the extension** to your toolbar for easy access

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store once approved.

## Setup

### Backend Configuration

1. **Start your Interceptor backend server**:
   ```bash
   cd backend
   python app.py
   ```

2. **Verify the API endpoint** in `popup.js` and `background.js`:
   ```javascript
   this.apiEndpoint = 'http://localhost:8000'; // Update if different
   ```

3. **Test the connection** by clicking the extension icon - you should see "Connected" status

### Frontend Dashboard (Optional)

1. **Start your frontend server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the dashboard** by clicking "Open Dashboard" in the extension popup

## Usage

### Quick Page Scan
1. **Click the extension icon** in your browser toolbar
2. **Click "Scan Page"** to analyze all media on the current page
3. **View results** in the popup overlay

### Individual Media Analysis
1. **Right-click** on any image or video
2. **Select "Analyze with Interceptor"** from the context menu
3. **View the result indicator** that appears on the media

### File Upload Analysis
1. **Click the extension icon**
2. **Drag and drop files** into the upload area, or click to browse
3. **View detailed analysis results** in the popup modal

### Auto-Scan (Optional)
1. **Enable auto-scan** in the extension settings
2. **Media will be automatically analyzed** when you visit supported sites
3. **Notifications will appear** for suspicious content

## Visual Indicators

### Media Indicators
- **✓ Green Circle**: Authentic content (high confidence)
- **? Yellow Circle**: Suspicious content (medium confidence)  
- **⚠ Red Circle**: Deepfake detected (high confidence)

### Confidence Levels
- **High (80%+)**: Very reliable result
- **Medium (50-80%)**: Moderately reliable result
- **Low (<50%)**: Less reliable, manual review recommended

## Supported Websites

The extension works on all websites but has enhanced support for:
- YouTube
- TikTok
- Instagram
- Twitter/X
- Facebook
- Reddit
- LinkedIn
- News websites
- Social media platforms

## Settings

### Available Options
- **Auto-scan media on page load**: Automatically analyze media when visiting pages
- **Show detection notifications**: Display notifications for suspicious content
- **API endpoint configuration**: Customize your backend server URL

### Storage
- Recent scans are stored locally in your browser
- Analysis history is automatically cleaned up after 7 days
- No personal data is transmitted or stored

## Troubleshooting

### Extension Not Working
1. **Check if the backend is running** at `http://localhost:8000`
2. **Verify the API endpoint** in the extension settings
3. **Reload the extension** in `chrome://extensions/`
4. **Check browser console** for error messages

### Analysis Failing
1. **Ensure stable internet connection**
2. **Check if the media URL is accessible**
3. **Try uploading the file directly** instead of URL analysis
4. **Verify backend server logs** for errors

### Performance Issues
1. **Disable auto-scan** if pages load slowly
2. **Limit concurrent analyses** by analyzing fewer items at once
3. **Clear extension storage** in Chrome settings if needed

## Development

### File Structure
```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for page interaction
├── content.css           # Content script styling
├── icons/                # Extension icons
└── README.md            # This file
```

### Key Components

#### Popup (`popup.js`)
- Main extension interface
- File upload handling
- Settings management
- Recent scans display

#### Background Script (`background.js`)
- Context menu management
- API communication
- Auto-scan functionality
- Storage management

#### Content Script (`content.js`)
- Page media detection
- Visual indicator overlay
- Real-time analysis display
- User interaction handling

### Customization

#### Changing API Endpoint
Update the `apiEndpoint` variable in both `popup.js` and `background.js`:
```javascript
this.apiEndpoint = 'https://your-api-domain.com';
```

#### Modifying UI Colors
Edit the CSS variables in `popup.css`:
```css
:root {
  --primary: #your-color;
  --success: #your-success-color;
  --warning: #your-warning-color;
  --danger: #your-danger-color;
}
```

#### Adding New Features
1. **Add UI elements** in `popup.html`
2. **Style them** in `popup.css`
3. **Add functionality** in `popup.js`
4. **Update manifest permissions** if needed

## Security

### Data Privacy
- **No tracking**: The extension doesn't collect user data
- **Local storage only**: Analysis results stored locally
- **Secure communication**: HTTPS API calls when possible
- **No external dependencies**: Self-contained functionality

### Permissions Explained
- **activeTab**: Access current tab for media scanning
- **storage**: Store settings and recent scans locally
- **contextMenus**: Add right-click menu options
- **scripting**: Inject content scripts for media detection
- **host_permissions**: Access websites for media analysis

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## License

This extension is part of the Interceptor project and follows the same license terms.

## Support

For issues, questions, or feature requests:
1. **Check the troubleshooting section** above
2. **Review browser console logs** for errors
3. **Open an issue** in the main Interceptor repository
4. **Contact the development team**

---

**Made with ❤️ by the Interceptor Team**