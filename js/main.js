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
function loadHomepageAnnouncements() {
    try {
        const stored = localStorage.getItem('siya_announcements');
        const announcements = stored ? JSON.parse(stored) : [];
        
        const announcementGrid = document.querySelector('.announcement-grid');
        if (announcementGrid && announcements.length > 0) {
            // Display latest 2 announcements
            const latestAnnouncements = announcements.slice(0, 2);
            
            announcementGrid.innerHTML = latestAnnouncements.map(ann => {
                const isLongContent = ann.content.length > 300;
                const shortContent = isLongContent ? ann.content.substring(0, 300) + '...' : ann.content;
                
                return `
                <div class="announcement-card" data-id="${ann.id}">
                    <h3>${getAnnouncementIcon(ann.type)} ${ann.title}</h3>
                    <p class="announcement-content ${isLongContent ? 'truncated' : ''}" data-full-content="${ann.content.replace(/"/g, '&quot;')}">${shortContent}</p>
                    ${isLongContent ? '<button class="read-more-btn">Read More</button>' : ''}
                </div>
                `;
            }).join('');
        } else if (announcementGrid) {
            // Show message when no announcements available
            announcementGrid.innerHTML = `
                <div class="no-announcements-message">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No Announcements Yet</h3>
                    <p>Check back soon for the latest school announcements and updates.</p>
                </div>
            `;
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

function getDefaultAnnouncements() {
    return [];
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
                contentElement.innerHTML = fullContent;
                contentElement.classList.remove('truncated');
                e.target.textContent = 'Read Less';
            } else {
                const shortContent = fullContent.substring(0, 300) + '...';
                contentElement.innerHTML = shortContent;
                contentElement.classList.add('truncated');
                e.target.textContent = 'Read More';
            }
        }
    });
}