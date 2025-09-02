class UIManager {
    constructor() {
        this.currentPage = 1;
        this.currentCategory = 'trending';
        this.currentSearchQuery = '';
        this.isLoading = false;
        this.hasMorePages = true;
        this.searchTimeout = null;
        
        this.initializeUI();
    }

    initializeUI() {
        this.setupEventListeners();
        this.loadMovies();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                this.switchCategory(category);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Load more button
        document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
            this.loadMoreMovies();
        });

        // Retry button
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            this.loadMovies();
        });

        // Modal management
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.hideMovieModal();
        });

        document.getElementById('movieModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideMovieModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideMovieModal();
            }
        });
    }

    switchCategory(category) {
        if (category === this.currentCategory && !this.currentSearchQuery) return;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`)?.classList.add('active');

        // Reset state
        this.currentCategory = category;
        this.currentPage = 1;
        this.currentSearchQuery = '';
        this.hasMorePages = true;
        
        // Clear search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';

        // Update section title
        this.updateSectionTitle(category);
        
        // Clear grid and load new content
        this.clearMoviesGrid();
        this.loadMovies();
    }

    updateSectionTitle(category) {
        const titles = {
            trending: 'Trending Movies',
            popular: 'Popular Movies',
            top_rated: 'Top Rated Movies',
            upcoming: 'Upcoming Movies',
            favorites: 'My Favorites'
        };
        
        document.getElementById('sectionTitle').textContent = titles[category] || 'Movies';
    }

    handleSearch(query) {
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    performSearch(query) {
        this.currentSearchQuery = query.trim();
        this.currentPage = 1;
        this.hasMorePages = true;

        // Update UI state
        if (this.currentSearchQuery) {
            document.getElementById('sectionTitle').textContent = `Search Results for "${this.currentSearchQuery}"`;
            // Remove active state from filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        } else {
            // Return to current category
            this.updateSectionTitle(this.currentCategory);
            document.querySelector(`[data-category="${this.currentCategory}"]`)?.classList.add('active');
        }

        this.clearMoviesGrid();
        this.loadMovies();
    }

    async loadMovies() {
        if (this.isLoading) return;

        try {
            this.setLoadingState(true);
            this.hideError();

            let response;

            if (this.currentSearchQuery) {
                response = await window.movieAPI.searchMovies(this.currentSearchQuery, this.currentPage);
            } else if (this.currentCategory === 'favorites') {
                const favoriteMovies = await window.favoritesManager.getFavoriteMovies();
                response = {
                    results: favoriteMovies,
                    total_pages: 1,
                    page: 1
                };
            } else {
                // Map category to API method
                const apiMethods = {
                    trending: 'getTrendingMovies',
                    popular: 'getPopularMovies',
                    top_rated: 'getTopRatedMovies',
                    upcoming: 'getUpcomingMovies'
                };
                
                const method = apiMethods[this.currentCategory];
                if (method) {
                    response = await window.movieAPI[method](this.currentPage);
                }
            }

            if (response && response.results) {
                this.renderMovies(response.results, this.currentPage === 1);
                this.hasMorePages = this.currentPage < response.total_pages;
                this.updateLoadMoreButton();
            } else {
                throw new Error('No results found');
            }

        } catch (error) {
            console.error('Error loading movies:', error);
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    async loadMoreMovies() {
        if (this.isLoading || !this.hasMorePages) return;
        
        this.currentPage++;
        await this.loadMovies();
    }

    renderMovies(movies, clearGrid = false) {
        const moviesGrid = document.getElementById('moviesGrid');
        
        if (clearGrid) {
            moviesGrid.innerHTML = '';
        }

        if (movies.length === 0 && clearGrid) {
            this.showEmptyState();
            return;
        }

        movies.forEach((movie, index) => {
            const movieCard = this.createMovieCard(movie);
            movieCard.style.animationDelay = `${index * 0.1}s`;
            moviesGrid.appendChild(movieCard);
            
            // Setup favorite button
            window.favoritesManager.setupFavoriteButton(movieCard, movie.id);
        });

        // Hide hero section if we have movies
        if (movies.length > 0) {
            document.getElementById('heroSection')?.classList.add('hidden');
        }
    }

    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.movieId = movie.id;
        
        const posterURL = window.movieAPI.getImageURL(movie.poster_path, 'w500');
        const year = window.movieAPI.getYear(movie.release_date);
        const rating = window.movieAPI.formatRating(movie.vote_average);

        card.innerHTML = `
            <div class="movie-poster">
                <img src="${posterURL}" alt="${movie.title}" loading="lazy">
                <div class="movie-rating">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    ${rating}
                </div>
                <button class="favorite-btn" data-movie-id="${movie.id}">
                    ${window.favoritesManager.getOutlineHeartSVG()}
                </button>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-year">${year}</div>
                <p class="movie-overview">${movie.overview || 'No overview available.'}</p>
            </div>
        `;

        // Add click listener for movie details
        card.addEventListener('click', () => {
            this.showMovieDetails(movie.id);
        });

        return card;
    }

    createSkeletonCards(count = 20) {
        const moviesGrid = document.getElementById('moviesGrid');
        moviesGrid.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-poster skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title skeleton"></div>
                    <div class="skeleton-year skeleton"></div>
                    <div class="skeleton-overview skeleton"></div>
                    <div class="skeleton-overview skeleton"></div>
                </div>
            `;
            moviesGrid.appendChild(skeletonCard);
        }
    }

    async showMovieDetails(movieId) {
        try {
            this.showMovieModal();
            this.setModalLoading(true);

            const movieDetails = await window.movieAPI.getMovieDetails(movieId);
            this.renderMovieDetails(movieDetails);

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.setModalError('Failed to load movie details');
        }
    }

    renderMovieDetails(movie) {
        const modalBody = document.getElementById('modalBody');
        const backdropURL = window.movieAPI.getImageURL(movie.backdrop_path, 'w1280');
        const posterURL = window.movieAPI.getImageURL(movie.poster_path, 'w500');
        const year = window.movieAPI.getYear(movie.release_date);
        const runtime = window.movieAPI.formatRuntime(movie.runtime);
        const rating = window.movieAPI.formatRating(movie.vote_average);

        modalBody.innerHTML = `
            <div class="movie-detail">
                ${movie.backdrop_path ? `<div class="movie-backdrop" style="background-image: url('${backdropURL}')"></div>` : ''}
                <div class="movie-detail-content">
                    <div class="movie-header">
                        <div class="movie-poster-large">
                            <img src="${posterURL}" alt="${movie.title}" loading="lazy">
                        </div>
                        <div class="movie-meta">
                            <h2 class="movie-title-large">${movie.title}</h2>
                            <div class="movie-details">
                                <div class="detail-item">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                                    </svg>
                                    ${rating}
                                </div>
                                <div class="detail-item">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    ${runtime}
                                </div>
                                <div class="detail-item">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    ${year}
                                </div>
                            </div>
                            <p class="movie-overview-large">${movie.overview || 'No overview available.'}</p>
                            ${movie.genres && movie.genres.length > 0 ? `
                                <div class="movie-genres">
                                    ${movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="movie-sections">
                        ${this.renderCastSection(movie.credits)}
                        ${this.renderCrewSection(movie.credits)}
                    </div>
                </div>
            </div>
        `;

        this.setModalLoading(false);
    }

    renderCastSection(credits) {
        if (!credits || !credits.cast || credits.cast.length === 0) {
            return '';
        }

        const topCast = credits.cast.slice(0, 12);
        
        return `
            <div class="cast-section">
                <h3 class="section-title-small">Cast</h3>
                <div class="cast-grid">
                    ${topCast.map(actor => `
                        <div class="cast-member">
                            <div class="cast-avatar">
                                <img src="${window.movieAPI.getImageURL(actor.profile_path, 'w185')}" 
                                     alt="${actor.name}" loading="lazy">
                            </div>
                            <div class="cast-name">${actor.name}</div>
                            <div class="cast-character">${actor.character}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderCrewSection(credits) {
        if (!credits || !credits.crew || credits.crew.length === 0) {
            return '';
        }

        // Get key crew members
        const keyRoles = ['Director', 'Producer', 'Screenplay', 'Director of Photography'];
        const keyCrew = credits.crew.filter(member => 
            keyRoles.includes(member.job)
        ).slice(0, 8);

        if (keyCrew.length === 0) return '';

        return `
            <div class="crew-section">
                <h3 class="section-title-small">Key Crew</h3>
                <div class="cast-grid">
                    ${keyCrew.map(member => `
                        <div class="cast-member">
                            <div class="cast-avatar">
                                <img src="${window.movieAPI.getImageURL(member.profile_path, 'w185')}" 
                                     alt="${member.name}" loading="lazy">
                            </div>
                            <div class="cast-name">${member.name}</div>
                            <div class="cast-character">${member.job}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showEmptyState() {
        const moviesGrid = document.getElementById('moviesGrid');
        moviesGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m4 0H4a1 1 0 000 2v12a2 2 0 002 2h12a2 2 0 002-2V6a1 1 0 100-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4"></path>
                </svg>
                <h3>No movies found</h3>
                <p>${this.currentSearchQuery ? 'Try adjusting your search terms' : 'No movies in this category'}</p>
            </div>
        `;
        
        // Add styles for empty state
        if (!document.querySelector('.empty-state-styles')) {
            const style = document.createElement('style');
            style.className = 'empty-state-styles';
            style.textContent = `
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    color: var(--text-secondary);
                    padding: var(--space-16) var(--space-4);
                }
                
                .empty-state svg {
                    margin-bottom: var(--space-4);
                }
                
                .empty-state h3 {
                    color: var(--text-primary);
                    margin-bottom: var(--space-2);
                }
            `;
            document.head.appendChild(style);
        }
    }

    showMovieModal() {
        const modal = document.getElementById('movieModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    hideMovieModal() {
        const modal = document.getElementById('movieModal');
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 250);
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    setModalLoading(isLoading) {
        const modalBody = document.getElementById('modalBody');
        if (isLoading) {
            modalBody.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading movie details...</p>
                </div>
            `;
        }
    }

    setModalError(message) {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="error-container">
                <div class="error-content">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        const loadingContainer = document.getElementById('loadingSpinner');
        
        if (isLoading && this.currentPage === 1) {
            loadingContainer.classList.remove('hidden');
            this.createSkeletonCards();
        } else {
            loadingContainer.classList.add('hidden');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorContainer')?.classList.add('hidden');
    }

    clearMoviesGrid() {
        document.getElementById('moviesGrid').innerHTML = '';
        this.updateLoadMoreButton(false);
    }

    updateLoadMoreButton(show = null) {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const shouldShow = show !== null ? show : (this.hasMorePages && !this.isLoading);
        
        if (shouldShow) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
        
        // Update button text based on loading state
        if (this.isLoading && this.currentPage > 1) {
            loadMoreBtn.textContent = 'Loading...';
            loadMoreBtn.disabled = true;
        } else {
            loadMoreBtn.textContent = 'Load More Movies';
            loadMoreBtn.disabled = false;
        }
    }
}

// Add additional styles for genre tags and improved modal
const additionalStyles = `
    .movie-genres {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-top: var(--space-4);
    }

    .genre-tag {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        padding: var(--space-1) var(--space-3);
        border-radius: 20px;
        font-size: var(--font-size-xs);
        border: 1px solid var(--gray-700);
    }

    .movie-detail-content {
        min-height: 500px;
    }

    @media (max-width: 768px) {
        .movie-detail-content {
            min-height: auto;
        }
    }
`;

const style = document.createElement('style');
style.textContent = additionalStyles;
document.head.appendChild(style);

// Create global UI manager instance
window.uiManager = new UIManager();