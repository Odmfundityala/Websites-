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
        // Date will be automatically set when announcement is created
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
        
        // Update hidden textarea with rich text editor content
        this.updateHiddenTextarea();
        
        const formData = new FormData(e.target);
        const announcement = {
            id: this.editingId || Date.now(),
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type'),
            date: new Date().toISOString().split('T')[0],
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
            
            // Set content in rich text editor
            const editor = document.getElementById('announcementContent');
            if (editor && editor.contentEditable === 'true') {
                editor.innerHTML = announcement.content;
                this.updateHiddenTextarea();
            }
            
            document.getElementById('announcementType').value = announcement.type;
            
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
            container.innerHTML = '<p class="no-announcements" style="text-align: center; color: #6b7280; padding: 2rem;">No announcements yet. Create your first one!</p>';
            return;
        }

        container.innerHTML = this.announcements.map(ann => `
            <div class="announcement-card elegant" data-type="${ann.type}" data-id="${ann.id}">
                <div class="card-header">
                    <div class="announcement-meta">
                        <span class="announcement-type type-${ann.type}">${ann.type}</span>
                        <span class="announcement-date">
                            <i class="fas fa-calendar"></i>
                            ${new Date(ann.date).toLocaleDateString()}
                        </span>
                    </div>
                    <h3 class="announcement-title">${ann.title}</h3>
                </div>
                
                <div class="card-content">
                    <div class="content-display">
                        ${this.formatContentForDisplay(ann.content)}
                    </div>
                </div>

                <div class="card-footer">
                    <div class="social-sharing">
                        <span class="share-label">Share:</span>
                        <button class="share-btn facebook" onclick="announcementManager.shareToFacebook('${ann.id}')" title="Share on Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="share-btn twitter" onclick="announcementManager.shareToTwitter('${ann.id}')" title="Share on Twitter">
                            <i class="fab fa-twitter"></i>
                        </button>
                        <button class="share-btn whatsapp" onclick="announcementManager.shareToWhatsApp('${ann.id}')" title="Share on WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        <button class="share-btn copy" onclick="announcementManager.copyAnnouncementLink('${ann.id}')" title="Copy Link">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                    
                    <div class="admin-actions">
                        <button class="edit-btn" onclick="announcementManager.editAnnouncement(${ann.id})" title="Edit announcement">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="announcementManager.deleteAnnouncement(${ann.id})" title="Delete announcement">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePreview() {
        const previewContainer = document.getElementById('previewGrid');
        if (!previewContainer) return;

        const displayAnnouncements = this.announcements.slice(0, 4); // Show only latest 4
        
        if (displayAnnouncements.length === 0) {
            previewContainer.innerHTML = '<p class="no-announcements" style="text-align: center; color: #6b7280; padding: 2rem;">No announcements to display</p>';
            return;
        }

        previewContainer.innerHTML = displayAnnouncements.map(ann => `
            <div class="preview-card">
                <h3 style="color: #1e293b; margin-bottom: 1rem;">${this.getAnnouncementIcon(ann.type)} ${ann.title}</h3>
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 1rem;">${ann.content}</p>
                <div class="announcement-date-preview" style="color: #6b7280; font-size: 0.875rem;">
                    <i class="fas fa-calendar"></i> ${new Date(ann.date).toLocaleDateString()}
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
        return [];
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

    toggleContent(id) {
        // Method to toggle content expansion in admin panel
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            const contentElement = item.querySelector('.content-preview');
            const button = item.querySelector('.expand-content-btn');
            const fullContent = contentElement.getAttribute('data-full-content');
            
            if (button.textContent === 'Show Full Content') {
                contentElement.innerHTML = fullContent;
                contentElement.classList.remove('truncated');
                button.textContent = 'Show Less';
            } else {
                const shortContent = fullContent.substring(0, 200) + '...';
                contentElement.innerHTML = shortContent;
                contentElement.classList.add('truncated');
                button.textContent = 'Show Full Content';
            }
        }
    }

    setupRichTextEditor() {
        const editor = document.getElementById('announcementContent');
        const hiddenTextarea = document.getElementById('announcementContentHidden');
        const toolbar = document.querySelector('.rich-text-toolbar');

        if (!editor || !hiddenTextarea || !toolbar) return;

        // Setup toolbar buttons
        toolbar.addEventListener('click', (e) => {
            if (e.target.closest('.format-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.format-btn');
                const command = btn.dataset.command;
                
                editor.focus();
                document.execCommand(command, false, null);
                
                // Update button states
                this.updateToolbarState();
                
                // Update hidden textarea
                this.updateHiddenTextarea();
            }
        });

        // Update hidden textarea when content changes
        editor.addEventListener('input', () => {
            this.updateHiddenTextarea();
        });

        // Handle paste to clean up formatting
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            this.updateHiddenTextarea();
        });

        // Update toolbar state on selection change
        document.addEventListener('selectionchange', () => {
            if (document.activeElement === editor) {
                this.updateToolbarState();
            }
        });
    }

    updateToolbarState() {
        const formatBtns = document.querySelectorAll('.format-btn');
        formatBtns.forEach(btn => {
            const command = btn.dataset.command;
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateHiddenTextarea() {
        const editor = document.getElementById('announcementContent');
        const hiddenTextarea = document.getElementById('announcementContentHidden');
        
        if (editor && hiddenTextarea) {
            hiddenTextarea.value = editor.innerHTML;
        }
    }

    formatContentForDisplay(content) {
        // Clean up HTML content for elegant display
        let cleanContent = content;
        
        // Remove empty paragraphs and fix spacing
        cleanContent = cleanContent.replace(/<p><\/p>/g, '');
        cleanContent = cleanContent.replace(/<p><br><\/p>/g, '');
        cleanContent = cleanContent.replace(/<div><br><\/div>/g, '');
        cleanContent = cleanContent.replace(/<br><\/div>/g, '</div>');
        cleanContent = cleanContent.replace(/<div><br>/g, '<div>');
        
        // Convert divs to paragraphs for better styling
        cleanContent = cleanContent.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
        
        // Remove excessive line breaks
        cleanContent = cleanContent.replace(/(<br\s*\/?>){2,}/g, '<br>');
        
        // If content has no structure, add paragraph tags
        if (!cleanContent.includes('<p>') && !cleanContent.includes('<ul>') && !cleanContent.includes('<ol>')) {
            cleanContent = cleanContent.split('<br>').filter(line => line.trim()).map(line => `<p>${line}</p>`).join('');
        }
        
        // Calculate text length for truncation
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Truncate if too long
        if (textContent.length > 400) {
            const truncateLength = 350;
            let truncated = textContent.substring(0, truncateLength);
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > truncateLength - 50) {
                truncated = truncated.substring(0, lastSpace);
            }
            
            const truncatedHtml = this.preserveFormattingForTruncated(cleanContent, truncated);
            
            return `
                <div class="content-preview">
                    ${truncatedHtml}...
                </div>
                <div class="content-full" style="display: none;">
                    ${cleanContent}
                </div>
                <button class="read-more-btn" onclick="this.previousElementSibling.style.display='block'; this.previousElementSibling.previousElementSibling.style.display='none'; this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                    <i class="fas fa-chevron-down"></i> Read More
                </button>
                <button class="read-less-btn" style="display: none;" onclick="this.previousElementSibling.previousElementSibling.previousElementSibling.style.display='block'; this.previousElementSibling.previousElementSibling.style.display='none'; this.previousElementSibling.style.display='inline-block'; this.style.display='none';">
                    <i class="fas fa-chevron-up"></i> Read Less
                </button>
            `;
        }
        
        return cleanContent;
    }

    preserveFormattingForTruncated(originalHtml, targetText) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHtml;
        
        let result = '';
        let charCount = 0;
        
        const processNode = (node) => {
            if (charCount >= targetText.length) return;
            
            if (node.nodeType === Node.TEXT_NODE) {
                const remainingChars = targetText.length - charCount;
                const text = node.textContent.substring(0, remainingChars);
                result += text;
                charCount += text.length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                if (['p', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li'].includes(tagName)) {
                    result += `<${tagName}>`;
                    for (let child of node.childNodes) {
                        processNode(child);
                        if (charCount >= targetText.length) break;
                    }
                    result += `</${tagName}>`;
                } else {
                    for (let child of node.childNodes) {
                        processNode(child);
                        if (charCount >= targetText.length) break;
                    }
                }
            }
        };
        
        for (let child of tempDiv.childNodes) {
            processNode(child);
            if (charCount >= targetText.length) break;
        }
        
        return result;
    }

    // Social Media Sharing Functions
    shareToFacebook(announcementId) {
        const announcement = this.announcements.find(a => a.id == announcementId);
        if (!announcement) return;
        
        const text = this.getPlainTextContent(announcement);
        const shareText = `${announcement.title}\n\n${text}`;
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    shareToTwitter(announcementId) {
        const announcement = this.announcements.find(a => a.id == announcementId);
        if (!announcement) return;
        
        const text = this.getPlainTextContent(announcement);
        const shareText = `${announcement.title}\n\n${text}`.substring(0, 250) + (text.length > 200 ? '...' : '');
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    shareToWhatsApp(announcementId) {
        const announcement = this.announcements.find(a => a.id == announcementId);
        if (!announcement) return;
        
        const text = this.getPlainTextContent(announcement);
        const shareText = `*${announcement.title}*\n\n${text}`;
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    }

    copyAnnouncementLink(announcementId) {
        const announcement = this.announcements.find(a => a.id == announcementId);
        if (!announcement) return;
        
        const text = this.getPlainTextContent(announcement);
        const shareText = `${announcement.title}\n\n${text}`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            this.showMessage('Announcement copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showMessage('Announcement copied to clipboard!', 'success');
        });
    }

    getPlainTextContent(announcement) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = announcement.content;
        return tempDiv.textContent || tempDiv.innerText || '';
    }
}

// Initialize the announcement manager when the page loads
let announcementManager;
document.addEventListener('DOMContentLoaded', () => {
    announcementManager = new AnnouncementManager();
    
    // Setup rich text editor after DOM is ready
    setTimeout(() => {
        if (announcementManager && announcementManager.setupRichTextEditor) {
            announcementManager.setupRichTextEditor();
        }
    }, 100);
});

// Export for use in other pages
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnnouncementManager;
}