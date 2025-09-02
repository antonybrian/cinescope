class CineScopeApp {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startApp();
            });
        } else {
            this.startApp();
        }
    }

    startApp() {
        console.log('🎬 CineScope App Started');
        
        // Initialize all managers
        this.initializeGlobalErrorHandler();
        this.initializePerformanceOptimizations();
        this.setupAnalytics();
        
        // Setup intersection observer for infinite scroll
        this.setupInfiniteScroll();
        
        // Initialize keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup service worker for caching (if supported)
        this.setupServiceWorker();

        console.log('✅ CineScope App initialized successfully');
    }

    initializeGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });
    }

    handleGlobalError(error) {
        // In a real app, you would send this to an error reporting service
        console.error('Application error:', error);
        
        // Show user-friendly error message
        if (window.authManager) {
            window.authManager.showNotification(
                'Something went wrong. Please refresh the page if the problem persists.',
                'error'
            );
        }
    }

    initializePerformanceOptimizations() {
        // Implement image lazy loading fallback for older browsers
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading is supported
            console.log('✅ Native lazy loading supported');
        } else {
            // Implement intersection observer for lazy loading
            this.setupLazyLoading();
        }

        // Preload critical resources
        this.preloadCriticalResources();
    }

    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        // Observe all images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    preloadCriticalResources() {
        // Preload important images
        const preloadImages = [
            'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=500&h=750&fit=crop'
        ];

        preloadImages.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    setupInfiniteScroll() {
        // Create intersection observer for infinite scroll
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        sentinel.style.cssText = 'height: 1px; margin-top: 100px;';

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && window.uiManager && !window.uiManager.isLoading && window.uiManager.hasMorePages) {
                    window.uiManager.loadMoreMovies();
                }
            });
        }, {
            rootMargin: '100px'
        });

        // Add sentinel to load more container
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.appendChild(sentinel);
            observer.observe(sentinel);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Search shortcut (Ctrl/Cmd + K)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }
            
            // Quick category switching
            if (e.altKey) {
                const categoryKeys = {
                    '1': 'trending',
                    '2': 'popular',
                    '3': 'top_rated',
                    '4': 'upcoming',
                    '5': 'favorites'
                };
                
                const category = categoryKeys[e.key];
                if (category && window.uiManager) {
                    e.preventDefault();
                    window.uiManager.switchCategory(category);
                }
            }
        });
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration);
            } catch (error) {
                console.log('❌ Service Worker registration failed:', error);
            }
        }
    }

    setupAnalytics() {
        // Track user interactions (in a real app, you'd send these to an analytics service)
        this.trackEvents();
    }

    trackEvents() {
        // Track movie card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.movie-card')) {
                const movieCard = e.target.closest('.movie-card');
                const movieId = movieCard.dataset.movieId;
                console.log('📊 Movie viewed:', movieId);
            }
            
            // Track search usage
            if (e.target.matches('#searchBtn') || (e.target.matches('#searchInput') && e.key === 'Enter')) {
                const query = document.getElementById('searchInput').value;
                if (query.trim()) {
                    console.log('📊 Search performed:', query);
                }
            }
            
            // Track category changes
            if (e.target.matches('.filter-btn')) {
                const category = e.target.dataset.category;
                console.log('📊 Category changed:', category);
            }
        });
    }

    // Method to handle app updates
    checkForUpdates() {
        // In a real app, you would check for updates and notify users
        console.log('🔄 Checking for updates...');
    }

    // Get app statistics
    getStats() {
        return {
            cacheSize: window.movieAPI?.cache.size || 0,
            favoritesCount: window.favoritesManager?.getFavorites().length || 0,
            isAuthenticated: window.authManager?.isAuthenticated() || false,
            currentCategory: window.uiManager?.currentCategory || 'trending',
            currentPage: window.uiManager?.currentPage || 1
        };
    }
}

// Initialize the app
window.cineScopeApp = new CineScopeApp();

// Add some useful global utilities for debugging
window.addEventListener('load', () => {
    console.log('🎬 CineScope Debug Tools Available:');
    console.log('- window.cineScopeApp.getStats() - Get app statistics');
    console.log('- window.movieAPI - Direct access to movie API');
    console.log('- window.authManager - Authentication manager');
    console.log('- window.favoritesManager - Favorites manager');
    console.log('- window.uiManager - UI manager');
});

// Performance monitoring
window.addEventListener('load', () => {
    setTimeout(() => {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('🚀 App Performance:', {
                loadTime: `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
                domContentLoaded: `${(perfData.domContentLoadedEventEnd - perfData.fetchStart).toFixed(2)}ms`,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime.toFixed(2) + 'ms'
            });
        }
    }, 0);
});