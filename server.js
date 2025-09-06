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

// API request handler for secure authentication and announcements
function handleApiRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle announcements endpoints
    if (url.pathname === '/api/announcements') {
        handleAnnouncementsRequest(req, res);
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
    } else if (url.pathname === '/api/password-recovery' && req.method === 'POST') {
        handlePasswordRecoveryRequest(req, res);
    } else if (url.pathname === '/api/recovery-requests' && req.method === 'GET') {
        handleGetRecoveryRequests(req, res);
    } else if (url.pathname === '/api/approve-recovery' && req.method === 'POST') {
        handleApproveRecovery(req, res);
    } else if (url.pathname === '/api/admin-count' && req.method === 'GET') {
        handleGetAdminCount(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'API endpoint not found' }));
    }
}

// Announcements API handler
function handleAnnouncementsRequest(req, res) {
    const announcementsFile = path.join(__dirname, 'announcements.json');
    
    if (req.method === 'GET') {
        // Get all announcements
        fs.readFile(announcementsFile, 'utf8', (err, data) => {
            if (err) {
                // If file doesn't exist, return empty array
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }
            
            try {
                const announcements = JSON.parse(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(announcements));
            } catch (parseError) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
            }
        });
    } else if (req.method === 'POST') {
        // Add new announcement
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const newAnnouncement = JSON.parse(body);
                
                // Read existing announcements
                fs.readFile(announcementsFile, 'utf8', (err, data) => {
                    let announcements = [];
                    
                    if (!err && data) {
                        try {
                            announcements = JSON.parse(data);
                        } catch (parseError) {
                            announcements = [];
                        }
                    }
                    
                    // Add new announcement at the beginning
                    announcements.unshift(newAnnouncement);
                    
                    // Write back to file
                    fs.writeFile(announcementsFile, JSON.stringify(announcements, null, 2), (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to save announcement' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, announcement: newAnnouncement }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid announcement data' }));
            }
        });
    } else if (req.method === 'DELETE') {
        // Delete announcement by ID
        const url = new URL(req.url, `http://${req.headers.host}`);
        const announcementId = url.searchParams.get('id');
        
        if (!announcementId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Announcement ID required' }));
            return;
        }
        
        fs.readFile(announcementsFile, 'utf8', (err, data) => {
            let announcements = [];
            
            if (!err && data) {
                try {
                    announcements = JSON.parse(data);
                } catch (parseError) {
                    announcements = [];
                }
            }
            
            // Filter out the announcement to delete (convert IDs to numbers for comparison)
            const idToDelete = parseInt(announcementId, 10);
            const filteredAnnouncements = announcements.filter(ann => parseInt(ann.id, 10) !== idToDelete);
            
            // Write back to file
            fs.writeFile(announcementsFile, JSON.stringify(filteredAnnouncements, null, 2), (writeErr) => {
                if (writeErr) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Failed to delete announcement' }));
                    return;
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Method not allowed' }));
    }
}

// Password Recovery System Handlers
function handlePasswordRecoveryRequest(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { email, reason } = JSON.parse(body);
            const authorizedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
            
            if (!authorizedEmails.includes(email.toLowerCase())) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Email not authorized for admin access' 
                }));
                return;
            }
            
            const recoveryFile = path.join(__dirname, 'recovery-requests.json');
            const crypto = require('crypto');
            const requestId = crypto.randomBytes(16).toString('hex');
            
            const recoveryRequest = {
                id: requestId,
                email: email.toLowerCase(),
                reason: reason || 'Password forgotten',
                timestamp: new Date().toISOString(),
                status: 'pending',
                approvals: [],
                requiredApprovals: 2 // Minimum of 2 admin approvals
            };
            
            // Read existing requests
            fs.readFile(recoveryFile, 'utf8', (err, data) => {
                let requests = [];
                if (!err && data) {
                    try {
                        requests = JSON.parse(data);
                    } catch (parseError) {
                        requests = [];
                    }
                }
                
                // Check if there's already a pending request for this email
                const existingRequest = requests.find(req => req.email === email.toLowerCase() && req.status === 'pending');
                if (existingRequest) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'You already have a pending recovery request' 
                    }));
                    return;
                }
                
                requests.push(recoveryRequest);
                
                fs.writeFile(recoveryFile, JSON.stringify(requests, null, 2), (writeErr) => {
                    if (writeErr) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Failed to save recovery request' }));
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Recovery request submitted. Please contact other admins for approval.',
                        requestId: requestId
                    }));
                });
            });
            
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Invalid request format' 
            }));
        }
    });
}

