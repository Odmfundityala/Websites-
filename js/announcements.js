// Announcement Management System with Enhanced Security
class AnnouncementManager {
    constructor() {
        this.announcements = this.loadAnnouncements();
        this.editingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayAnnouncements();
        this.updatePreview();
        
        // Set today's date as default
        const dateInput = document.getElementById('announcementDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    setupEventListeners() {
        const form = document.getElementById('announcementForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        // Check authentication before allowing any operations
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to manage announcements', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const announcement = {
            id: this.editingId || Date.now(),
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type'),
            date: formData.get('date'),
            dateCreated: this.editingId ? this.announcements.find(a => a.id === this.editingId)?.dateCreated : new Date().toISOString(),
            dateModified: this.editingId ? new Date().toISOString() : null
        };

        if (this.editingId) {
            this.updateAnnouncement(announcement);
        } else {
            this.addAnnouncement(announcement);
        }
        
        this.resetForm();
    }

    addAnnouncement(announcement) {
        this.announcements.unshift(announcement);
        this.saveAnnouncements();
        this.displayAnnouncements();
        this.updatePreview();
        
        this.showMessage('Announcement added successfully!', 'success');
    }

    updateAnnouncement(announcement) {
        const index = this.announcements.findIndex(ann => ann.id === announcement.id);
        if (index !== -1) {
            this.announcements[index] = announcement;
            this.saveAnnouncements();
            this.displayAnnouncements();
            this.updatePreview();
            
            this.showMessage('Announcement updated successfully!', 'success');
        }
    }

    editAnnouncement(id) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to edit announcements', 'error');
            return;
        }

        const announcement = this.announcements.find(ann => ann.id === id);
        if (announcement) {
            this.editingId = id;
            
            // Populate form with announcement data
            document.getElementById('announcementTitle').value = announcement.title;
            document.getElementById('announcementContent').value = announcement.content;
            document.getElementById('announcementType').value = announcement.type;
            document.getElementById('announcementDate').value = announcement.date;
            
            // Update form button text
            const submitBtn = document.querySelector('#announcementForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
            }
            
            // Scroll to form
            document.getElementById('announcementForm').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteAnnouncement(id) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to delete announcements', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            this.announcements = this.announcements.filter(ann => ann.id !== id);
            this.saveAnnouncements();
            this.displayAnnouncements();
            this.updatePreview();
            
            this.showMessage('Announcement deleted successfully!', 'success');
        }
    }

    resetForm() {
        const form = document.getElementById('announcementForm');
        if (form) {
            form.reset();
            this.editingId = null;
            
            // Reset button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Announcement';
            }
            
            // Reset date to today
            const dateInput = document.getElementById('announcementDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
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
                        <button class="edit-btn" onclick="announcementManager.editAnnouncement(${ann.id})" title="Edit announcement">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="announcementManager.deleteAnnouncement(${ann.id})" title="Delete announcement">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="announcement-meta">
                    <span class="announcement-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(ann.date).toLocaleDateString()}
                    </span>
                    ${ann.dateModified ? `
                        <span class="announcement-modified">
                            <i class="fas fa-clock"></i>
                            Modified: ${new Date(ann.dateModified).toLocaleDateString()}
                        </span>
                    ` : ''}
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

    isAuthenticated() {
        try {
            const authData = JSON.parse(localStorage.getItem('siya_admin_auth'));
            if (!authData || !authData.isAuthenticated) return false;
            
            // Check if login is within last 24 hours
            const loginTime = new Date(authData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            return hoursDiff < 24;
        } catch (error) {
            return false;
        }
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
        messageDiv.className = `admin-message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            font-weight: 600;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        // Add animation styles
        if (!document.querySelector('#messageAnimations')) {
            const style = document.createElement('style');
            style.id = 'messageAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }

    // Method to get announcements for other pages
    getPublicAnnouncements(limit = 4) {
        return this.announcements.slice(0, limit);
    }

    // Clear all announcements (admin only)
    clearAllAnnouncements() {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to perform this action', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete ALL announcements? This action cannot be undone.')) {
            this.announcements = [];
            this.saveAnnouncements();
            this.displayAnnouncements();
            this.updatePreview();
            
            this.showMessage('All announcements cleared successfully!', 'success');
        }
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