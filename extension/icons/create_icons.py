#!/usr/bin/env python3
"""
Simple script to create basic Interceptor extension icons
Creates simple camera icons for the extension
"""

from PIL import Image, ImageDraw
import os

def create_simple_icon(size, filename):
    """Create a simple camera icon"""
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Define colors based on your design system
    primary_color = (59, 130, 246)  # Blue #3b82f6
    white_color = (255, 255, 255)
    
    # Draw background circle
    margin = max(2, size // 10)
    draw.ellipse([margin, margin, size - margin, size - margin], 
                fill=primary_color, outline=None)
    
    # Draw camera body (simplified rectangle)
    body_margin = size // 4
    body_width = size - (body_margin * 2)
    body_height = body_width * 0.7
    body_x = body_margin
    body_y = (size - body_height) // 2
    
    draw.rectangle([body_x, body_y, body_x + body_width, body_y + body_height],
                  fill=white_color, outline=None)
    
    # Draw camera lens (circle)
    lens_size = min(body_width, body_height) * 0.5
    lens_x = (size - lens_size) // 2
    lens_y = (size - lens_size) // 2
    
    draw.ellipse([lens_x, lens_y, lens_x + lens_size, lens_y + lens_size],
                fill=primary_color, outline=None)
    
    # Draw small viewfinder on top (if size is large enough)
    if size >= 32:
        vf_width = body_width * 0.3
        vf_height = body_height * 0.2
        vf_x = (size - vf_width) // 2
        vf_y = body_y - vf_height
        
        draw.rectangle([vf_x, vf_y, vf_x + vf_width, vf_y + vf_height],
                      fill=white_color, outline=None)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def create_fallback_icons():
    """Create fallback icons if PIL is not available"""
    print("Creating fallback icons without PIL...")
    
    # Create a simple HTML file that can generate icons
    html_content = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Icon Generator</title>
    </head>
    <body>
        <canvas id="canvas" width="128" height="128"></canvas>
        <script>
            function createIcon(size) {
                const canvas = document.getElementById('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.clearRect(0, 0, size, size);
                
                // Draw blue circle background
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw white camera body
                ctx.fillStyle = 'white';
                const bodyWidth = size * 0.5;
                const bodyHeight = bodyWidth * 0.7;
                const bodyX = (size - bodyWidth) / 2;
                const bodyY = (size - bodyHeight) / 2;
                ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);
                
                // Draw blue lens
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath();
                ctx.arc(size/2, size/2, bodyWidth * 0.25, 0, 2 * Math.PI);
                ctx.fill();
                
                // Download the image
                const link = document.createElement('a');
                link.download = `icon${size}.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
            
            // Create all sizes
            [16, 32, 48, 128].forEach(size => {
                setTimeout(() => createIcon(size), size * 10);
            });
        </script>
    </body>
    </html>
    '''
    
    with open('icon_generator.html', 'w') as f:
        f.write(html_content)
    
    print("Created icon_generator.html")
    print("Open this file in a browser to download the icon files")

def main():
    """Generate all required icon sizes"""
    # Create icons directory if it doesn't exist
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    # Icon sizes required by Chrome extensions
    sizes = [16, 32, 48, 128]
    
    try:
        # Try to create icons with PIL
        for size in sizes:
            filename = f'icons/icon{size}.png'
            create_simple_icon(size, filename)
        
        print("\nAll icons created successfully!")
        print("You can now load the extension in Chrome.")
        
    except ImportError:
        print("PIL/Pillow not found. Creating fallback solution...")
        create_fallback_icons()
        print("\nOpen icon_generator.html in your browser to create icons manually.")

if __name__ == "__main__":
    main()