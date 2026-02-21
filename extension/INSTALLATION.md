# Interceptor Extension Installation Guide

## Quick Start (Fixed Icon Issue)

### 1. Generate Icons (Required)
The extension needs icon files to load properly. Use the simple HTML generator:

1. **Open the icon generator**:
   ```bash
   cd extension
   # Open create_icons.html in your browser
   open create_icons.html  # macOS
   # or double-click the file
   ```

2. **Generate icons**:
   - Click "Generate All Icons" in the browser
   - Four PNG files will be downloaded automatically
   - Create an `icons` folder in the extension directory if it doesn't exist
   - Move the downloaded files (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`) to `extension/icons/`

3. **Update manifest** (add icons back):
   Add this to your `manifest.json` after the `action` section:
   ```json
   "icons": {
     "16": "icons/icon16.png",
     "32": "icons/icon32.png", 
     "48": "icons/icon48.png",
     "128": "icons/icon128.png"
   },
   ```
   
   And update the `action` section to include:
   ```json
   "action": {
     "default_popup": "popup.html",
     "default_title": "Interceptor Deepfake Detector",
     "default_icon": {
       "16": "icons/icon16.png",
       "32": "icons/icon32.png",
       "48": "icons/icon48.png", 
       "128": "icons/icon128.png"
     }
   },
   ```

### 2. Install in Chrome

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in top-right corner)
3. **Click "Load unpacked"**
4. **Select the `extension` folder** from your Interceptor project
5. **Pin the extension** to your toolbar

### 3. Configure Backend

Make sure your Interceptor backend is running:

```bash
cd backend
python app.py
```

The extension will automatically connect to `http://localhost:8000`.

## Alternative: Use Your Favicon

If you prefer to use your existing favicon:

1. **Convert your favicon** to PNG format in different sizes
2. **Use an online converter** like favicon.io or any image editor
3. **Create these sizes**: 16x16, 32x32, 48x48, 128x128 pixels
4. **Save them** as `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` in the `icons` folder

## Troubleshooting Icon Issues

### "Could not load icon" Error
**Solution**: 
- Ensure all four icon files exist in `extension/icons/`
- Check file names match exactly: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
- Verify the `icons` section is present in `manifest.json`

### Icons Not Showing in Browser
**Solution**:
- Reload the extension in `chrome://extensions/`
- Clear browser cache
- Check that PNG files are valid (try opening them in an image viewer)

### Permission to Generate Icons
**Solution**:
- Some browsers may block automatic downloads
- Allow downloads when prompted
- Check your downloads folder for the generated files

## Detailed Setup

### Prerequisites

- **Chrome Browser** (version 88+)
- **Interceptor backend** running locally
- **Web browser** (for icon generation)

### Step-by-Step Installation

#### Step 1: Prepare the Extension

1. **Navigate to the extension directory**:
   ```bash
   cd extension
   ```

2. **Generate icons using the HTML tool**:
   - Open `create_icons.html` in any web browser
   - Click "Generate All Icons"
   - Move downloaded files to `extension/icons/` folder

3. **Update manifest.json** to include icon references (see Quick Start section above)

4. **Verify all files are present**:
   ```
   extension/
   ├── manifest.json
   ├── popup.html
   ├── popup.css
   ├── popup.js
   ├── background.js
   ├── content.js
   ├── content.css
   ├── create_icons.html
   ├── icons/
   │   ├── icon16.png
   │   ├── icon32.png
   │   ├── icon48.png
   │   └── icon128.png
   └── README.md
   ```

#### Step 2: Load Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`

2. **Enable Developer Mode**:
   - Look for the "Developer mode" toggle in the top-right corner
   - Click to enable it

3. **Load the extension**:
   - Click the "Load unpacked" button
   - Navigate to your Interceptor project folder
   - Select the `extension` folder
   - Click "Select Folder"

4. **Verify installation**:
   - You should see "Interceptor Deepfake Detector" in your extensions list
   - The extension icon should appear in your browser toolbar
   - If not visible, click the puzzle piece icon and pin Interceptor

#### Step 3: Configure and Test

1. **Start your backend server**:
   ```bash
   cd backend
   python app.py
   ```

2. **Test the extension**:
   - Click the Interceptor icon in your toolbar
   - You should see "Connected" status in green
   - If you see "Offline" in yellow, check your backend server

3. **Test functionality**:
   - Try the "Scan Page" button on any webpage with images/videos
   - Upload a test video file using the upload area
   - Right-click on any image and look for "Analyze with Interceptor"

### Configuration Options

#### Change API Endpoint

If your backend runs on a different port or domain:

1. **Edit `popup.js`** (line ~4):
   ```javascript
   this.apiEndpoint = 'http://your-domain:your-port';
   ```

2. **Edit `background.js`** (line ~4):
   ```javascript
   this.apiEndpoint = 'http://your-domain:your-port';
   ```

3. **Reload the extension** in `chrome://extensions/`

#### Enable Auto-Scan

1. **Click the extension icon**
2. **Check "Auto-scan media on page load"**
3. **Visit supported websites** (YouTube, TikTok, etc.)
4. **Media will be automatically analyzed**

### Troubleshooting

#### Extension Not Loading

**Problem**: Extension doesn't appear after loading
**Solution**: 
- Check that all files are present in the extension folder
- Verify manifest.json is valid JSON
- Ensure all icon files exist in the icons folder
- Look for errors in `chrome://extensions/` (click "Errors" if present)

#### Icons Not Showing

**Problem**: Extension shows default icon or no icon
**Solution**:
- Use the HTML icon generator: open `create_icons.html` in browser
- Ensure icons folder exists with all four PNG files
- Update manifest.json to include icon references
- Reload the extension in `chrome://extensions/`

#### "Offline" Status

**Problem**: Extension shows "Offline" instead of "Connected"
**Solution**:
- Verify backend server is running: `curl http://localhost:8000/health`
- Check firewall settings
- Ensure correct API endpoint in extension files

#### Analysis Not Working

**Problem**: Scan/analysis buttons don't work
**Solution**:
- Check browser console for errors (F12 → Console)
- Verify backend server logs for errors
- Test API directly: `curl -X POST http://localhost:8000/predict`
- Reload the extension

#### Permission Errors

**Problem**: Extension can't access certain websites
**Solution**:
- Check that host_permissions in manifest.json includes the domain
- Some sites (chrome://, file://) are restricted by Chrome
- Try on regular websites (http/https)

### Advanced Configuration

#### Custom Styling

To match your brand colors, edit `popup.css`:

```css
:root {
  --primary: #your-primary-color;
  --success: #your-success-color;
  --warning: #your-warning-color;
  --danger: #your-danger-color;
}
```

#### Additional Features

To add new functionality:

1. **Update manifest.json** with new permissions if needed
2. **Add UI elements** in popup.html
3. **Style them** in popup.css
4. **Add JavaScript** in popup.js
5. **Reload extension** to test

### Security Notes

- The extension only stores data locally in your browser
- No data is sent to external servers except your configured backend
- All communication uses your local network or HTTPS when possible
- You can review all source code in the extension folder

### Performance Tips

- **Disable auto-scan** on slow connections
- **Limit concurrent analyses** for better performance  
- **Clear extension storage** periodically in Chrome settings
- **Use smaller file sizes** for faster analysis

### Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Interceptor Deepfake Detector"
3. Click "Remove"
4. Confirm removal

All local data will be automatically cleaned up.

---

## Need Help?

- **Check the main README.md** for detailed feature documentation
- **Review browser console** for error messages
- **Check backend server logs** for API issues
- **Open an issue** in the Interceptor repository

**Happy deepfake detecting! 🔍**