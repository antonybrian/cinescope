class FavoritesManager {
    constructor() {
        this.favorites = new Set();
        this.loadFavorites();
    }

    loadFavorites() {
        if (!window.authManager?.isAuthenticated()) {
            this.favorites.clear();
            return;
        }

        const userId = window.authManager.getCurrentUser()?.id;
        const savedFavorites = localStorage.getItem(`favorites_${userId}`);
        
        if (savedFavorites) {
            try {
                const favoritesArray = JSON.parse(savedFavorites);
                this.favorites = new Set(favoritesArray);
            } catch (error) {
                console.error('Error loading favorites:', error);
                this.favorites = new Set();
            }
        }
    }

    saveFavorites() {
        if (!window.authManager?.isAuthenticated()) {
            return;
        }

        const userId = window.authManager.getCurrentUser()?.id;
        const favoritesArray = Array.from(this.favorites);
        localStorage.setItem(`favorites_${userId}`, JSON.stringify(favoritesArray));
    }

    addFavorite(movieId) {
        if (!window.authManager?.isAuthenticated()) {
            window.authManager?.showNotification('Please sign in to add favorites', 'info');
            return false;
        }

        this.favorites.add(movieId);
        this.saveFavorites();
        this.updateFavoriteButton(movieId, true);
        window.authManager?.showNotification('Added to favorites!', 'success');
        return true;
    }

    removeFavorite(movieId) {
        this.favorites.delete(movieId);
        this.saveFavorites();
        this.updateFavoriteButton(movieId, false);
        window.authManager?.showNotification('Removed from favorites', 'info');
    }

    toggleFavorite(movieId) {
        if (this.isFavorite(movieId)) {
            this.removeFavorite(movieId);
        } else {
            this.addFavorite(movieId);
        }
    }

    isFavorite(movieId) {
        return this.favorites.has(movieId);
    }

    getFavorites() {
        return Array.from(this.favorites);
    }

    updateFavoriteButton(movieId, isFavorited) {
        const favoriteBtn = document.querySelector(`[data-movie-id="${movieId}"] .favorite-btn`);
        if (favoriteBtn) {
            favoriteBtn.classList.toggle('favorited', isFavorited);
            favoriteBtn.innerHTML = isFavorited ? this.getFilledHeartSVG() : this.getOutlineHeartSVG();
        }
    }

    setupFavoriteButton(movieCard, movieId) {
        const favoriteBtn = movieCard.querySelector('.favorite-btn');
        if (favoriteBtn) {
            const isFavorited = this.isFavorite(movieId);
            favoriteBtn.classList.toggle('favorited', isFavorited);
            favoriteBtn.innerHTML = isFavorited ? this.getFilledHeartSVG() : this.getOutlineHeartSVG();
            
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(movieId);
            });
        }
    }

    async getFavoriteMovies() {
        if (!window.authManager?.isAuthenticated()) {
            return [];
        }

        const favoriteIds = this.getFavorites();
        if (favoriteIds.length === 0) {
            return [];
        }

        try {
            // Fetch details for each favorite movie
            const favoriteMovies = await Promise.all(
                favoriteIds.map(async (id) => {
                    try {
                        return await window.movieAPI.getMovieDetails(id);
                    } catch (error) {
                        console.error(`Error fetching movie ${id}:`, error);
                        return null;
                    }
                })
            );

            // Filter out any failed requests and return valid movies
            return favoriteMovies.filter(movie => movie !== null);
        } catch (error) {
            console.error('Error fetching favorite movies:', error);
            return [];
        }
    }

    clearFavorites() {
        this.favorites.clear();
        const userId = window.authManager?.getCurrentUser()?.id;
        if (userId) {
            localStorage.removeItem(`favorites_${userId}`);
        }
    }

    getOutlineHeartSVG() {
        return `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
        `;
    }

    getFilledHeartSVG() {
        return `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"></path>
            </svg>
        `;
    }
}

// Create global favorites manager instance
window.favoritesManager = new FavoritesManager();