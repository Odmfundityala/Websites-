// Gallery Management System
class GalleryManager {
    constructor() {
        this.photos = [];
        this.editingId = null;
        this.currentPhotoIndex = 0;
        this.selectedFiles = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPhotos();
        this.displayPhotos();
    }

    setupEventListeners() {
        // Admin form submission
        const form = document.getElementById('galleryForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Image preview for admin upload
        const imageInput = document.getElementById('galleryImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImagePreview(e));
        }

        // Lightbox controls
        const lightbox = document.getElementById('lightbox');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');

        if (lightbox && lightboxClose) {
            lightboxClose.addEventListener('click', () => this.closeLightbox());
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    this.closeLightbox();
                }
            });
        }

        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', () => this.navigateLightbox(1));
        }

        // Keyboard navigation for lightbox
        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('lightbox');
            if (lightbox && lightbox.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    this.navigateLightbox(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigateLightbox(1);
                }
            }
        });
    }

    handleImagePreview(e) {
        const files = Array.from(e.target.files);
        const previewSection = document.getElementById('galleryImagePreview');
        const previewContainer = document.getElementById('galleryPreviewContainer');

        if (files.length > 0 && previewSection && previewContainer) {
            this.selectedFiles = files;
            previewContainer.innerHTML = '';
            previewSection.style.display = 'block';

            files.forEach((file, index) => {
                if (file.size > 10 * 1024 * 1024) {
                    this.showMessage(`Image ${index + 1} exceeds 10MB limit and will be skipped`, 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.style.cssText = 'position: relative; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    img.style.cssText = 'width: 100%; height: 80px; object-fit: cover; display: block;';
                    
                    const fileName = document.createElement('p');
                    fileName.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;
                    fileName.style.cssText = 'margin: 0.25rem; font-size: 0.65rem; color: #6b7280; text-align: center;';
                    
                    previewItem.appendChild(img);
                    previewItem.appendChild(fileName);
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        // Check authentication before allowing any operations
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to manage gallery', 'error');
            return;
        }

        const title = document.getElementById('galleryTitle').value;
        const files = Array.from(document.getElementById('galleryImage').files);

        if (files.length === 0) {
            this.showMessage('Please select at least one image to upload', 'error');
            return;
        }

        // Filter files by size
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                this.showMessage(`Skipping ${file.name} - exceeds 10MB limit`, 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            this.showMessage('No valid images to upload', 'error');
            return;
        }

        // Show progress message
        this.showMessage(`Uploading ${validFiles.length} image(s)...`, 'success');

        // Upload all images
        let successCount = 0;
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const success = await this.uploadSingleImage(file, title, i);
            if (success) successCount++;
        }

        // Reload and display
        await this.loadPhotos();
        this.displayPhotos();
        this.resetForm();

        if (successCount === validFiles.length) {
            this.showMessage(`Successfully uploaded ${successCount} photo(s)!`, 'success');
        } else {
            this.showMessage(`Uploaded ${successCount} of ${validFiles.length} photo(s)`, 'error');
        }
    }

    async uploadSingleImage(file, baseTitle, index) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photo = {
                    id: Date.now() + index,
                    title: index === 0 ? baseTitle : `${baseTitle} (${index + 1})`,
                    image: e.target.result,
                    date: new Date().toISOString().split('T')[0],
                    dateCreated: new Date().toISOString()
                };

                const success = await this.savePhotoToServer(photo);
                resolve(success);
            };
            reader.readAsDataURL(file);
        });
    }

    async savePhotoToServer(photo) {
        try {
            const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(photo)
            });

            if (response.ok) {
                const result = await response.json();
                return result.success;
            } else {
                console.error('Failed to save photo to server');
                return false;
            }
        } catch (error) {
            console.error('Error saving photo:', error);
            return false;
        }
    }

    async loadPhotos() {
        try {
            const response = await fetch('/api/gallery?t=' + Date.now());
            if (response.ok) {
                const photos = await response.json();
                if (Array.isArray(photos)) {
                    this.photos = photos;
                    return photos;
                }
                this.photos = [];
                return [];
            } else {
                console.error('Failed to load photos from server');
                this.photos = [];
                return [];
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            this.photos = [];
            return [];
        }
    }

    displayPhotos() {
        // Display for public gallery page
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            galleryGrid.innerHTML = '';
            
            if (this.photos.length === 0) {
                galleryGrid.innerHTML = `
                    <div class="no-gallery-items" style="grid-column: 1/-1;">
                        <i class="fas fa-images"></i>
                        <h3>No Photos Yet</h3>
                        <p>Photos will appear here once they are uploaded by the administrator.</p>
                    </div>
                `;
                return;
            }

            this.photos.forEach((photo, index) => {
                const item = this.createGalleryItem(photo, index);
                galleryGrid.appendChild(item);
            });
        }

        // Display for admin panel
        const galleryList = document.getElementById('galleryList');
        if (galleryList) {
            galleryList.innerHTML = '';
            
            if (this.photos.length === 0) {
                galleryList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No photos uploaded yet. Upload your first photo!</p>';
                return;
            }

            this.photos.forEach((photo) => {
                const card = this.createAdminPhotoCard(photo);
                galleryList.appendChild(card);
            });
        }
    }

    createGalleryItem(photo, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => this.openLightbox(index);

        const img = document.createElement('img');
        img.src = photo.image;
        img.alt = photo.title;
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';
        
        const title = document.createElement('div');
        title.className = 'gallery-item-title';
        title.textContent = photo.title;

        const date = document.createElement('div');
        date.className = 'gallery-item-date';
        date.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(photo.date).toLocaleDateString()}`;

        overlay.appendChild(title);
        overlay.appendChild(date);
        
        item.appendChild(img);
        item.appendChild(overlay);

        return item;
    }

    createAdminPhotoCard(photo) {
        const card = document.createElement('div');
        card.className = 'announcement-card elegant';
        card.style.cssText = 'background: white; border-radius: 12px; margin-bottom: 1.25rem; overflow: hidden; box-shadow: 0 2px 12px rgba(26, 54, 93, 0.08); border: 1px solid #e2e8f0;';

        // Image
        const cardImage = document.createElement('div');
        cardImage.className = 'card-image';
        const img = document.createElement('img');
        img.src = photo.image;
        img.alt = photo.title;
        img.style.cssText = 'width: 100%; height: 200px; object-fit: cover;';
        cardImage.appendChild(img);

        // Content
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.style.cssText = 'padding: 1.25rem;';

        const title = document.createElement('h3');
        title.className = 'announcement-title';
        title.style.cssText = 'color: #000000; font-size: 1.1rem; margin-bottom: 0.5rem;';
        title.textContent = photo.title;

        const date = document.createElement('p');
        date.style.cssText = 'color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;';
        date.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(photo.date).toLocaleDateString()}`;

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 0.75rem; margin-top: 1rem;';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.style.cssText = 'flex: 1; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;';
        deleteBtn.onclick = () => this.deletePhoto(photo.id);

        actions.appendChild(deleteBtn);
        
        cardContent.appendChild(title);
        cardContent.appendChild(date);
        cardContent.appendChild(actions);

        card.appendChild(cardImage);
        card.appendChild(cardContent);

        return card;
    }

    async deletePhoto(id) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to delete photos', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            const success = await this.deletePhotoFromServer(id);
            if (success) {
                await this.loadPhotos();
                this.displayPhotos();
                this.showMessage('Photo deleted successfully!', 'success');
            }
        }
    }

    async deletePhotoFromServer(id) {
        try {
            const response = await fetch(`/api/gallery?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                return result.success;
            } else {
                console.error('Failed to delete photo from server');
                this.showMessage('Error deleting photo from server', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showMessage('Error deleting photo', 'error');
            return false;
        }
    }

    openLightbox(index) {
        this.currentPhotoIndex = index;
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDate = document.getElementById('lightboxDate');

        if (lightbox && lightboxImage && this.photos[index]) {
            const photo = this.photos[index];
            lightboxImage.src = photo.image;
            lightboxImage.alt = photo.title;
            
            if (lightboxTitle) lightboxTitle.textContent = photo.title;
            if (lightboxDate) lightboxDate.textContent = new Date(photo.date).toLocaleDateString();
            
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    navigateLightbox(direction) {
        if (this.photos.length === 0) return;

        this.currentPhotoIndex += direction;
        
        if (this.currentPhotoIndex < 0) {
            this.currentPhotoIndex = this.photos.length - 1;
        } else if (this.currentPhotoIndex >= this.photos.length) {
            this.currentPhotoIndex = 0;
        }

        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDate = document.getElementById('lightboxDate');

        const photo = this.photos[this.currentPhotoIndex];
        if (lightboxImage) {
            lightboxImage.src = photo.image;
            lightboxImage.alt = photo.title;
        }
        if (lightboxTitle) lightboxTitle.textContent = photo.title;
        if (lightboxDate) lightboxDate.textContent = new Date(photo.date).toLocaleDateString();
    }

    resetForm() {
        const form = document.getElementById('galleryForm');
        if (form) {
            form.reset();
            const preview = document.getElementById('galleryImagePreview');
            if (preview) {
                preview.style.display = 'none';
            }
            this.selectedFiles = [];
        }
    }

    isAuthenticated() {
        try {
            const authData = JSON.parse(localStorage.getItem('siya_admin_auth'));
            if (!authData || !authData.isAuthenticated) return false;

            const loginTime = new Date(authData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            return hoursDiff < 24;
        } catch (error) {
            return false;
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            z-index: 10001;
            font-weight: 600;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;

        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;

        const messageText = document.createTextNode(' ' + message);

        messageDiv.appendChild(icon);
        messageDiv.appendChild(messageText);

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
}

// Initialize gallery manager
const galleryManager = new GalleryManager();
