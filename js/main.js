document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    let menuOpen = false;

    if (navToggle && navLinks) {
        const toggleMenu = () => {
            menuOpen = !menuOpen;
            navLinks.classList.toggle('active', menuOpen);
            document.body.classList.toggle('nav-open', menuOpen);
        };

        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        document.addEventListener('click', (e) => {
            if (menuOpen && !navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                menuOpen = false;
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && menuOpen) {
                menuOpen = false;
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 950 && menuOpen) {
                menuOpen = false;
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        // Set active navigation link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinksElements = document.querySelectorAll('.nav-links a');

        navLinksElements.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage ||
                (currentPage === '' && linkHref === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Load announcements on homepage
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        loadHomepageAnnouncements();
        setupAnnouncementInteractions();
    }
});

// Function to load announcements on homepage
async function loadHomepageAnnouncements() {
    try {
        // Clear any localStorage cache
        localStorage.removeItem('siya_announcements');

        const response = await fetch('/api/announcements?t=' + Date.now());
        let announcements = [];

        if (response.ok) {
            announcements = await response.json();
            // Ensure announcements is an array and contains only real data
            if (!Array.isArray(announcements)) {
                announcements = [];
            }
            // Filter out any fake or test announcements
            announcements = announcements.filter(ann => 
                ann && ann.title && ann.title.toLowerCase() !== 'vwfww' && 
                ann.content && ann.content.trim() !== 'xvs&nbsp;'
            );
        } else {
            console.error('Failed to load announcements from server');
        }

        const announcementGrid = document.querySelector('.announcement-grid');
        if (announcementGrid) {
            if (announcements.length > 0) {
                // Sort announcements by date (newest first) and display ALL
                const sortedAnnouncements = announcements.sort((a, b) => new Date(b.date) - new Date(a.date));

            announcementGrid.innerHTML = sortedAnnouncements.map(ann => {
                const cleanContent = formatContentForDisplay(ann.content);
                const textContent = getPlainTextContent(ann.content);

                return `
                <div class="announcement-card elegant-home" data-id="${ann.id}">
                    ${ann.image ? `
                        <div class="card-image">
                            <img src="${ann.image}" alt="${ann.title}" loading="lazy">
                        </div>
                    ` : ''}

                    <div class="card-header">
                        <div class="announcement-title-container">
                            <div class="announcement-icon">
                                ${getAnnouncementIconSymbol(ann.type)}
                            </div>
                            <h3 class="announcement-title">${ann.title}</h3>
                        </div>
                        <div class="announcement-meta">
                            <span class="announcement-date">
                                <i class="fas fa-calendar"></i>
                                ${new Date(ann.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div class="card-content">
                        <div class="content-display">
                            ${cleanContent}
                        </div>
                    </div>

                    <div class="card-footer">
                        <div class="social-sharing">
                            <span class="share-label">Share:</span>
                            <button class="share-btn facebook" onclick="shareToFacebook('${ann.title.replace(/'/g, '\\\'').replace(/"/g, '\\"')}', \`${textContent.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/`/g, '\\`')}\`, ${ann.id})" title="Share on Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button class="share-btn twitter" onclick="shareToTwitter('${ann.title.replace(/'/g, '\\\'').replace(/"/g, '\\"')}', \`${textContent.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/`/g, '\\`')}\`, ${ann.id})" title="Share on X">
                                <i class="fab fa-x-twitter"></i>
                            </button>
                            <button class="share-btn whatsapp" onclick="shareToWhatsApp('${ann.title.replace(/'/g, '\\\'').replace(/"/g, '\\"')}', \`${textContent.replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/`/g, '\\`')}\`, ${ann.id})" title="Share on WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="share-btn copy-link" onclick="copyAnnouncementLink(${ann.id})" title="Copy Link">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                </div>
                `;
                }).join('');
            } else {
                // Show message when no announcements available
                announcementGrid.innerHTML = `
                    <div class="no-announcements-message">
                        <i class="fas fa-bullhorn"></i>
                        <h3>No Announcements Yet</h3>
                        <p>Check back soon for the latest school announcements and updates.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading homepage announcements:', error);
        const announcementGrid = document.querySelector('.announcement-grid');
        if (announcementGrid) {
            announcementGrid.innerHTML = `
                <div class="no-announcements-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Unable to Load</h3>
                    <p>Please refresh the page to try loading announcements again.</p>
                </div>
            `;
        }
    }
}

function getAnnouncementIcon(type) {
    const icons = {
        general: '📢',
        urgent: '🚨',
        admissions: '🎓',
        academic: '📚',
        events: '🎉'
    };
    return icons[type] || '📢';
}

function getAnnouncementIconSymbol(type) {
    const icons = {
        general: '<i class="fas fa-bullhorn"></i>',
        urgent: '<i class="fas fa-exclamation-triangle"></i>',
        admissions: '<i class="fas fa-graduation-cap"></i>',
        academic: '<i class="fas fa-book"></i>',
        events: '<i class="fas fa-calendar-star"></i>'
    };
    return icons[type] || '<i class="fas fa-bullhorn"></i>';
}

function getDefaultAnnouncements() {
    return [];
}

// HTML sanitization function to safely preserve formatting
function sanitizeHTML(htmlString) {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // Remove all script tags and event handlers
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remove dangerous attributes that could execute JavaScript
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove event handler attributes
        const attributes = [...element.attributes];
        attributes.forEach(attr => {
            if (attr.name.toLowerCase().startsWith('on') || 
                attr.name.toLowerCase() === 'javascript:' ||
                attr.value.toLowerCase().includes('javascript:')) {
                element.removeAttribute(attr.name);
            }
        });
    });

    // Allow only safe HTML tags and preserve formatting
    const allowedTags = ['p', 'strong', 'b', 'em', 'i', 'u', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'font'];
    const allowedAttributes = ['style', 'color', 'size', 'face'];

    allElements.forEach(element => {
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
            // Replace disallowed tags with their text content
            element.outerHTML = element.innerHTML;
        } else {
            // Keep only safe attributes
            const attributes = [...element.attributes];
            attributes.forEach(attr => {
                if (!allowedAttributes.includes(attr.name.toLowerCase())) {
                    // Allow style attribute but sanitize it for safe CSS properties
                    if (attr.name.toLowerCase() === 'style') {
                        const styleValue = attr.value.toLowerCase();
                        // Keep safe style properties: color, font-size, font-family, font-weight, text-decoration
                        if (styleValue.includes('color') || 
                            styleValue.includes('font-size') || 
                            styleValue.includes('font-family') ||
                            styleValue.includes('font-weight') ||
                            styleValue.includes('text-decoration') ||
                            styleValue.includes('text-align')) {
                            // Keep safe style attributes - don't remove them
                            return;
                        }
                    }
                    // Remove unsafe attributes
                    element.removeAttribute(attr.name);
                }
            });
        }
    });

    return tempDiv.innerHTML;
}

// Enhanced content formatting for home page
function formatContentForDisplay(content) {
    // Use the same sanitization as announcements.js to preserve formatting safely
    return sanitizeHTML(content);
}

function getPlainTextContent(content) {
    // Create a temporary element in a safe way that doesn't execute scripts
    const tempDiv = document.createElement('div');
    // Use textContent first to avoid script execution, then innerHTML only for parsing
    tempDiv.innerHTML = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    return tempDiv.textContent || tempDiv.innerText || '';
}

// Simple markdown-style formatting for backward compatibility
function formatContent(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '&bull; ');
}

// Setup interactions for announcement cards
function setupAnnouncementInteractions() {
    // Setup read more/less functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('read-more-btn')) {
            const card = e.target.closest('.announcement-card');
            const contentPreview = card.querySelector('.content-preview');
            const contentFull = card.querySelector('.content-full');

            if (e.target.textContent === 'Read More') {
                contentPreview.style.display = 'none';
                contentFull.style.display = 'block';
                e.target.textContent = 'Read Less';
            } else {
                contentPreview.style.display = 'block';
                contentFull.style.display = 'none';
                e.target.textContent = 'Read More';
            }
        }
    });
}

// Enhanced Social Media Sharing Functions with Rich Image Previews
async function shareToFacebook(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);

    // Create a dedicated sharing URL with announcement ID
    const shareUrl = `${window.location.origin}/announcement-share.html?id=${announcementId}`;
    
    // Update current page meta tags for immediate sharing
    updateSocialMetaTags(title, content, announcement?.image, announcementId);

    // Create hidden iframe to pre-load the sharing page (helps with meta tag detection)
    const iframe = document.createElement('iframe');
    iframe.src = shareUrl;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Wait a moment for the iframe to load, then remove it
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);

    // Use Facebook's sharer with dedicated URL that has proper meta tags
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
}

async function shareToTwitter(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);

    // Create a dedicated sharing URL
    const shareUrl = `${window.location.origin}/announcement-share.html?id=${announcementId}`;
    
    // Update meta tags for Twitter card with image
    updateSocialMetaTags(title, content, announcement?.image, announcementId);

    // Strip HTML tags and prepare content for Twitter
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    // Create Twitter-optimized text with hashtags and URL
    let tweetText = `📢 ${title}\n\n${cleanContent.substring(0, 180)}\n\n🎓 #SiyabulelaSSS #SchoolNews #Education`;

    // Add the sharing URL which will show the rich card
    tweetText += `\n\n${shareUrl}`;

    const encodedText = encodeURIComponent(tweetText);
    window.open(`https://x.com/intent/tweet?text=${encodedText}`, '_blank', 'width=600,height=400');
}

