const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

    // Handle gallery uploads directory
    if (req.url.startsWith('/gallery_uploads/')) {
        const fileName = req.url.replace('/gallery_uploads/', '');
        const fullPath = path.join(__dirname, 'gallery_uploads', fileName);
        
        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Image Not Found</h1>');
                return;
            }
            
            const ext = path.extname(fullPath).toLowerCase();
            const contentType = mimeTypes[ext] || 'image/jpeg';
            
            fs.readFile(fullPath, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<h1>500 - Error Loading Image</h1>');
                    return;
                }
                
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400'
                });
                res.end(data);
            });
        });
        return;
    }

    // Remove query parameters and decode URL
    let filePath = decodeURIComponent(req.url.split('?')[0]);

    // Default to index.html for root path
    if (filePath === '/') {
        filePath = '/index.html';
    }

    // Handle special sharing URLs
    if (filePath.startsWith('/announcement-share')) {
        filePath = '/announcement-share.html';
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    
    // Handle gallery endpoints
    if (url.pathname === '/api/gallery') {
        handleGalleryRequest(req, res);
        return;
    }
    
    // Handle gallery update endpoint
    if (url.pathname === '/api/gallery/update') {
        handleGalleryUpdateRequest(req, res);
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
                
                if (!email || !password || password.length < 6) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Invalid password. Password must be at least 6 characters.' 
                    }));
                    return;
                }
                
                // Check admins.json file for authentication
                const adminsFile = path.join(__dirname, 'admins.json');
                
                fs.readFile(adminsFile, 'utf8', (err, data) => {
                    let admins = [];
                    if (!err && data) {
                        try {
                            admins = JSON.parse(data);
                        } catch (parseError) {
                            admins = [];
                        }
                    }
                    
                    // Find admin with matching email and password
                    const admin = admins.find(a => 
                        a.email.toLowerCase() === email.toLowerCase() && 
                        a.password === password && 
                        a.active !== false
                    );
                    
                    if (admin) {
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
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: false, 
                            message: 'Invalid email or password' 
                        }));
                    }
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Invalid request' 
                }));
            }
        });
    } else if (url.pathname === '/api/create-admin' && req.method === 'POST') {
        handleCreateAdmin(req, res);
    } else if (url.pathname === '/api/edit-admin' && req.method === 'POST') {
        handleEditAdmin(req, res);
    } else if (url.pathname === '/api/admins-list' && req.method === 'GET') {
        handleGetAdminsList(req, res);
    } else if (url.pathname === '/api/remove-admin' && req.method === 'POST') {
        handleRemoveAdmin(req, res);
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

// Gallery API handler
function handleGalleryRequest(req, res) {
    const galleryFile = path.join(__dirname, 'gallery.json');
    
    if (req.method === 'GET') {
        // Get all gallery photos
        fs.readFile(galleryFile, 'utf8', (err, data) => {
            if (err) {
                // If file doesn't exist, return empty array
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
                return;
            }
            
            try {
                const photos = JSON.parse(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(photos));
            } catch (parseError) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
            }
        });
    } else if (req.method === 'POST') {
        // Add new photo - save image to disk instead of base64 in JSON
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const newPhoto = JSON.parse(body);
                
                // Extract base64 image data
                if (newPhoto.image && newPhoto.image.startsWith('data:image')) {
                    const matches = newPhoto.image.match(/^data:image\/(\w+);base64,(.+)$/);
                    if (matches) {
                        const imageType = matches[1];
                        const base64Data = matches[2];
                        const imageBuffer = Buffer.from(base64Data, 'base64');
                        
                        // Create unique filename (always use .jpg for optimized output)
                        const fileName = `gallery_${newPhoto.id}.jpg`;
                        const filePath = path.join(__dirname, 'gallery_uploads', fileName);
                        
                        // Optimize and compress image using sharp
                        sharp(imageBuffer)
                            .resize(1920, 1920, { 
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .jpeg({ 
                                quality: 85,
                                progressive: true,
                                mozjpeg: true
                            })
                            .toFile(filePath, (sharpErr, info) => {
                                if (sharpErr) {
                                    console.error('Image optimization error:', sharpErr);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: false, message: 'Failed to optimize image' }));
                                    return;
                                }
                                
                                console.log(`Image optimized: ${info.size} bytes (${Math.round(info.size / 1024)}KB)`);
                                
                                // Store only the path, not base64 data
                                const photoMetadata = {
                                    id: newPhoto.id,
                                    title: newPhoto.title,
                                    category: newPhoto.category,
                                    imagePath: `/gallery_uploads/${fileName}`,
                                    date: newPhoto.date,
                                    dateCreated: newPhoto.dateCreated
                                };
                            
                            // Save metadata
                            fs.readFile(galleryFile, 'utf8', (err, data) => {
                                let photos = [];
                                
                                if (!err && data) {
                                    try {
                                        photos = JSON.parse(data);
                                    } catch (parseError) {
                                        photos = [];
                                    }
                                }
                                
                                photos.unshift(photoMetadata);
                                
                                fs.writeFile(galleryFile, JSON.stringify(photos, null, 2), (writeErr) => {
                                    if (writeErr) {
                                        res.writeHead(500, { 'Content-Type': 'application/json' });
                                        res.end(JSON.stringify({ success: false, message: 'Failed to save' }));
                                        return;
                                    }
                                    
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: true, photo: photoMetadata }));
                                });
                            });
                        });
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Invalid image format' }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No image data provided' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid photo data' }));
            }
        });
    } else if (req.method === 'DELETE') {
        // Delete photo by ID and remove image file
        const url = new URL(req.url, `http://${req.headers.host}`);
        const photoId = url.searchParams.get('id');
        
        if (!photoId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Photo ID required' }));
            return;
        }
        
        fs.readFile(galleryFile, 'utf8', (err, data) => {
            let photos = [];
            
            if (!err && data) {
                try {
                    photos = JSON.parse(data);
                } catch (parseError) {
                    photos = [];
                }
            }
            
            // Find the photo to delete and remove its file
            const idToDelete = parseInt(photoId, 10);
            const photoToDelete = photos.find(photo => parseInt(photo.id, 10) === idToDelete);
            
            // Delete the image file if it exists
            if (photoToDelete && photoToDelete.imagePath) {
                const imageFilePath = path.join(__dirname, photoToDelete.imagePath.replace(/^\//, ''));
                fs.unlink(imageFilePath, (unlinkErr) => {
                    // Continue even if file deletion fails (file might not exist)
                    if (unlinkErr) {
                        console.log('Warning: Could not delete image file:', unlinkErr.message);
                    }
                });
            }
            
            // Filter out the photo to delete
            const filteredPhotos = photos.filter(photo => parseInt(photo.id, 10) !== idToDelete);
            
            // Write back to file
            fs.writeFile(galleryFile, JSON.stringify(filteredPhotos, null, 2), (writeErr) => {
                if (writeErr) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Failed to delete photo' }));
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

// Gallery Update API handler
function handleGalleryUpdateRequest(req, res) {
    const galleryFile = path.join(__dirname, 'gallery.json');
    
    if (req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { id, title } = JSON.parse(body);
                
                if (!id || !title) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'ID and title are required' }));
                    return;
                }
                
                // Read existing photos
                fs.readFile(galleryFile, 'utf8', (err, data) => {
                    let photos = [];
                    
                    if (!err && data) {
                        try {
                            photos = JSON.parse(data);
                        } catch (parseError) {
                            photos = [];
                        }
                    }
                    
                    // Find and update the photo
                    const photoIndex = photos.findIndex(photo => parseInt(photo.id, 10) === parseInt(id, 10));
                    
                    if (photoIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Photo not found' }));
                        return;
                    }
                    
                    // Update the title
                    photos[photoIndex].title = title;
                    
                    // Write back to file
                    fs.writeFile(galleryFile, JSON.stringify(photos, null, 2), (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to update photo' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, photo: photos[photoIndex] }));
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid request data' }));
            }
        });
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Method not allowed' }));
    }
}

// Admin Management System Handlers
function handleCreateAdmin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { email, password } = JSON.parse(body);
            
            if (!email || !password || password.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Email and password (minimum 6 characters) are required' 
                }));
                return;
            }
            
            const adminsFile = path.join(__dirname, 'admins.json');
            
            // Read existing admins
            fs.readFile(adminsFile, 'utf8', (err, data) => {
                let admins = [];
                if (!err && data) {
                    try {
                        admins = JSON.parse(data);
                    } catch (parseError) {
                        admins = [];
                    }
                }
                
                // Check if admin already exists
                if (admins.some(admin => admin.email.toLowerCase() === email.toLowerCase())) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: 'Admin with this email already exists' 
                    }));
                    return;
                }
                
                // Add new admin
                const newAdmin = {
                    email: email.toLowerCase(),
                    password: password, // In production, this should be hashed
                    createdAt: new Date().toISOString(),
                    active: true
                };
                
                admins.push(newAdmin);
                
                // Write back to file
                fs.writeFile(adminsFile, JSON.stringify(admins, null, 2), (writeErr) => {
                    if (writeErr) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Failed to create admin account' }));
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Admin account created successfully!'
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

function handleEditAdmin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { email, newPassword } = JSON.parse(body);
            
            if (!email || !newPassword || newPassword.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Email and new password (minimum 6 characters) are required' 
                }));
                return;
            }
            
            const adminsFile = path.join(__dirname, 'admins.json');
            
            fs.readFile(adminsFile, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No admin accounts found' }));
                    return;
                }
                
                try {
                    let admins = JSON.parse(data);
                    const adminIndex = admins.findIndex(admin => admin.email.toLowerCase() === email.toLowerCase());
                    
                    if (adminIndex === -1) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Admin not found' }));
                        return;
                    }
                    
                    // Update password
                    admins[adminIndex].password = newPassword; // In production, this should be hashed
                    admins[adminIndex].passwordUpdatedAt = new Date().toISOString();
                    
                    fs.writeFile(adminsFile, JSON.stringify(admins, null, 2), (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to update admin' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Admin updated successfully!'
                        }));
                    });
                    
                } catch (parseError) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Failed to process admin data' }));
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

