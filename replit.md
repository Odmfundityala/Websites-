# Siyabulela Senior Secondary School Website

## Overview

This is a static website for Siyabulela Senior Secondary School (S.S.S.), a high school serving grades 10-12 located in Ngcisininde A/A Ndiki Location, Nqamakwe. The website serves as an informational portal for students, parents, and the community, showcasing the school's academic programs, admission processes, fee structure, sports activities, and contact information. The site emphasizes the school's mission of providing quality education and nurturing future leaders through transformative education.

## Recent Changes

**October 21, 2025**: Implemented event categorization system and modern UI controls for gallery
- Added customizable event/category field - admins can type their own category names or select from suggestions (Graduation Ceremonies, Sports Events, Academic Activities, Cultural Events, School Assemblies, Field Trips, Community Service, Other Events)
- Photos now organized by event categories in both public gallery and admin panel
- Implemented collapsible category sections in admin panel with expandable/collapsible headers
- Replaced traditional edit/delete buttons with modern three-dot kebab menu for cleaner UI
- Added "Delete All" functionality for bulk removal of photos within each category
- Public gallery displays category headers with folder icons for better organization
- Admin panel shows 200px thumbnails for easy photo identification
- All uploaded photos automatically compressed using Sharp library (max 1920px, 85% JPEG quality)
- Modern lazy loading with IntersectionObserver for smooth scroll experience

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The website follows a traditional multi-page architecture with static HTML files for each major section. The design uses a consistent navigation structure across all pages with a responsive layout that adapts to different screen sizes. The architecture includes:

- **Multi-page Structure**: Separate HTML files for each major section (home, academics, admissions, fees, sports/uniform, stakeholders, about, gallery, contact)
- **Responsive Design**: Mobile-first approach with hamburger menu navigation for smaller screens
- **Consistent Layout**: Shared header navigation and styling across all pages
- **Photo Gallery System**: Admin-controlled gallery with multiple image uploads and elegant masonry display
- **Static Content Management**: All content is directly embedded in HTML files

### Styling System
The CSS architecture uses CSS custom properties (variables) for maintaining consistent theming throughout the site. The design system includes:

- **Color Scheme**: Navy blue primary colors with sky blue backgrounds and gold accents
- **Typography**: Google Fonts integration with Montserrat for headings and Open Sans for body text
- **Component-based Styling**: Modular CSS classes for reusable UI components
- **Performance Optimization**: Critical CSS inlining and resource preloading strategies

### JavaScript Functionality
The site includes interactive features through vanilla JavaScript:

- **Navigation Management**: Mobile menu toggle functionality with click-outside-to-close behavior
- **Announcement System**: Dynamic announcement creation and management with server-side persistence
- **Gallery Management**: Event-categorized photo gallery with multiple image upload (up to 20MB per file), category organization, lightbox viewer, modern three-dot kebab menu controls, and collapsible category sections
- **Image Optimization**: Automatic compression of uploaded photos (max 1920px, 85% quality JPEG) for fast loading speeds
- **Bulk Operations**: Delete all photos within a category with single-click confirmation
- **Form Handling**: Client-side form processing with validation and file handling
- **Responsive Behavior**: Automatic menu closing on window resize and active navigation highlighting
- **Admin Authentication**: Secure login system with session management

### Server Configuration
A Node.js HTTP server handles static file serving and API endpoints:

- **Static File Server**: Serves HTML, CSS, JavaScript, and image assets
- **API Endpoints**: RESTful endpoints for announcements and gallery management
- **Data Storage**: JSON file-based storage for announcements and gallery photos
- **MIME Type Handling**: Proper content-type headers for different file extensions
- **Error Handling**: 404 and 500 error responses
- **Port Configuration**: Configurable port with environment variable support

## External Dependencies

### CDN Resources
- **Font Awesome 6.5.1**: Icon library for UI elements and navigation icons
- **Google Fonts**: Montserrat and Open Sans font families for typography

### Development Dependencies
- **Node.js HTTP Module**: Built-in module for creating the web server
- **File System Module**: Built-in Node.js module for file operations
- **Path Module**: Built-in Node.js module for file path handling
- **Sharp**: High-performance image processing library for automatic compression and optimization

### Browser APIs
- **Local Storage**: For persisting announcement data on the client side
- **DOM APIs**: For dynamic content manipulation and event handling
- **Responsive Design APIs**: Media queries and viewport meta tag for mobile optimization

The architecture prioritizes simplicity and performance, using minimal external dependencies while providing a comprehensive school information portal with basic content management capabilities for announcements.