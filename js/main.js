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
                // Sort announcements by date (newest first) and display latest 2
                const sortedAnnouncements = announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
                const latestAnnouncements = sortedAnnouncements.slice(0, 2);
            
            announcementGrid.innerHTML = latestAnnouncements.map(ann => {
                const cleanContent = formatContentForDisplay(ann.content);
                const textContent = getPlainTextContent(ann.content);
                const isLongContent = textContent.length > 300;
                const shortContent = isLongContent ? textContent.substring(0, 300) + '...' : textContent;
                
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
                            <div class="content-preview" ${isLongContent ? 'style="display:block"' : 'style="display:block"'}>
                                ${isLongContent ? shortContent : cleanContent}
                            </div>
                            ${isLongContent ? `
                                <div class="content-full" style="display: none;">
                                    ${cleanContent}
                                </div>
                                <button class="read-more-btn" onclick="this.previousElementSibling.style.display='block'; this.previousElementSibling.previousElementSibling.style.display='none'; this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                                    <i class="fas fa-chevron-down"></i> Read More
                                </button>
                                <button class="read-less-btn" style="display: none;" onclick="this.previousElementSibling.previousElementSibling.previousElementSibling.style.display='block'; this.previousElementSibling.previousElementSibling.style.display='none'; this.previousElementSibling.style.display='inline-block'; this.style.display='none';">
                                    <i class="fas fa-chevron-up"></i> Read Less
                                </button>
                            ` : ''}
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

// Enhanced content formatting for home page
function formatContentForDisplay(content) {
    // Clean up HTML content for elegant display
    let cleanContent = content;
    
    // Remove empty paragraphs and fix spacing
    cleanContent = cleanContent.replace(/<p><\/p>/g, '');
    cleanContent = cleanContent.replace(/<p><br><\/p>/g, '');
    cleanContent = cleanContent.replace(/<div><br><\/div>/g, '');
    cleanContent = cleanContent.replace(/<br><\/div>/g, '</div>');
    cleanContent = cleanContent.replace(/<div><br>/g, '<div>');
    
    // Convert divs to paragraphs for proper styling and spacing
    cleanContent = cleanContent.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
    
    // Handle multiple breaks and create proper paragraph spacing
    cleanContent = cleanContent.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>');
    cleanContent = cleanContent.replace(/(<br\s*\/?>){3,}/g, '</p><p>');
    
    // Clean up any empty paragraphs created
    cleanContent = cleanContent.replace(/<p>\s*<\/p>/g, '');
    cleanContent = cleanContent.replace(/<p><\/p>/g, '');
    
    // Ensure content is wrapped in paragraphs
    if (cleanContent && !cleanContent.startsWith('<p>') && !cleanContent.startsWith('<ul>') && !cleanContent.startsWith('<ol>')) {
        cleanContent = '<p>' + cleanContent;
    }
    if (cleanContent && !cleanContent.endsWith('</p>') && !cleanContent.endsWith('</ul>') && !cleanContent.endsWith('</ol>')) {
        cleanContent = cleanContent + '</p>';
    }
    
    // Final cleanup
    cleanContent = cleanContent.replace(/<p><p>/g, '<p>').replace(/<\/p><\/p>/g, '</p>');
    
    return cleanContent;
}

function getPlainTextContent(content) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = content;
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
            const contentElement = card.querySelector('.announcement-content');
            const fullContent = contentElement.getAttribute('data-full-content');
            
            if (e.target.textContent === 'Read More') {
                contentElement.textContent = fullContent;
                contentElement.classList.remove('truncated');
                e.target.textContent = 'Read Less';
            } else {
                const shortContent = fullContent.substring(0, 800) + '...';
                contentElement.textContent = shortContent;
                contentElement.classList.add('truncated');
                e.target.textContent = 'Read More';
            }
        }
    });
}

// Enhanced Social Media Sharing Functions with Image Support
async function shareToFacebook(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);
    
    // Update meta tags for better social sharing with image
    updateSocialMetaTags(title, content, announcement?.image);
    
    // Strip HTML tags for clean sharing
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const shareText = `${title}\n\n${cleanContent}\n\n📚 Siyabulela Senior Secondary School\n🌟 "Through Hardships to the Stars"`;
    
    // Use Facebook's sharer with content and image
    const currentUrl = `${window.location.origin}/#announcement-${announcementId}`;
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(shareText);
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'width=600,height=400');
}

async function shareToTwitter(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);
    
    // Update meta tags for Twitter card with image
    updateSocialMetaTags(title, content, announcement?.image);
    
    // Strip HTML tags and prepare content for Twitter
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    
    // Create Twitter-optimized text with hashtags
    let tweetText = `📢 ${title}\n\n${cleanContent}\n\n🎓 #SiyabulelaSSS #SchoolNews #Education #SouthAfricaSchools`;
    
    // Truncate if too long (Twitter limit is 280 characters)
    if (tweetText.length > 240) {
        tweetText = tweetText.substring(0, 240) + '...';
    }
    
    const currentUrl = `${window.location.origin}/#announcement-${announcementId}`;
    tweetText += `\n\n${currentUrl}`;
    
    const encodedText = encodeURIComponent(tweetText);
    
    window.open(`https://x.com/intent/tweet?text=${encodedText}`, '_blank', 'width=600,height=400');
}

async function shareToWhatsApp(title, content, announcementId) {
    const announcement = await getAnnouncementById(announcementId);
    
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
    
    let shareText = `*${title}*\n\n${whatsappContent}\n\nSiyabulela Senior Secondary School\n${window.location.href}`;
    
    // If announcement has an image, mention it
    if (announcement?.image) {
        shareText = `*${title}*\n\n${whatsappContent}\n\n📸 View full announcement with image at:\n${window.location.href}\n\nSiyabulela Senior Secondary School`;
    }
    
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

// Function to update social media meta tags for better sharing
function updateSocialMetaTags(title, content, imageUrl) {
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const description = cleanContent.length > 160 ? cleanContent.substring(0, 160) + '...' : cleanContent;
    
    // Update or create Open Graph meta tags
    updateMetaTag('og:title', `${title} - Siyabulela Senior Secondary School`);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:site_name', 'Siyabulela Senior Secondary School');
    
    // Twitter Card meta tags
    updateMetaTag('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
    updateMetaTag('twitter:title', `${title} - Siyabulela SSS`);
    updateMetaTag('twitter:description', description);
    
    // Add image meta tags if image exists
    if (imageUrl) {
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}/${imageUrl}`;
        updateMetaTag('og:image', fullImageUrl);
        updateMetaTag('og:image:width', '1200');
        updateMetaTag('og:image:height', '630');
        updateMetaTag('twitter:image', fullImageUrl);
        updateMetaTag('twitter:image:alt', title);
    } else {
        // Use school logo as fallback
        const logoUrl = `${window.location.origin}/images/logo.png`;
        updateMetaTag('og:image', logoUrl);
        updateMetaTag('twitter:image', logoUrl);
    }
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