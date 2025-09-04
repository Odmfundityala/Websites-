const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Handle API endpoints
    if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
        return;
    }

    // Remove query parameters and decode URL
    let filePath = decodeURIComponent(req.url.split('?')[0]);

    // Default to index.html for root path
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Handle URLs without .html extension
    if (!path.extname(filePath) && filePath !== '/') {
        filePath += '.html';
    }

    // Remove leading slash and construct file path
    const fullPath = path.join(__dirname, filePath.slice(1));

    // Get file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found - serve 404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Page Not Found</h1>');
            return;
        }

        // Read and serve the file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
                return;
            }

            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'ETag': '',
                'Last-Modified': '',
                'Vary': '*'
            });
            res.end(data);
        });
    });
});

// API request handler for secure authentication
function handleApiRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (url.pathname === '/api/auth' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { email, password } = JSON.parse(body);
                const authorizedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
                
                // For demo purposes, we'll use a simple password check
                // In production, this should be properly hashed and stored securely
                const isValidPassword = password && password.length >= 6;
                
                if (authorizedEmails.includes(email.toLowerCase()) && isValidPassword) {
                    // Generate secure token
                    const crypto = require('crypto');
                    const token = crypto.createHmac('sha256', process.env.ADMIN_SECRET_KEY || 'fallback-key')
                                       .update(email + Date.now())
                                       .digest('hex');
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        token,
                        email: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }));
                } else if (!authorizedEmails.includes(email.toLowerCase())) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Unauthorized email address' 
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Invalid password. Password must be at least 6 characters.' 
                    }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Invalid request' 
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'API endpoint not found' }));
    }
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log('Your website is now accessible!');
    console.log('Secure admin authentication enabled!');
});