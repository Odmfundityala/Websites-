# Siyabulela Senior Secondary School Website

## Overview

This is a static website for Siyabulela Senior Secondary School (S.S.S.), a high school serving grades 10-12 located in Ngcisininde A/A Ndiki Location, Nqamakwe. The website serves as an informational portal for students, parents, and the community, showcasing the school's academic programs, admission processes, fee structure, sports activities, and contact information. The site emphasizes the school's mission of providing quality education and nurturing future leaders through transformative education.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The website follows a traditional multi-page architecture with static HTML files for each major section. The design uses a consistent navigation structure across all pages with a responsive layout that adapts to different screen sizes. The architecture includes:

- **Multi-page Structure**: Separate HTML files for each major section (home, academics, admissions, fees, sports/uniform, stakeholders, about, contact)
- **Responsive Design**: Mobile-first approach with hamburger menu navigation for smaller screens
- **Consistent Layout**: Shared header navigation and styling across all pages
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
- **Announcement System**: Dynamic announcement creation and management with local storage persistence
- **Form Handling**: Client-side form processing for announcement creation
- **Responsive Behavior**: Automatic menu closing on window resize and active navigation highlighting

### Server Configuration
A minimal Node.js HTTP server handles static file serving:

- **Static File Server**: Serves HTML, CSS, JavaScript, and image assets
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

### Browser APIs
- **Local Storage**: For persisting announcement data on the client side
- **DOM APIs**: For dynamic content manipulation and event handling
- **Responsive Design APIs**: Media queries and viewport meta tag for mobile optimization

The architecture prioritizes simplicity and performance, using minimal external dependencies while providing a comprehensive school information portal with basic content management capabilities for announcements.