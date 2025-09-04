# Overview

This is a static website for Siyabulela Senior Secondary School (Siya), a high school serving grades 10-12 located in Ngcisininde A/A Ndiki Location, Nqamakwe. The website serves as an informational platform showcasing the school's academic programs, admissions process, facilities, stakeholder relationships, and contact information. The site also includes an announcement management system for school communications.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Static HTML Website**: Multi-page site with semantic HTML5 structure
- **CSS-based Styling**: Custom CSS with CSS variables for theming, responsive design using flexbox/grid
- **Vanilla JavaScript**: No frameworks - pure JavaScript for interactivity including mobile navigation and announcement management
- **Mobile-First Design**: Responsive layout with hamburger menu for mobile navigation

## Component Structure
- **Navigation System**: Consistent header with logo and responsive navigation across all pages
- **Page Templates**: Standardized layout with page headers and content sections
- **Announcement System**: JavaScript-powered announcement creation and display functionality
- **Contact Forms**: Static contact information display organized by departments

## Content Management
- **Static Content**: All school information stored directly in HTML files
- **Announcement Management**: Client-side JavaScript system with local storage persistence
- **Image Assets**: Local image storage for school logo and visual content

## Styling Architecture
- **CSS Custom Properties**: Comprehensive theming system using CSS variables
- **School Brand Colors**: Navy blue primary theme with gold accents and sky blue backgrounds
- **Typography System**: Google Fonts integration (Montserrat and Open Sans)
- **Responsive Breakpoints**: Mobile-first approach with desktop optimization

# External Dependencies

## CDN Resources
- **Font Awesome 6.5.1**: Icon library for UI elements and visual enhancements
- **Google Fonts**: Montserrat and Open Sans font families for typography

## Development Server
- **Node.js HTTP Server**: Basic static file server for local development
- **MIME Type Handling**: Proper content type serving for various file formats

## Browser Storage
- **Local Storage**: Client-side persistence for announcement management system

The architecture prioritizes simplicity and accessibility, using standard web technologies without complex build processes or external databases, making it easy to maintain and deploy as a static website.