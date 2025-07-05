
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle - Optimized
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    let menuOpen = false;
    let resizeTimeout;

    if (navToggle && navLinks) {
        // Debounced toggle function
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

        // Optimized outside click handler
        document.addEventListener('click', (e) => {
            if (menuOpen && !navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                menuOpen = false;
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        }, { passive: true });

        // Optimized navigation link handler
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && menuOpen) {
                menuOpen = false;
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        // Debounced resize handler
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth > 950 && menuOpen) {
                    menuOpen = false;
                    navLinks.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            }, 150);
        }, { passive: true });
        
        // Set active navigation link based on current page
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

    // Lazy load chart when needed
    const passRateChart = document.getElementById('passRateChart');
    if (passRateChart) {
        // Use Intersection Observer for lazy loading
        const chartObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initializeChart();
                    chartObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        chartObserver.observe(passRateChart);

        function initializeChart() {
            const ctx = passRateChart.getContext('2d');
            
            // Simplified pass rate data
            const passRateData = {
                labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Pass Rate (%)',
                    data: [45.95, 50.0, 90.0, 87.5, 79.8, 85.7, 81.8],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#3b82f6'
                }]
            };

        const config = {
                type: 'line',
                data: passRateData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Matric Pass Rate Performance (2018-2024)',
                            font: { size: 16, weight: 'bold' },
                            color: '#1a365d'
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { color: '#2d3748' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 54, 93, 0.9)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.parsed.y}% Pass Rate`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#2d3748',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { color: 'rgba(99, 179, 237, 0.2)' }
                        },
                        x: {
                            ticks: { color: '#2d3748' },
                            grid: { display: false }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            };

            new Chart(ctx, config);
        }
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
                // Close mobile menu after clicking a link
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
});
