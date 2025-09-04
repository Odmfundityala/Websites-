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
                // Allow the link to navigate first, then close the menu
                setTimeout(() => {
                    menuOpen = false;
                    navLinks.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }, 100);
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
    }
});

// Function to load announcements on homepage
function loadHomepageAnnouncements() {
    try {
        const stored = localStorage.getItem('siya_announcements');
        const announcements = stored ? JSON.parse(stored) : getDefaultAnnouncements();
        
        const announcementGrid = document.querySelector('.announcement-grid');
        if (announcementGrid && announcements.length > 0) {
            // Display latest 2 announcements
            const latestAnnouncements = announcements.slice(0, 2);
            
            announcementGrid.innerHTML = latestAnnouncements.map(ann => `
                <div class="announcement-card">
                    <h3>${getAnnouncementIcon(ann.type)} ${ann.title}</h3>
                    <p>${ann.content}</p>
                    <div class="announcement-date-preview">
                        <small><i class="fas fa-calendar"></i> ${new Date(ann.date).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading homepage announcements:', error);
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
    return [
        {
            id: 1,
            title: "🎓 Admissions 2026 - Now Open!",
            content: "Admissions are open for Grade 8 & Grade 10 only. Application forms available from 22/07/2025. Closing date: 29/08/2025 (Extended: 05/09/2025). Important dates: 06/09/2025 - All learners must come to school at 10am in the Great Hall. 10/09/2025 - Admitted learners list will be posted. 12/09/2025 - Parents must submit proof of payment.",
            type: "admissions",
            date: "2025-07-22",
            dateCreated: new Date().toISOString()
        },
        {
            id: 2,
            title: "🏆 Celebrating Academic Excellence",
            content: "We are proud to announce our continued academic success with an 81.8% pass rate in 2024! Our students continue to achieve remarkable results that inspire our entire community.",
            type: "academic",
            date: new Date().toISOString().split('T')[0],
            dateCreated: new Date().toISOString()
        }
    ];
}