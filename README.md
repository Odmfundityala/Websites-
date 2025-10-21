# Siyabulela Senior Secondary School Website

A modern, responsive website for Siyabulela Senior Secondary School (S.S.S.), serving grades 10-12 in Nqamakwe, Eastern Cape.

## Features

- **Modern Photo Gallery** - Admin-controlled gallery with automatic image optimization
- **Announcement System** - Dynamic announcements with admin management
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop
- **Fast Loading** - Optimized images and modern lazy loading
- **Secure Admin Panel** - Password-protected admin area for content management

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js HTTP Server
- **Image Processing**: Sharp library for automatic compression
- **Storage**: File-based JSON storage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Open your browser to `http://localhost:5000`

## Admin Setup

Create an admin account through the admin panel at `/announcements.html`

**Important**: Never commit `admins.json` to version control - it's already in `.gitignore`

## Gallery Management

- Upload photos through the admin panel
- Images are automatically optimized (max 1920px, 85% JPEG quality)
- Supports up to 20MB uploads
- Photos stored in `gallery_uploads/` folder (excluded from git)

## Security Notes

The following files are excluded from version control for security:
- `admins.json` - Admin credentials
- `gallery_uploads/` - User uploaded images
- `attached_assets/` - Development screenshots

## License

© 2025 Siyabulela Senior Secondary School