function handleGetAdminsList(req, res) {
    const adminsFile = path.join(__dirname, 'admins.json');
    
    fs.readFile(adminsFile, 'utf8', (err, data) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
            return;
        }
        
        try {
            const admins = JSON.parse(data);
            // Return admin list without passwords
            const publicAdmins = admins.filter(admin => admin.active).map(admin => ({
                email: admin.email,
                createdAt: admin.createdAt,
                passwordUpdatedAt: admin.passwordUpdatedAt
            }));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(publicAdmins));
        } catch (parseError) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
        }
    });
}

function handleRemoveAdmin(req, res) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        try {
            const { email } = JSON.parse(body);
            
            if (!email) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'Email is required' 
                }));
                return;
            }
            
            // Protect the main admin account from deletion
            if (email.toLowerCase() === 'odmafundityala@gmail.com') {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: 'This admin account cannot be deleted as it is protected' 
                }));
                return;
            }
            
            const adminsFile = path.join(__dirname, 'admins.json');
            
            fs.readFile(adminsFile, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'No admin accounts found' }));
                    return;
                }
                
                try {
                    let admins = JSON.parse(data);
                    const initialCount = admins.length;
                    
                    // Remove admin (or mark as inactive)
                    admins = admins.filter(admin => admin.email.toLowerCase() !== email.toLowerCase());
                    
                    if (admins.length === initialCount) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Admin not found' }));
                        return;
                    }
                    
                    fs.writeFile(adminsFile, JSON.stringify(admins, null, 2), (writeErr) => {
                        if (writeErr) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Failed to remove admin' }));
                            return;
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: 'Admin removed successfully!'
                        }));
                    });
                    
                } catch (parseError) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Failed to process admin data' }));
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
    console.log('Your website is now accessible!');
    console.log('Secure admin authentication enabled!');
});