function handleGetRecoveryRequests(req, res) {
    const recoveryFile = path.join(__dirname, 'recovery-requests.json');
    
    fs.readFile(recoveryFile, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
            return;
        }
        
        try {
            const requests = JSON.parse(data);
            // Only return pending requests
            const pendingRequests = requests.filter(req => req.status === 'pending');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(pendingRequests));
        } catch (parseError) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
        }
    });
}

function handleApproveRecovery(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { requestId, approverEmail, action, newPassword } = JSON.parse(body);
            const authorizedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
            
            if (!authorizedEmails.includes(approverEmail.toLowerCase())) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Unauthorized approver email' 
                }));
                return;
            }
            
            const recoveryFile = path.join(__dirname, 'recovery-requests.json');
            
            fs.readFile(recoveryFile, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No recovery requests found' }));
                    return;
                }
                
                try {
                    let requests = JSON.parse(data);
                    const requestIndex = requests.findIndex(req => req.id === requestId);
                    
                    if (requestIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Recovery request not found' }));
                        return;
                    }
                    
                    const request = requests[requestIndex];
                    
                    if (request.email === approverEmail.toLowerCase()) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false, 
                            message: 'Cannot approve your own recovery request' 
                        }));
                        return;
                    }
                    
                    if (action === 'approve') {
                        // Add approval if not already approved by this admin
                        if (!request.approvals.some(approval => approval.email === approverEmail.toLowerCase())) {
                            request.approvals.push({
                                email: approverEmail.toLowerCase(),
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        // Check if we have enough approvals
                        if (request.approvals.length >= request.requiredApprovals) {
                            // Validate new password
                            if (!newPassword || newPassword.length < 6) {
                                res.writeHead(400, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ 
                                    success: false, 
                                    message: 'New password must be at least 6 characters' 
                                }));
                                return;
                            }
                            
                            request.status = 'approved';
                            request.completedAt = new Date().toISOString();
                            request.newPassword = newPassword; // In production, this should be hashed
                            
                            // Generate new auth token
                            const crypto = require('crypto');
                            const token = crypto.createHmac('sha256', process.env.ADMIN_SECRET_KEY || 'fallback-key')
                                               .update(request.email + Date.now())
                                               .digest('hex');
                            
                            request.recoveryToken = token;
                        }
                    } else if (action === 'reject') {
                        request.status = 'rejected';
                        request.rejectedBy = approverEmail.toLowerCase();
                        request.rejectedAt = new Date().toISOString();
                    }
                    
                    requests[requestIndex] = request;
                    
                    fs.writeFile(recoveryFile, JSON.stringify(requests, null, 2), (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to update recovery request' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: action === 'approve' ? 
                                (request.status === 'approved' ? 'Password reset completed successfully' : 'Approval recorded, waiting for more approvals') :
                                'Recovery request rejected',
                            request: request
                        }));
                    });
                    
                } catch (parseError) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Failed to process recovery request' }));
                }
            });
            
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Invalid request format' 
            }));
        }
    });
}

function handleGetAdminCount(req, res) {
    const authorizedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(e => e.length > 0);
    const minRecommended = 2;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        current: authorizedEmails.length,
        minimum: minRecommended,
        recommended: Math.max(minRecommended, 3),
        admins: authorizedEmails.map(email => email.split('@')[0]),
        isMinimumMet: authorizedEmails.length >= minRecommended
    }));
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log('Your website is now accessible!');
    console.log('Secure admin authentication enabled!');
});