async function shareToWhatsApp(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);

    // Create a dedicated sharing URL
    const shareUrl = `${window.location.origin}/announcement-share.html?id=${announcementId}`;

    // Convert HTML formatting to WhatsApp markdown
    let whatsappContent = content
        .replace(/<strong>(.*?)<\/strong>/g, '*$1*')
        .replace(/<b>(.*?)<\/b>/g, '*$1*')
        .replace(/<em>(.*?)<\/em>/g, '_$1_')
        .replace(/<i>(.*?)<\/i>/g, '_$1_')
        .replace(/<u>(.*?)<\/u>/g, '$1')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<li>(.*?)<\/li>/g, '• $1\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

    // Limit content for WhatsApp
    if (whatsappContent.length > 300) {
        whatsappContent = whatsappContent.substring(0, 300) + '...';
    }

    let shareText = `*${title}*\n\n${whatsappContent}\n\n📸 View with images: ${shareUrl}\n\nSiyabulela Senior Secondary School`;

    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Function to get announcement by ID
async function getAnnouncementById(announcementId) {
    try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
            const announcements = await response.json();
            return announcements.find(ann => ann.id === announcementId);
        } else {
            console.error('Failed to load announcements from server');
            return null;
        }
    } catch (error) {
        console.error('Error getting announcement:', error);
        return null;
    }
}

