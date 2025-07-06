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

    // Chart initialization
    const passRateChart = document.getElementById('passRateChart');
    if (passRateChart) {
        function initializeChart() {
            if (typeof Chart === 'undefined') {
                console.log('Chart.js not loaded yet, waiting...');
                return;
            }

            try {
                const ctx = passRateChart.getContext('2d');

                const passRateData = {
                    labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                    datasets: [{
                        label: 'Pass Rate (%)',
                        data: [45.95, 50.0, 90.0, 87.5, 79.8, 85.7, 81.8],
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.15)',
                        borderWidth: 4,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 3,
                        pointRadius: 8,
                        pointHoverRadius: 12
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
                                font: { size: 18, weight: 'bold' },
                                color: '#1a365d',
                                padding: 20
                            },
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    color: '#dc2626',
                                    font: { size: 14, weight: 'bold' }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    color: '#1a365d',
                                    font: { size: 12, weight: 'bold' },
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                },
                                grid: { 
                                    color: 'rgba(220, 38, 38, 0.2)',
                                    lineWidth: 1
                                },
                                title: {
                                    display: true,
                                    text: 'Pass Rate (%)',
                                    color: '#dc2626',
                                    font: { size: 14, weight: 'bold' }
                                }
                            },
                            x: {
                                ticks: { 
                                    color: '#1a365d',
                                    font: { size: 12, weight: 'bold' }
                                },
                                grid: { display: false },
                                title: {
                                    display: true,
                                    text: 'Academic Years',
                                    color: '#dc2626',
                                    font: { size: 14, weight: 'bold' }
                                }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeInOutQuart'
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
                console.log('Academic performance chart initialized successfully!');
            } catch (error) {
                console.error('Error initializing chart:', error);
            }
        }

        // Try to initialize chart immediately if Chart.js is already loaded
        if (typeof Chart !== 'undefined') {
            initializeChart();
        } else {
            // Wait for Chart.js to load
            let attempts = 0;
            const maxAttempts = 50;
            const checkChart = setInterval(() => {
                attempts++;
                if (typeof Chart !== 'undefined') {
                    clearInterval(checkChart);
                    initializeChart();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkChart);
                    console.error('Chart.js failed to load after 5 seconds');
                }
            }, 100);

            // Also try when window loads
            window.addEventListener('load', () => {
                if (typeof Chart !== 'undefined') {
                    initializeChart();
                }
            });
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
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });
});