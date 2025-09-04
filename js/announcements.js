
// Announcement Management System
class AnnouncementManager {
    constructor() {
        this.announcements = this.loadAnnouncements();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayAnnouncements();
        this.updatePreview();
        
        // Set today's date as default
        document.getElementById('announcementDate').value = new Date().toISOString().split('T')[0];
    }

    setupEventListeners() {
        const form = document.getElementById('announcementForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const announcement = {
            id: Date.now(),
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type'),
            date: formData.get('date'),
            dateCreated: new Date().toISOString()
        };

        this.addAnnouncement(announcement);
        e.target.reset();
        
        // Reset date to today
        document.getElementById('announcementDate').value = new Date().toISOString().split('T')[0];
    }

    addAnnouncement(announcement) {
        this.announcements.unshift(announcement);
        this.saveAnnouncements();
        this.displayAnnouncements();
        this.updatePreview();
        
        // Show success message
        this.showMessage('Announcement added successfully!', 'success');
    }

    deleteAnnouncement(id) {
        this.announcements = this.announcements.filter(ann => ann.id !== id);
        this.saveAnnouncements();
        this.displayAnnouncements();
        this.updatePreview();
        
        this.showMessage('Announcement deleted successfully!', 'success');
    }

    displayAnnouncements() {
        const container = document.getElementById('announcementsList');
        if (!container) return;

        if (this.announcements.length === 0) {
            container.innerHTML = '<p class="no-announcements">No announcements yet. Create your first one!</p>';
            return;
        }

        container.innerHTML = this.announcements.map(ann => `
            <div class="announcement-item" data-type="${ann.type}">
                <div class="announcement-header">
                    <h3>${ann.title}</h3>
                    <div class="announcement-actions">
                        <span class="announcement-type ${ann.type}">${ann.type.toUpperCase()}</span>
                        <button class="delete-btn" onclick="announcementManager.deleteAnnouncement(${ann.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="announcement-meta">
                    <span class="announcement-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(ann.date).toLocaleDateString()}
                    </span>
                </div>
                <p class="announcement-text">${ann.content}</p>
            </div>
        `).join('');
    }

    updatePreview() {
        const previewContainer = document.getElementById('previewGrid');
        if (!previewContainer) return;

        const displayAnnouncements = this.announcements.slice(0, 4); // Show only latest 4
        
        if (displayAnnouncements.length === 0) {
            previewContainer.innerHTML = '<p class="no-announcements">No announcements to display</p>';
            return;
        }

        previewContainer.innerHTML = displayAnnouncements.map(ann => `
            <div class="announcement-card">
                <h3>${this.getAnnouncementIcon(ann.type)} ${ann.title}</h3>
                <p>${ann.content}</p>
                <div class="announcement-date-preview">
                    <small><i class="fas fa-calendar"></i> ${new Date(ann.date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    getAnnouncementIcon(type) {
        const icons = {
            general: '📢',
            urgent: '🚨',
            admissions: '🎓',
            academic: '📚',
            events: '🎉'
        };
        return icons[type] || '📢';
    }

    loadAnnouncements() {
        try {
            const stored = localStorage.getItem('siya_announcements');
            return stored ? JSON.parse(stored) : this.getDefaultAnnouncements();
        } catch (error) {
            console.error('Error loading announcements:', error);
            return this.getDefaultAnnouncements();
        }
    }

    saveAnnouncements() {
        try {
            localStorage.setItem('siya_announcements', JSON.stringify(this.announcements));
        } catch (error) {
            console.error('Error saving announcements:', error);
            this.showMessage('Error saving announcements', 'error');
        }
    }

    getDefaultAnnouncements() {
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

    showMessage(message, type) {
        // Create and show a temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Method to get announcements for other pages
    getPublicAnnouncements(limit = 4) {
        return this.announcements.slice(0, limit);
    }
}

// Initialize the announcement manager when the page loads
let announcementManager;
document.addEventListener('DOMContentLoaded', () => {
    announcementManager = new AnnouncementManager();
});

// Export for use in other pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnnouncementManager;
}
