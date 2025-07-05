
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navLinks.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navLinks.classList.contains('active')) {
                document.body.classList.add('nav-open');
            } else {
                document.body.classList.remove('nav-open');
            }
            
            console.log('Menu toggled:', navLinks.classList.contains('active'));
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        // Close mobile menu when clicking on a navigation link
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });

        // Handle window resize to close mobile menu on desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 950) {
                navLinks.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
        
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

    // Initialize Pass Rate Chart
    const passRateChart = document.getElementById('passRateChart');
    if (passRateChart) {
        const ctx = passRateChart.getContext('2d');
        
        // Pass rate data
        const passRateData = {
            labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [{
                label: 'Pass Rate (%)',
                data: [45.95, 50.0, 90.0, 87.5, 79.8, 85.7, 81.8],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 3,
                pointRadius: 8,
                pointHoverRadius: 12,
                pointHoverBackgroundColor: '#ecc94b',
                pointHoverBorderColor: '#1a365d',
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
                        text: 'Siyabulela S.S.S. - Matric Pass Rate Performance (2018-2024)',
                        font: {
                            size: 18,
                            weight: 'bold',
                            family: 'Montserrat'
                        },
                        color: '#1a365d',
                        padding: {
                            top: 10,
                            bottom: 30
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#2d3748',
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 54, 93, 0.95)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ecc94b',
                        borderWidth: 2,
                        cornerRadius: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const year = context.label;
                                let message = `${value}% Pass Rate`;
                                
                                // Add contextual messages
                                if (year === '2020') {
                                    message += ' 🏆 Peak Achievement!';
                                } else if (year === '2024') {
                                    message += ' 📈 Latest Success!';
                                } else if (value >= 80) {
                                    message += ' ⭐ Excellent Performance!';
                                }
                                
                                return message;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2d3748',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(99, 179, 237, 0.2)',
                            borderDash: [5, 5]
                        },
                        title: {
                            display: true,
                            text: 'Pass Rate (%)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#1a365d'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2d3748'
                        },
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Academic Year',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#1a365d'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        };

        new Chart(ctx, config);
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
