#!/usr/bin/env node

/**
 * Simple HTTP server for JSONIC benchmarks
 * Accessible from anywhere on the LAN
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Get network interfaces
function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address
        });
      }
    }
  }
  
  return addresses;
}

// Create server
const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Resolve full path
  const fullPath = path.join(__dirname, filePath);
  
  // Security check - prevent directory traversal
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Get file extension
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read and serve file
  fs.readFile(fullPath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('File not found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      // Success
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',  // Allow cross-origin requests
        'Cache-Control': 'no-cache'  // Disable caching for development
      });
      res.end(content, 'utf-8');
    }
  });
});

// Start server listening on all interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
  const addresses = getNetworkAddresses();
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           JSONIC Benchmark Server - LAN Access             ║
╚════════════════════════════════════════════════════════════╝

Server is running and accessible from:

🖥️  Local:
   http://localhost:${PORT}
   http://127.0.0.1:${PORT}

📱 Network (access from any device on your LAN):
${addresses.map(addr => `   http://${addr.address}:${PORT} (${addr.name})`).join('\n')}

📊 To run benchmarks:
   1. Open any of the URLs above in a web browser
   2. Configure your benchmark settings
   3. Click "Run Benchmarks"

🔥 Firewall Note:
   If you can't access from other devices, check your firewall settings.
   You may need to allow incoming connections on port ${PORT}.

   Windows:   netsh advfirewall firewall add rule name="JSONIC Benchmark" dir=in action=allow protocol=TCP localport=${PORT}
   macOS:     sudo pfctl -f /etc/pf.conf (may need to edit pf.conf)
   Linux:     sudo ufw allow ${PORT}/tcp

Press Ctrl+C to stop the server.
`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
    console.error(`   PORT=3000 npm start`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied to use port ${PORT}. Try:`);
    console.error(`   PORT=8080 npm start`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});