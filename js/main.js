The code adds a colorful theme with red highlights to the academic performance chart and maintains the mobile navigation toggle functionality.
```

```replit_final_file
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
                    borderColor: '#dc2626', // Red primary line
                    backgroundColor: 'rgba(220, 38, 38, 0.15)', // Light red fill
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: ['#ef4444', '#22c55e', '#eab308'], // Red, Green, Yellow points
                    pointBorderColor: ['#ffffff', '#ffffff', '#ffffff'], // White borders
                    pointBorderWidth: 3,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    pointHoverBackgroundColor: ['#dc2626', '#16a34a', '#ca8a04'],
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 4
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
                            labels: {
                                color: '#dc2626', // Red legend text
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#1a365d', // Navy ticks
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { 
                                color: 'rgba(220, 38, 38, 0.3)', // Red grid lines
                                lineWidth: 1
                            },
                            title: {
                                display: true,
                                text: 'Pass Rate (%)',
                                color: '#dc2626',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            ticks: { 
                                color: '#1a365d',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: { display: false },
                            title: {
                                display: true,
                                text: 'Academic Years',
                                color: '#dc2626',
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    elements: {
                        line: {
                            tension: 0.4
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 54, 93, 0.95)',
                        titleColor: '#ecc94b',
                        bodyColor: '#ffffff',
                        borderColor: '#dc2626',
                        borderWidth: 2,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `Pass Rate: ${context.parsed.y}%`;
                            },
                            title: function(context) {
                                return `Year ${context[0].label}`;
                            }
                        }
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