// Enhanced function to update social media meta tags for rich previews
function updateSocialMetaTags(title, content, imageUrl, announcementId) {
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const description = cleanContent.length > 160 ? cleanContent.substring(0, 160) + '...' : cleanContent;
    
    // Create a specific URL for this announcement
    const shareUrl = announcementId ? 
        `${window.location.origin}/announcement-share.html?id=${announcementId}` : 
        window.location.href;

    // Update or create Open Graph meta tags for Facebook
    updateMetaTag('og:title', `${title} - Siyabulela Senior Secondary School`);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', shareUrl);
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:site_name', 'Siyabulela Senior Secondary School');
    updateMetaTag('og:locale', 'en_US');

    // Twitter Card meta tags for X/Twitter
    updateMetaTag('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
    updateMetaTag('twitter:title', `${title} - Siyabulela SSS`);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:site', '@SiyabulelaSSS');
    updateMetaTag('twitter:creator', '@SiyabulelaSSS');

    // Add image meta tags if image exists
    if (imageUrl) {
        // Ensure we have a full URL for the image
        let fullImageUrl;
        if (imageUrl.startsWith('http')) {
            fullImageUrl = imageUrl;
        } else if (imageUrl.startsWith('data:')) {
            // For data URLs (base64 images), we need to create a proper URL
            fullImageUrl = imageUrl;
        } else {
            fullImageUrl = `${window.location.origin}/${imageUrl}`;
        }

        // Open Graph image tags
        updateMetaTag('og:image', fullImageUrl);
        updateMetaTag('og:image:type', 'image/jpeg');
        updateMetaTag('og:image:width', '1200');
        updateMetaTag('og:image:height', '630');
        updateMetaTag('og:image:alt', title);

        // Twitter image tags
        updateMetaTag('twitter:image', fullImageUrl);
        updateMetaTag('twitter:image:alt', title);
    } else {
        // Use school logo as fallback
        const logoUrl = `${window.location.origin}/images/Logo.jpg`;
        updateMetaTag('og:image', logoUrl);
        updateMetaTag('og:image:type', 'image/jpeg');
        updateMetaTag('og:image:width', '400');
        updateMetaTag('og:image:height', '400');
        updateMetaTag('og:image:alt', 'Siyabulela Senior Secondary School Logo');
        updateMetaTag('twitter:image', logoUrl);
        updateMetaTag('twitter:image:alt', 'Siyabulela Senior Secondary School Logo');
    }

    // Additional meta tags for better sharing
    updateMetaTag('article:author', 'Siyabulela Senior Secondary School');
    updateMetaTag('article:publisher', 'Siyabulela Senior Secondary School');
    updateMetaTag('article:section', 'School News');
}

// Helper function to update or create meta tags
function updateMetaTag(property, content) {
    let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);

    if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
            metaTag.setAttribute('property', property);
        } else {
            metaTag.setAttribute('name', property);
        }
        document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', content);
}

function copyAnnouncementLink(announcementId) {
    const url = `${window.location.href}#announcement-${announcementId}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showCopySuccess();
        }).catch(() => {
            fallbackCopyText(url);
        });
    } else {
        fallbackCopyText(url);
    }
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        alert('Unable to copy link. Please copy manually: ' + text);
    }
    document.body.removeChild(textarea);
}

function showCopySuccess() {
    // Find the copy button that was clicked and show feedback
    const copyButtons = document.querySelectorAll('.share-btn.copy-link');
    copyButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        const originalClass = icon.className;

        btn.classList.add('copied');
        icon.className = 'fas fa-check';

        setTimeout(() => {
            btn.classList.remove('copied');
            icon.className = originalClass;
        }, 2000);
    });
}