
class MovieAPI {


    async loadApiKey() {
        if (this.apiKey) return this.apiKey; // already loaded

        try {
            const res = await fetch("https://poolfx.co.ke/moviekey.php?token=Token@@123");
            if (!res.ok) throw new Error(`Failed to load API key: ${res.status}`);
            const data = await res.json();
            this.apiKey = data.apiKey || null;
            return this.apiKey;
        } catch (err) {
            console.error("❌ Failed to load API key", err);
            return null;
        }
    }
    constructor() {
        this.baseURL = 'https://api.themoviedb.org/3';
        this.apiKey = null; // will be fetched
        this.imageBaseURL = 'https://image.tmdb.org/t/p';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000;

        // fetch API key once at startup
        this.loadApiKey();
    }




    // Helper method to build URLs
    buildURL(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.set('api_key', this.apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            }
        });
        
        return url.toString();
    }

    // Get image URL with different sizes
    getImageURL(path, size = 'w500') {
        if (!path) return 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=500&h=750&fit=crop';
        return `${this.imageBaseURL}/${size}${path}`;
    }

    // Cache management
    getCacheKey(url) {
        return url;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheExpiry;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    // Generic fetch method with caching
    async fetchData(endpoint, params = {}) {
        const url = this.buildURL(endpoint, params);
        const cacheKey = this.getCacheKey(url);
        
        // Check cache first
        const cached = this.getCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to fetch data. Please check your internet connection.');
        }
    }

    // Get trending movies
    async getTrendingMovies(page = 1) {
        return this.fetchData('/trending/movie/week', { page });
    }

    // Get popular movies
    async getPopularMovies(page = 1) {
        return this.fetchData('/movie/popular', { page });
    }

    // Get top rated movies
    async getTopRatedMovies(page = 1) {
        return this.fetchData('/movie/top_rated', { page });
    }

    // Get upcoming movies
    async getUpcomingMovies(page = 1) {
        return this.fetchData('/movie/upcoming', { page });
    }

    // Search movies
    async searchMovies(query, page = 1) {
        if (!query.trim()) {
            return { results: [], total_pages: 0, page: 1 };
        }
        return this.fetchData('/search/movie', { query: query.trim(), page });
    }

    // Get movie details
    async getMovieDetails(movieId) {
        return this.fetchData(`/movie/${movieId}`, { 
            append_to_response: 'credits,videos,similar' 
        });
    }

    // Get movie credits
    async getMovieCredits(movieId) {
        return this.fetchData(`/movie/${movieId}/credits`);
    }

    // Get movie videos (trailers, etc.)
    async getMovieVideos(movieId) {
        return this.fetchData(`/movie/${movieId}/videos`);
    }

    // Format runtime to hours and minutes
    formatRuntime(minutes) {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Format date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Get year from date
    getYear(dateString) {
        if (!dateString) return '';
        return new Date(dateString).getFullYear();
    }

    // Format vote average
    formatRating(voteAverage) {
        return voteAverage ? voteAverage.toFixed(1) : 'N/A';
    }
}

// Create global API instance
window.movieAPI = new MovieAPI();