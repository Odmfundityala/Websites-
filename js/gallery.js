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
                if (file.size > 20 * 1024 * 1024) {
                    this.showMessage(`Image ${index + 1} exceeds 20MB limit and will be skipped`, 'error');
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
        const category = document.getElementById('galleryCategory').value;
        const files = Array.from(document.getElementById('galleryImage').files);

        if (files.length === 0) {
            this.showMessage('Please select at least one image to upload', 'error');
            return;
        }
        
        if (!category) {
            this.showMessage('Please select an event category', 'error');
            return;
        }

        // Filter files by size
        const validFiles = files.filter(file => {
            if (file.size > 20 * 1024 * 1024) {
                this.showMessage(`Skipping ${file.name} - exceeds 20MB limit`, 'error');
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
            const success = await this.uploadSingleImage(file, title, category, i);
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

    async uploadSingleImage(file, baseTitle, category, index) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const photo = {
                    id: Date.now() + index,
                    title: index === 0 ? baseTitle : `${baseTitle} (${index + 1})`,
                    category: category,
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
                console.log('Photo saved successfully:', result);
                return result.success;
            } else {
                const errorText = await response.text();
                console.error('Failed to save photo to server. Status:', response.status, 'Error:', errorText);
                this.showMessage(`Upload failed: ${response.status} error`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error saving photo:', error);
            this.showMessage(`Upload error: ${error.message}`, 'error');
            return false;
        }
    }

    async loadPhotos() {
        try {
            console.log('[Gallery] Loading photos from server...');
            const response = await fetch('/api/gallery?t=' + Date.now());
            if (response.ok) {
                const photos = await response.json();
                console.log('[Gallery] Loaded', photos.length, 'photos from server');
                if (Array.isArray(photos)) {
                    this.photos = photos;
                    console.log('[Gallery] Photos array updated, now has', this.photos.length, 'photos');
                    return photos;
                }
                console.warn('[Gallery] Server response was not an array');
                this.photos = [];
                return [];
            } else {
                console.error('[Gallery] Failed to load photos from server, status:', response.status);
                this.photos = [];
                return [];
            }
        } catch (error) {
            console.error('[Gallery] Error loading photos:', error);
            this.photos = [];
            return [];
        }
    }

    displayPhotos() {
        console.log('[Gallery] displayPhotos() called with', this.photos.length, 'photos');
        
        // Display for public gallery page - grouped by categories
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            console.log('[Gallery] Found galleryGrid element, displaying', this.photos.length, 'photos');
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

            // Group photos by category for public view
            const photosByCategory = {};
            this.photos.forEach((photo, originalIndex) => {
                const category = photo.category || 'Uncategorized';
                if (!photosByCategory[category]) {
                    photosByCategory[category] = [];
                }
                photosByCategory[category].push({ photo, originalIndex });
            });

            // Display each category
            Object.keys(photosByCategory).sort().forEach((category) => {
                // Category header
                const categoryHeader = document.createElement('div');
                categoryHeader.style.cssText = 'grid-column: 1/-1; margin-top: 2rem; margin-bottom: 1rem;';
                categoryHeader.innerHTML = `
                    <h2 style="color: #1a365d; font-size: 1.75rem; font-weight: 700; margin: 0; padding-bottom: 0.75rem; border-bottom: 3px solid #fbbf24;">
                        <i class="fas fa-folder-open" style="color: #fbbf24; margin-right: 0.5rem;"></i>
                        ${category}
                    </h2>
                `;
                galleryGrid.appendChild(categoryHeader);

                // Photos in this category
                photosByCategory[category].forEach(({ photo, originalIndex }) => {
                    const item = this.createGalleryItem(photo, originalIndex);
                    galleryGrid.appendChild(item);
                });
            });
            
            console.log('[Gallery] Successfully displayed', this.photos.length, 'photos in', Object.keys(photosByCategory).length, 'categories');
        }

        // Display for admin panel - grouped by categories
        const galleryList = document.getElementById('galleryList');
        if (galleryList) {
            console.log('[Gallery] Found galleryList element, displaying', this.photos.length, 'photos');
            galleryList.innerHTML = '';
            
            if (this.photos.length === 0) {
                console.log('[Gallery] No photos to display in admin panel');
                galleryList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No photos uploaded yet. Upload your first photo!</p>';
                return;
            }

            // Group photos by category
            const photosByCategory = {};
            this.photos.forEach((photo) => {
                const category = photo.category || 'Uncategorized';
                if (!photosByCategory[category]) {
                    photosByCategory[category] = [];
                }
                photosByCategory[category].push(photo);
            });

            // Display each category section
            Object.keys(photosByCategory).sort().forEach((category) => {
                const categorySection = this.createCategorySection(category, photosByCategory[category]);
                galleryList.appendChild(categorySection);
            });
            
            console.log('[Gallery] Successfully displayed', this.photos.length, 'photos in', Object.keys(photosByCategory).length, 'categories');
        } else {
            console.log('[Gallery] galleryList element not found (not on admin page)');
        }
    }

    createGalleryItem(photo, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => this.openLightbox(index);
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        const img = document.createElement('img');
        const imgSrc = photo.imagePath || photo.image;
        img.dataset.src = imgSrc;
        img.alt = photo.title;
        img.loading = 'lazy';
        img.style.backgroundColor = '#f3f4f6';

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

        // Modern lazy loading with IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImg = entry.target.querySelector('img');
                    if (lazyImg && lazyImg.dataset.src) {
                        lazyImg.src = lazyImg.dataset.src;
                        lazyImg.removeAttribute('data-src');
                    }
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '50px' });

        observer.observe(item);

        return item;
    }

    createCategorySection(category, photos) {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 2rem;';

        // Category header with delete all
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border-radius: 8px; cursor: pointer;';
        
        const headerLeft = document.createElement('div');
        headerLeft.style.cssText = 'display: flex; align-items: center; gap: 0.75rem;';
        
        const categoryIcon = document.createElement('i');
        categoryIcon.className = 'fas fa-chevron-down';
        categoryIcon.style.cssText = 'color: white; font-size: 0.9rem; transition: transform 0.3s ease;';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.style.cssText = 'color: white; margin: 0; font-size: 1.05rem; font-weight: 600;';
        categoryTitle.textContent = `${category} (${photos.length})`;
        
        headerLeft.appendChild(categoryIcon);
        headerLeft.appendChild(categoryTitle);
        
        const deleteAllBtn = document.createElement('button');
        deleteAllBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete All';
        deleteAllBtn.style.cssText = 'background: rgba(220, 38, 38, 0.9); color: white; border: none; padding: 0.4rem 0.85rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem; transition: all 0.3s ease;';
        deleteAllBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteCategory(category, photos);
        };
        deleteAllBtn.onmouseover = () => {
            deleteAllBtn.style.background = 'rgba(220, 38, 38, 1)';
            deleteAllBtn.style.transform = 'scale(1.05)';
        };
        deleteAllBtn.onmouseout = () => {
            deleteAllBtn.style.background = 'rgba(220, 38, 38, 0.9)';
            deleteAllBtn.style.transform = 'scale(1)';
        };
        
        header.appendChild(headerLeft);
        header.appendChild(deleteAllBtn);
        
        // Photos container (collapsible)
        const photosContainer = document.createElement('div');
        photosContainer.style.cssText = 'display: block;';
        
        photos.forEach((photo) => {
            const card = this.createAdminPhotoCard(photo);
            photosContainer.appendChild(card);
        });
        
        // Toggle collapse
        header.onclick = () => {
            if (photosContainer.style.display === 'none') {
                photosContainer.style.display = 'block';
                categoryIcon.style.transform = 'rotate(0deg)';
            } else {
                photosContainer.style.display = 'none';
                categoryIcon.style.transform = 'rotate(-90deg)';
            }
        };
        
        section.appendChild(header);
        section.appendChild(photosContainer);
        
        return section;
    }

    createAdminPhotoCard(photo) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: white; 
            border-radius: 12px; 
            margin-bottom: 1rem; 
            overflow: hidden; 
            box-shadow: 0 2px 12px rgba(26, 54, 93, 0.08); 
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 1rem;
            gap: 1rem;
        `;

        // Thumbnail image - larger for easy identification
        const imgSrc = photo.imagePath || photo.image;
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = photo.title;
        img.style.cssText = `
            width: 200px; 
            height: 150px; 
            object-fit: cover; 
            display: block;
            background-color: #f3f4f6;
            border-radius: 8px;
            flex-shrink: 0;
        `;

        // Content section
        const cardContent = document.createElement('div');
        cardContent.style.cssText = 'flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0; gap: 0.25rem;';

        const title = document.createElement('h3');
        title.style.cssText = 'color: #000000; font-size: 1rem; margin: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        title.textContent = photo.title;
        title.title = photo.title;

        const date = document.createElement('p');
        date.style.cssText = 'color: #6b7280; font-size: 0.85rem; margin: 0;';
        date.innerHTML = `<i class="fas fa-calendar"></i> ${new Date(photo.date).toLocaleDateString()}`;

        cardContent.appendChild(title);
        cardContent.appendChild(date);

        // Three-dot kebab menu
        const menuContainer = document.createElement('div');
        menuContainer.style.cssText = 'position: relative; flex-shrink: 0;';

        const menuButton = document.createElement('button');
        menuButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
        menuButton.style.cssText = `
            background: #f3f4f6;
            color: #6b7280;
            border: none;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        `;
        menuButton.onmouseover = () => {
            menuButton.style.background = '#e5e7eb';
            menuButton.style.color = '#374151';
        };
        menuButton.onmouseout = () => {
            menuButton.style.background = '#f3f4f6';
            menuButton.style.color = '#6b7280';
        };

        // Dropdown menu
        const dropdown = document.createElement('div');
        dropdown.style.cssText = `
            position: absolute;
            right: 0;
            top: 100%;
            margin-top: 0.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid #e5e7eb;
            min-width: 140px;
            display: none;
            z-index: 1000;
            overflow: hidden;
        `;

        // Edit option
        const editOption = document.createElement('div');
        editOption.innerHTML = '<i class="fas fa-edit"></i> Edit Title';
        editOption.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            font-size: 0.9rem;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: background 0.2s ease;
        `;
        editOption.onmouseover = () => editOption.style.background = '#f3f4f6';
        editOption.onmouseout = () => editOption.style.background = 'white';
        editOption.onclick = () => {
            dropdown.style.display = 'none';
            this.editPhoto(photo);
        };

        // Delete option
        const deleteOption = document.createElement('div');
        deleteOption.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
        deleteOption.style.cssText = `
            padding: 0.75rem 1rem;
            cursor: pointer;
            font-size: 0.9rem;
            color: #dc2626;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-top: 1px solid #f3f4f6;
            transition: background 0.2s ease;
        `;
        deleteOption.onmouseover = () => deleteOption.style.background = '#fee2e2';
        deleteOption.onmouseout = () => deleteOption.style.background = 'white';
        deleteOption.onclick = () => {
            dropdown.style.display = 'none';
            this.deletePhoto(photo.id);
        };

        dropdown.appendChild(editOption);
        dropdown.appendChild(deleteOption);

        // Toggle menu
        menuButton.onclick = (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        };

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        menuContainer.appendChild(menuButton);
        menuContainer.appendChild(dropdown);

        card.appendChild(img);
        card.appendChild(cardContent);
        card.appendChild(menuContainer);

        return card;
    }

    editPhoto(photo) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to edit photos', 'error');
            return;
        }

        const newTitle = prompt('Edit photo title:', photo.title);
        if (newTitle && newTitle.trim() !== '' && newTitle !== photo.title) {
            this.updatePhotoTitle(photo.id, newTitle.trim());
        }
    }

    async updatePhotoTitle(id, newTitle) {
        try {
            const response = await fetch(`/api/gallery/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, title: newTitle })
            });

            if (response.ok) {
                await this.loadPhotos();
                this.displayPhotos();
                this.showMessage('Photo title updated successfully!', 'success');
            } else {
                this.showMessage('Failed to update photo title', 'error');
            }
        } catch (error) {
            console.error('Error updating photo:', error);
            this.showMessage('Error updating photo title', 'error');
        }
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

    async deleteCategory(category, photos) {
        if (!this.isAuthenticated()) {
            this.showMessage('Please log in to delete photos', 'error');
            return;
        }

        const count = photos.length;
        if (confirm(`Are you sure you want to delete all ${count} photo(s) in "${category}"? This action cannot be undone.`)) {
            let successCount = 0;
            for (const photo of photos) {
                const success = await this.deletePhotoFromServer(photo.id);
                if (success) successCount++;
            }
            
            await this.loadPhotos();
            this.displayPhotos();
            
            if (successCount === count) {
                this.showMessage(`Successfully deleted all ${count} photo(s) from "${category}"!`, 'success');
            } else {
                this.showMessage(`Deleted ${successCount} of ${count} photo(s) from "${category}"`, 'error');
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
            // Use imagePath if available, fallback to image for backwards compatibility
            lightboxImage.src = photo.imagePath || photo.image;
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
            // Use imagePath if available, fallback to image for backwards compatibility
            lightboxImage.src = photo.imagePath || photo.image;
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
            padding: 1.25rem 2rem;
            border-radius: 8px;
            color: white;
            z-index: 10001;
            font-weight: 600;
            font-size: 1.1rem;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease-out;
            border: 3px solid ${type === 'success' ? '#059669' : '#dc2626'};
        `;

        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
        icon.style.cssText = 'margin-right: 0.5rem; font-size: 1.2rem;';

        const messageText = document.createTextNode(message);

        messageDiv.appendChild(icon);
        messageDiv.appendChild(messageText);

        document.body.appendChild(messageDiv);

        // Log to console for debugging
        console.log(`[Gallery ${type.toUpperCase()}]:`, message);

        // Show for 6 seconds (increased from 4)
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => messageDiv.remove(), 300);
        }, 6000);
    }
}

// Initialize gallery manager
const galleryManager = new GalleryManager();
