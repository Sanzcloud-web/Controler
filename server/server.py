#!/usr/bin/env python3
"""
Simple HTTP server to serve the Video Remote Controller
"""
import os
import sys
import http.server
import socketserver
import socket
from pathlib import Path
import json

PORT = 8080

class VideoControllerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve from dist directory
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index.html'
        
        # Serve from dist folder
        self.directory = 'dist'
        
        try:
            return super().do_GET()
        except Exception as e:
            print(f"Error serving {self.path}: {e}")
            self.send_error(500)

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a public DNS to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up one level to project root
    
    # Change to project root
    os.chdir(project_root)
    
    # Check if dist folder exists
    if not os.path.exists('dist'):
        print("❌ Error: dist folder not found!")
        print("Run: npm run build:web")
        print("Current folder:", os.getcwd())
        sys.exit(1)
    
    ip = get_local_ip()
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║         📺 Video Remote Controller Server                  ║
╚════════════════════════════════════════════════════════════╝

✅ Server running on: http://{ip}:{PORT}

📱 On your phone:
   1. Open browser
   2. Go to: http://{ip}:{PORT}
   3. Make sure you're on the same WiFi!

🔲 Or scan the QR code on the Mac app settings

Press Ctrl+C to stop the server
""")
    
    # Create server
    with socketserver.TCPServer(("0.0.0.0", PORT), VideoControllerHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✋ Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    main()
