// Announcement Management System with Enhanced Security
class AnnouncementManager {
    constructor() {
        this.announcements = [];
        this.editingId = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.refreshAnnouncements();
        
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
        
        // Handle image upload
        const imageFile = formData.get('image');
        let imageData = null;
        
        if (imageFile && imageFile.size > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData = e.target.result;
                this.saveAnnouncementWithImage(formData, imageData);
            };
            reader.readAsDataURL(imageFile);
            return; // Exit early, let the reader callback handle saving
        }
        
        // No image, proceed normally
        this.saveAnnouncementWithImage(formData, null);
    }

    saveAnnouncementWithImage(formData, imageData) {
        const announcement = {
            id: this.editingId || Date.now(),
            title: formData.get('title'),
            content: formData.get('content'),
            type: formData.get('type'),
            image: imageData,
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

    async addAnnouncement(announcement) {
        const success = await this.saveAnnouncement(announcement);
        if (success) {
            await this.refreshAnnouncements();
            this.showMessage('Announcement added successfully!', 'success');
        }
    }

    async updateAnnouncement(announcement) {
        // For updates, we need to delete the old one and add the new one
        await this.deleteAnnouncementFromServer(announcement.id);
        const success = await this.saveAnnouncement(announcement);
        if (success) {
            await this.refreshAnnouncements();
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
                // Use sanitized HTML for rich text editor to preserve formatting
                editor.innerHTML = this.sanitizeHTML(announcement.content);
                this.updateHiddenTextarea();
            }
            
            // Set image if exists
            if (announcement.image) {
                const imageInput = document.getElementById('announcementImage');
                const imagePreview = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                
                if (imagePreview && previewImg) {
                    previewImg.src = announcement.image;
                    imagePreview.style.display = 'block';
                }
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

    async deleteAnnouncement(id) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to delete announcements', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            const success = await this.deleteAnnouncementFromServer(id);
            if (success) {
                await this.refreshAnnouncements();
                this.showMessage('Announcement deleted successfully!', 'success');
            }
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
            
            // Reset image preview
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.style.display = 'none';
            }
        }
    }

    displayAnnouncements() {
        const container = document.getElementById('announcementsList');
        if (!container) return;

        // Clear existing content safely
        container.textContent = '';

        if (this.announcements.length === 0) {
            const noAnnouncementsMsg = document.createElement('p');
            noAnnouncementsMsg.className = 'no-announcements';
            noAnnouncementsMsg.style.cssText = 'text-align: center; color: #6b7280; padding: 2rem;';
            noAnnouncementsMsg.textContent = 'No announcements yet. Create your first one!';
            container.appendChild(noAnnouncementsMsg);
            return;
        }

        // Create each announcement card safely using DOM methods
        this.announcements.forEach(ann => {
            const announcementCard = this.createAnnouncementCard(ann);
            container.appendChild(announcementCard);
        });
    }

    createAnnouncementCard(ann) {
        const card = document.createElement('div');
        card.className = 'announcement-card elegant';
        card.setAttribute('data-type', ann.type);
        card.setAttribute('data-id', ann.id);

        // Add image if present
        if (ann.image) {
            const cardImage = document.createElement('div');
            cardImage.className = 'card-image';
            
            const img = document.createElement('img');
            img.src = ann.image;
            img.alt = ann.title;
            img.loading = 'lazy';
            img.style.cssText = 'width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;';
            
            cardImage.appendChild(img);
            card.appendChild(cardImage);
        }

        // Create header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';

        const announcementMeta = document.createElement('div');
        announcementMeta.className = 'announcement-meta';

        const announcementType = document.createElement('span');
        announcementType.className = `announcement-type type-${ann.type}`;
        announcementType.textContent = ann.type;

        const announcementDate = document.createElement('span');
        announcementDate.className = 'announcement-date';
        const calendarIcon = document.createElement('i');
        calendarIcon.className = 'fas fa-calendar';
        announcementDate.appendChild(calendarIcon);
        announcementDate.appendChild(document.createTextNode(' ' + new Date(ann.date).toLocaleDateString()));

        announcementMeta.appendChild(announcementType);
        announcementMeta.appendChild(announcementDate);

        const title = document.createElement('h3');
        title.className = 'announcement-title';
        title.textContent = ann.title;

        cardHeader.appendChild(announcementMeta);
        cardHeader.appendChild(title);

        // Create content section with safe text content
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        
        const contentDisplay = document.createElement('div');
        contentDisplay.className = 'content-display';
        
        // Use safe text content instead of HTML
        const contentText = this.extractTextContent(ann.content);
        if (contentText.length > 400) {
            const truncated = contentText.substring(0, 350);
            const lastSpace = truncated.lastIndexOf(' ');
            const finalTruncated = lastSpace > 300 ? truncated.substring(0, lastSpace) : truncated;
            
            const contentPreview = document.createElement('div');
            contentPreview.className = 'content-preview';
            contentPreview.textContent = finalTruncated + '...';
            
            const contentFull = document.createElement('div');
            contentFull.className = 'content-full';
            contentFull.style.display = 'none';
            // For full content, use safe text content to prevent XSS
            const fullTempDiv = document.createElement('div');
            fullTempDiv.textContent = this.extractTextContent(ann.content);
            contentFull.appendChild(fullTempDiv);
            
            const readMoreBtn = document.createElement('button');
            readMoreBtn.className = 'read-more-btn';
            readMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Read More';
            readMoreBtn.onclick = () => {
                contentFull.style.display = 'block';
                contentPreview.style.display = 'none';
                readMoreBtn.style.display = 'none';
                readLessBtn.style.display = 'inline-block';
            };
            
            const readLessBtn = document.createElement('button');
            readLessBtn.className = 'read-less-btn';
            readLessBtn.style.display = 'none';
            readLessBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Read Less';
            readLessBtn.onclick = () => {
                contentPreview.style.display = 'block';
                contentFull.style.display = 'none';
                readMoreBtn.style.display = 'inline-block';
                readLessBtn.style.display = 'none';
            };
            
            contentDisplay.appendChild(contentPreview);
            contentDisplay.appendChild(contentFull);
            contentDisplay.appendChild(readMoreBtn);
            contentDisplay.appendChild(readLessBtn);
        } else {
            // For short content, use safe text content to prevent XSS
            const tempDiv = document.createElement('div');
            tempDiv.textContent = this.extractTextContent(ann.content);
            contentDisplay.appendChild(tempDiv);
        }
        
        cardContent.appendChild(contentDisplay);

        // Create footer with safe event handlers
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';

        const socialSharing = document.createElement('div');
        socialSharing.className = 'social-sharing';

        const shareLabel = document.createElement('span');
        shareLabel.className = 'share-label';
        shareLabel.textContent = 'Share:';

        const facebookBtn = this.createShareButton('facebook', 'fab fa-facebook-f', 'Share on Facebook', () => this.shareToFacebook(ann.id));
        const twitterBtn = this.createShareButton('twitter', 'fab fa-x-twitter', 'Share on X', () => this.shareToTwitter(ann.id));
        const whatsappBtn = this.createShareButton('whatsapp', 'fab fa-whatsapp', 'Share on WhatsApp', () => this.shareToWhatsApp(ann.id));
        const copyBtn = this.createShareButton('copy', 'fas fa-link', 'Copy Link', () => this.copyAnnouncementLink(ann.id));

        socialSharing.appendChild(shareLabel);
        socialSharing.appendChild(facebookBtn);
        socialSharing.appendChild(twitterBtn);
        socialSharing.appendChild(whatsappBtn);
        socialSharing.appendChild(copyBtn);

        const adminActions = document.createElement('div');
        adminActions.className = 'admin-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.title = 'Edit announcement';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.onclick = () => this.editAnnouncement(ann.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete announcement';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.onclick = () => this.deleteAnnouncement(ann.id);

        adminActions.appendChild(editBtn);
        adminActions.appendChild(deleteBtn);

        cardFooter.appendChild(socialSharing);
        cardFooter.appendChild(adminActions);

        // Assemble the card
        card.appendChild(cardHeader);
        card.appendChild(cardContent);
        card.appendChild(cardFooter);

        return card;
    }

    createShareButton(type, iconClass, title, clickHandler) {
        const button = document.createElement('button');
        button.className = `share-btn ${type}`;
        button.title = title;
        button.onclick = clickHandler;
        
        const icon = document.createElement('i');
        icon.className = iconClass;
        button.appendChild(icon);
        
        return button;
    }

    extractTextContent(htmlContent) {
        // Safely extract text content from HTML without executing scripts
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent; // Allow HTML rendering
        return tempDiv.textContent || tempDiv.innerText || '';
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

    async loadAnnouncements() {
        try {
            // Clear localStorage cache to prevent old data
            localStorage.removeItem('siya_announcements');
            
            const response = await fetch('/api/announcements?t=' + Date.now());
            if (response.ok) {
                let announcements = await response.json();
                if (Array.isArray(announcements)) {
                    // Filter out any fake or test announcements
                    announcements = announcements.filter(ann => 
                        ann && ann.title && ann.title.toLowerCase() !== 'vwfww' && 
                        ann.content && ann.content.trim() !== 'xvs&nbsp;'
                    );
                    return announcements;
                }
                return this.getDefaultAnnouncements();
            } else {
                console.error('Failed to load announcements from server');
                return this.getDefaultAnnouncements();
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            return this.getDefaultAnnouncements();
        }
    }

    async saveAnnouncement(announcement) {
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(announcement)
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.success;
            } else {
                console.error('Failed to save announcement to server');
                this.showMessage('Error saving announcement to server', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
            this.showMessage('Error saving announcement', 'error');
            return false;
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
        
        // Create icon element safely
        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
        
        // Create text node safely
        const messageText = document.createTextNode(' ' + message);
        
        // Append elements safely
        messageDiv.appendChild(icon);
        messageDiv.appendChild(messageText);
        
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
    async clearAllAnnouncements() {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to perform this action', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete ALL announcements? This action cannot be undone.')) {
            // Delete all announcements one by one
            for (const announcement of this.announcements) {
                await this.deleteAnnouncementFromServer(announcement.id);
            }
            await this.refreshAnnouncements();
            this.showMessage('All announcements cleared successfully!', 'success');
        }
    }

    async deleteAnnouncementFromServer(id) {
        try {
            const response = await fetch(`/api/announcements?id=${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.success;
            } else {
                console.error('Failed to delete announcement from server');
                this.showMessage('Error deleting announcement from server', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showMessage('Error deleting announcement', 'error');
            return false;
        }
    }

    async refreshAnnouncements() {
        this.announcements = await this.loadAnnouncements();
        this.displayAnnouncements();
    }

    toggleContent(id) {
        // Method to toggle content expansion in admin panel
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            const contentElement = item.querySelector('.content-preview');
            const button = item.querySelector('.expand-content-btn');
            const fullContent = contentElement.getAttribute('data-full-content');
            
            if (button.textContent === 'Show Full Content') {
                contentElement.innerHTML = this.sanitizeHTML(fullContent);
                contentElement.classList.remove('truncated');
                button.textContent = 'Show Less';
            } else {
                const shortContent = fullContent.substring(0, 200) + '...';
                contentElement.innerHTML = this.sanitizeHTML(shortContent);
                contentElement.classList.add('truncated');
                button.textContent = 'Show Full Content';
            }
        }
    }

    sanitizeHTML(htmlString) {
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        
        // Remove all script tags and event handlers
        const scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove dangerous attributes that could execute JavaScript
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(element => {
            // Remove event handler attributes
            const attributes = [...element.attributes];
            attributes.forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on') || 
                    attr.name.toLowerCase() === 'javascript:' ||
                    attr.value.toLowerCase().includes('javascript:')) {
                    element.removeAttribute(attr.name);
                }
            });
        });
        
        // Allow only safe HTML tags and preserve formatting
        const allowedTags = ['p', 'strong', 'b', 'em', 'i', 'u', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
        const elementsToRemove = [];
        
        allElements.forEach(element => {
            if (!allowedTags.includes(element.tagName.toLowerCase())) {
                // Replace disallowed tags with their text content
                element.outerHTML = element.innerHTML;
            }
        });
        
        return tempDiv.innerHTML;
    }

    setupRichTextEditor() {
        const editor = document.getElementById('announcementContent');
        const hiddenTextarea = document.getElementById('announcementContentHidden');
        const toolbar = document.querySelector('.rich-text-toolbar');

        if (!editor || !hiddenTextarea || !toolbar) return;

        // Setup image upload preview
        this.setupImageUpload();

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
        
        // Convert divs to paragraphs for proper styling and spacing
        cleanContent = cleanContent.replace(/<div>/g, '<p>').replace(/<\/div>/g, '</p>');
        
        // Handle multiple breaks and create proper paragraph spacing
        cleanContent = cleanContent.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><p>');
        cleanContent = cleanContent.replace(/(<br\s*\/?>){3,}/g, '</p><p>');
        
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
        const shareText = `📢 ${announcement.title}\n\n${text}\n\n📚 Siyabulela Senior Secondary School\n🌟 "Through Hardships to the Stars"`;
        const currentUrl = `${window.location.origin}/#announcement-${announcementId}`;
        
        // Update meta tags for better image sharing
        if (announcement.image) {
            this.updateMetaTagsForSharing(announcement);
        }
        
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedText = encodeURIComponent(shareText);
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        
        window.open(url, '_blank', 'width=600,height=400');
    }

    shareToTwitter(announcementId) {
        const announcement = this.announcements.find(a => a.id == announcementId);
        if (!announcement) return;
        
        const text = this.getPlainTextContent(announcement);
        let tweetText = `📢 ${announcement.title}\n\n${text}\n\n🎓 #SiyabulelaSSS #SchoolNews #Education`;
        
        // Update meta tags for better image sharing
        if (announcement.image) {
            this.updateMetaTagsForSharing(announcement);
        }
        
        // Truncate if too long for Twitter
        if (tweetText.length > 240) {
            tweetText = tweetText.substring(0, 240) + '...';
        }
        
        const currentUrl = `${window.location.origin}/#announcement-${announcementId}`;
        tweetText += `\n\n${currentUrl}`;
        
        const url = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
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

    updateMetaTagsForSharing(announcement) {
        // Update meta tags for better social sharing with images
        const updateMetaTag = (property, content) => {
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
        };

        // Update Open Graph and Twitter Card meta tags
        updateMetaTag('og:title', announcement.title);
        updateMetaTag('og:description', this.getPlainTextContent(announcement).substring(0, 160));
        updateMetaTag('og:type', 'article');
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', announcement.title);
        updateMetaTag('twitter:description', this.getPlainTextContent(announcement).substring(0, 160));

        if (announcement.image) {
            const fullImageUrl = announcement.image.startsWith('http') ? announcement.image : `${window.location.origin}/${announcement.image}`;
            updateMetaTag('og:image', fullImageUrl);
            updateMetaTag('og:image:width', '1200');
            updateMetaTag('og:image:height', '630');
            updateMetaTag('twitter:image', fullImageUrl);
            updateMetaTag('twitter:image:alt', announcement.title);
        }
    }

    setupImageUpload() {
        const imageInput = document.getElementById('announcementImage');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const removeBtn = document.getElementById('removeImage');

        if (!imageInput || !imagePreview || !previewImg || !removeBtn) return;

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        removeBtn.addEventListener('click', () => {
            imageInput.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
        });
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