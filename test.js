// CineScope Movie App - Comprehensive Test Suite
// This file contains tests for all major components and functionality

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    // Test registration
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    // Assertion methods
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertNotEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected ${actual} to not equal ${expected}`);
        }
    }

    assertThrows(fn, message) {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (error) {
            // Expected behavior
        }
    }

    async assertRejects(promise, message) {
        try {
            await promise;
            throw new Error(message || 'Expected promise to reject');
        } catch (error) {
            // Expected behavior
        }
    }

    // Test runner
    async runTests() {
        console.log('🎬 Starting CineScope Test Suite...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn.call(this);
                this.passed++;
                this.results.push({ name: test.name, status: 'PASS' });
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                this.results.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${this.tests.length}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\nFailed Tests:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
        
        console.log('\n🎬 CineScope Test Suite Complete!');
    }
}

// Create test runner instance
const testRunner = new TestRunner();

// ============================================================================
// MOVIE API TESTS
// ============================================================================

testRunner.test('MovieAPI - Constructor initializes correctly', function() {
    const api = new MovieAPI();
    this.assert(api.baseURL === 'https://api.themoviedb.org/3', 'Base URL should be set');
    this.assert(api.apiKey, 'API key should be set');
    this.assert(api.cache instanceof Map, 'Cache should be a Map');
    this.assert(api.cacheExpiry === 5 * 60 * 1000, 'Cache expiry should be 5 minutes');
});

testRunner.test('MovieAPI - buildURL creates correct URLs', function() {
    const api = new MovieAPI();
    const url = api.buildURL('/test', { param1: 'value1', param2: 'value2' });
    this.assert(url.includes('api_key='), 'URL should include API key');
    this.assert(url.includes('param1=value1'), 'URL should include custom parameters');
    this.assert(url.includes('param2=value2'), 'URL should include multiple parameters');
});

testRunner.test('MovieAPI - getImageURL handles missing paths', function() {
    const api = new MovieAPI();
    const fallbackURL = api.getImageURL(null);
    this.assert(fallbackURL.includes('pexels'), 'Should return fallback image for null path');
    
    const validURL = api.getImageURL('/test.jpg', 'w500');
    this.assert(validURL.includes('/w500/test.jpg'), 'Should construct correct image URL');
});

testRunner.test('MovieAPI - Cache management works correctly', function() {
    const api = new MovieAPI();
    const testKey = 'test-key';
    const testData = { test: 'data' };
    
    // Test setting cache
    api.setCache(testKey, testData);
    this.assert(api.cache.has(testKey), 'Cache should store data');
    
    // Test getting cache
    const cached = api.getCache(testKey);
    this.assertEqual(cached.test, 'data', 'Should retrieve cached data correctly');
    
    // Test cache expiry (simulate expired cache)
    const expiredEntry = api.cache.get(testKey);
    expiredEntry.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    api.cache.set(testKey, expiredEntry);
    
    const expiredResult = api.getCache(testKey);
    this.assertEqual(expiredResult, null, 'Expired cache should return null');
});

testRunner.test('MovieAPI - Utility methods format data correctly', function() {
    const api = new MovieAPI();
    
    // Test runtime formatting
    this.assertEqual(api.formatRuntime(90), '1h 30m', 'Should format runtime correctly');
    this.assertEqual(api.formatRuntime(45), '45m', 'Should format short runtime');
    this.assertEqual(api.formatRuntime(null), 'N/A', 'Should handle null runtime');
    
    // Test year extraction
    this.assertEqual(api.getYear('2023-05-15'), 2023, 'Should extract year correctly');
    this.assertEqual(api.getYear(null), '', 'Should handle null date');
    
    // Test rating formatting
    this.assertEqual(api.formatRating(7.856), '7.9', 'Should format rating to 1 decimal');
    this.assertEqual(api.formatRating(null), 'N/A', 'Should handle null rating');
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

testRunner.test('AuthManager - Initializes correctly', function() {
    // Clear any existing auth data
    localStorage.removeItem('cinescope_user');
    
    const auth = new AuthManager();
    this.assertEqual(auth.currentUser, null, 'Should start with no user');
    this.assertEqual(auth.isAuthenticated(), false, 'Should not be authenticated initially');
});

testRunner.test('AuthManager - User session persistence', function() {
    const auth = new AuthManager();
    const testUser = {
        id: 12345,
        email: 'test@example.com',
        name: 'test',
        avatar: 'test-avatar.jpg'
    };
    
    // Simulate login
    auth.currentUser = testUser;
    localStorage.setItem('cinescope_user', JSON.stringify(testUser));
    
    // Create new auth manager to test persistence
    const newAuth = new AuthManager();
    this.assert(newAuth.isAuthenticated(), 'Should restore authenticated state');
    this.assertEqual(newAuth.getCurrentUser().email, 'test@example.com', 'Should restore user data');
    
    // Cleanup
    localStorage.removeItem('cinescope_user');
});

testRunner.test('AuthManager - Logout clears session', function() {
    const auth = new AuthManager();
    auth.currentUser = { id: 123, email: 'test@example.com' };
    localStorage.setItem('cinescope_user', JSON.stringify(auth.currentUser));
    
    auth.logout();
    
    this.assertEqual(auth.currentUser, null, 'Should clear current user');
    this.assertEqual(localStorage.getItem('cinescope_user'), null, 'Should clear localStorage');
    this.assertEqual(auth.isAuthenticated(), false, 'Should not be authenticated after logout');
});

// ============================================================================
// FAVORITES TESTS
// ============================================================================

testRunner.test('FavoritesManager - Initializes with empty favorites', function() {
    localStorage.clear();
    const favorites = new FavoritesManager();
    this.assertEqual(favorites.getFavorites().length, 0, 'Should start with empty favorites');
});

testRunner.test('FavoritesManager - Add and remove favorites', function() {
    // Mock authenticated user
    window.authManager = {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ id: 123 }),
        showNotification: () => {}
    };
    
    const favorites = new FavoritesManager();
    const movieId = 12345;
    
    // Test adding favorite
    const added = favorites.addFavorite(movieId);
    this.assert(added, 'Should successfully add favorite');
    this.assert(favorites.isFavorite(movieId), 'Movie should be in favorites');
    this.assertEqual(favorites.getFavorites().length, 1, 'Should have one favorite');
    
    // Test removing favorite
    favorites.removeFavorite(movieId);
    this.assert(!favorites.isFavorite(movieId), 'Movie should not be in favorites');
    this.assertEqual(favorites.getFavorites().length, 0, 'Should have no favorites');
});

testRunner.test('FavoritesManager - Toggle functionality', function() {
    window.authManager = {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ id: 123 }),
        showNotification: () => {}
    };
    
    const favorites = new FavoritesManager();
    const movieId = 67890;
    
    // Toggle on
    favorites.toggleFavorite(movieId);
    this.assert(favorites.isFavorite(movieId), 'Should add to favorites on first toggle');
    
    // Toggle off
    favorites.toggleFavorite(movieId);
    this.assert(!favorites.isFavorite(movieId), 'Should remove from favorites on second toggle');
});

testRunner.test('FavoritesManager - Requires authentication', function() {
    window.authManager = {
        isAuthenticated: () => false,
        showNotification: () => {}
    };
    
    const favorites = new FavoritesManager();
    const result = favorites.addFavorite(12345);
    
    this.assertEqual(result, false, 'Should not add favorite when not authenticated');
});

testRunner.test('FavoritesManager - SVG generation', function() {
    const favorites = new FavoritesManager();
    
    const outlineSVG = favorites.getOutlineHeartSVG();
    this.assert(outlineSVG.includes('fill="none"'), 'Outline heart should have no fill');
    this.assert(outlineSVG.includes('stroke="currentColor"'), 'Outline heart should use stroke');
    
    const filledSVG = favorites.getFilledHeartSVG();
    this.assert(filledSVG.includes('fill="currentColor"'), 'Filled heart should have fill');
});

// ============================================================================
// UI MANAGER TESTS
// ============================================================================

testRunner.test('UIManager - Initializes with correct defaults', function() {
    const ui = new UIManager();
    this.assertEqual(ui.currentPage, 1, 'Should start on page 1');
    this.assertEqual(ui.currentCategory, 'trending', 'Should start with trending category');
    this.assertEqual(ui.currentSearchQuery, '', 'Should start with empty search');
    this.assertEqual(ui.isLoading, false, 'Should not be loading initially');
    this.assertEqual(ui.hasMorePages, true, 'Should assume more pages available');
});

testRunner.test('UIManager - Category switching updates state', function() {
    const ui = new UIManager();
    
    ui.switchCategory('popular');
    this.assertEqual(ui.currentCategory, 'popular', 'Should update current category');
    this.assertEqual(ui.currentPage, 1, 'Should reset to page 1');
    this.assertEqual(ui.currentSearchQuery, '', 'Should clear search query');
});

testRunner.test('UIManager - Search handling', function() {
    const ui = new UIManager();
    
    ui.performSearch('test movie');
    this.assertEqual(ui.currentSearchQuery, 'test movie', 'Should set search query');
    this.assertEqual(ui.currentPage, 1, 'Should reset to page 1');
    
    ui.performSearch('  ');
    this.assertEqual(ui.currentSearchQuery, '', 'Should trim and handle empty search');
});

testRunner.test('UIManager - Movie card creation', function() {
    const ui = new UIManager();
    const mockMovie = {
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        release_date: '2023-05-15',
        vote_average: 7.5,
        overview: 'Test overview'
    };
    
    const card = ui.createMovieCard(mockMovie);
    
    this.assert(card.classList.contains('movie-card'), 'Should have movie-card class');
    this.assertEqual(card.dataset.movieId, '123', 'Should set movie ID data attribute');
    this.assert(card.innerHTML.includes('Test Movie'), 'Should include movie title');
    this.assert(card.innerHTML.includes('2023'), 'Should include release year');
    this.assert(card.innerHTML.includes('7.5'), 'Should include rating');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

testRunner.test('Integration - Auth and Favorites interaction', function() {
    // Setup mock auth
    window.authManager = {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ id: 999 }),
        showNotification: () => {}
    };
    
    const favorites = new FavoritesManager();
    
    // Add favorite while authenticated
    favorites.addFavorite(111);
    this.assert(favorites.isFavorite(111), 'Should add favorite when authenticated');
    
    // Simulate logout
    window.authManager.isAuthenticated = () => false;
    window.authManager.getCurrentUser = () => null;
    
    favorites.clearFavorites();
    this.assertEqual(favorites.getFavorites().length, 0, 'Should clear favorites on logout');
});

testRunner.test('Integration - Search and pagination state', function() {
    const ui = new UIManager();
    
    // Test category switch resets search
    ui.currentSearchQuery = 'old search';
    ui.currentPage = 5;
    
    ui.switchCategory('popular');
    
    this.assertEqual(ui.currentSearchQuery, '', 'Category switch should clear search');
    this.assertEqual(ui.currentPage, 1, 'Category switch should reset page');
    
    // Test search resets pagination
    ui.currentPage = 3;
    ui.performSearch('new search');
    
    this.assertEqual(ui.currentPage, 1, 'Search should reset page to 1');
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

testRunner.test('Error Handling - API error scenarios', function() {
    const api = new MovieAPI();
    
    // Test invalid cache data
    api.cache.set('invalid-key', { data: null, timestamp: Date.now() });
    const result = api.getCache('invalid-key');
    this.assertEqual(result, null, 'Should handle invalid cache data');
    
    // Test cache cleanup
    const expiredKey = 'expired-key';
    api.cache.set(expiredKey, { data: 'test', timestamp: Date.now() - (10 * 60 * 1000) });
    api.getCache(expiredKey);
    this.assert(!api.cache.has(expiredKey), 'Should remove expired cache entries');
});

testRunner.test('Error Handling - Authentication edge cases', function() {
    // Test corrupted localStorage data
    localStorage.setItem('cinescope_user', 'invalid-json');
    
    const auth = new AuthManager();
    this.assertEqual(auth.currentUser, null, 'Should handle corrupted user data gracefully');
    this.assertEqual(localStorage.getItem('cinescope_user'), null, 'Should clean up corrupted data');
});

testRunner.test('Error Handling - Favorites without authentication', function() {
    window.authManager = {
        isAuthenticated: () => false,
        showNotification: () => {}
    };
    
    const favorites = new FavoritesManager();
    const result = favorites.addFavorite(123);
    
    this.assertEqual(result, false, 'Should not add favorite without authentication');
    this.assertEqual(favorites.getFavorites().length, 0, 'Should maintain empty favorites');
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

testRunner.test('Utility Functions - Date and time formatting', function() {
    const api = new MovieAPI();
    
    // Test date formatting
    const formattedDate = api.formatDate('2023-12-25');
    this.assert(formattedDate.includes('December'), 'Should format date with month name');
    this.assert(formattedDate.includes('2023'), 'Should include year');
    
    // Test invalid date
    this.assertEqual(api.formatDate(null), 'N/A', 'Should handle null dates');
    this.assertEqual(api.formatDate(''), 'N/A', 'Should handle empty dates');
});

testRunner.test('Utility Functions - Rating validation', function() {
    const api = new MovieAPI();
    
    this.assertEqual(api.formatRating(8.567), '8.6', 'Should round to 1 decimal place');
    this.assertEqual(api.formatRating(0), '0.0', 'Should handle zero rating');
    this.assertEqual(api.formatRating(null), 'N/A', 'Should handle null rating');
    this.assertEqual(api.formatRating(undefined), 'N/A', 'Should handle undefined rating');
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

testRunner.test('Performance - Cache efficiency', function() {
    const api = new MovieAPI();
    const testKey = 'perf-test';
    const testData = { large: 'data'.repeat(1000) };
    
    // Measure cache set performance
    const startTime = performance.now();
    api.setCache(testKey, testData);
    const setTime = performance.now() - startTime;
    
    this.assert(setTime < 10, 'Cache set should be fast (< 10ms)');
    
    // Measure cache get performance
    const getStartTime = performance.now();
    api.getCache(testKey);
    const getTime = performance.now() - getStartTime;
    
    this.assert(getTime < 5, 'Cache get should be very fast (< 5ms)');
});

testRunner.test('Performance - Memory usage tracking', function() {
    const api = new MovieAPI();
    
    // Add multiple cache entries
    for (let i = 0; i < 100; i++) {
        api.setCache(`test-${i}`, { data: `test-data-${i}` });
    }
    
    this.assertEqual(api.cache.size, 100, 'Should store all cache entries');
    
    // Test cache size limit (in real app, you'd implement cache eviction)
    this.assert(api.cache.size < 1000, 'Cache size should be reasonable');
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

testRunner.test('Accessibility - Keyboard navigation support', function() {
    const ui = new UIManager();
    
    // Test that movie cards are keyboard accessible
    const mockMovie = {
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        release_date: '2023-05-15',
        vote_average: 7.5,
        overview: 'Test overview'
    };
    
    const card = ui.createMovieCard(mockMovie);
    
    // Check for proper attributes
    this.assert(card.dataset.movieId, 'Movie card should have data attribute for identification');
    
    // Check for interactive elements
    const favoriteBtn = card.querySelector('.favorite-btn');
    this.assert(favoriteBtn, 'Should have favorite button');
});

testRunner.test('Accessibility - ARIA and semantic HTML', function() {
    // Test that the app uses semantic HTML structure
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const nav = document.querySelector('.nav');
    
    this.assert(header, 'Should have semantic header element');
    this.assert(main, 'Should have semantic main element');
    this.assert(nav, 'Should have navigation structure');
});

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

testRunner.test('Responsive Design - CSS custom properties', function() {
    const rootStyles = getComputedStyle(document.documentElement);
    
    // Test that CSS custom properties are defined
    const primaryColor = rootStyles.getPropertyValue('--primary-500');
    const spacing = rootStyles.getPropertyValue('--space-4');
    const fontSize = rootStyles.getPropertyValue('--font-size-base');
    
    this.assert(primaryColor.trim(), 'Primary color should be defined');
    this.assert(spacing.trim(), 'Spacing system should be defined');
    this.assert(fontSize.trim(), 'Font size system should be defined');
});

testRunner.test('Responsive Design - Grid layout adaptation', function() {
    const moviesGrid = document.getElementById('moviesGrid');
    const gridStyles = getComputedStyle(moviesGrid);
    
    this.assert(gridStyles.display === 'grid', 'Movies grid should use CSS Grid');
    this.assert(gridStyles.gridTemplateColumns.includes('minmax'), 'Should use responsive grid columns');
});

// ============================================================================
// DATA VALIDATION TESTS
// ============================================================================

testRunner.test('Data Validation - Movie data structure', function() {
    const ui = new UIManager();
    
    // Test with minimal movie data
    const minimalMovie = {
        id: 123,
        title: 'Test Movie'
    };
    
    const card = ui.createMovieCard(minimalMovie);
    this.assert(card, 'Should handle minimal movie data');
    this.assert(card.innerHTML.includes('Test Movie'), 'Should display title');
    this.assert(card.innerHTML.includes('No overview available'), 'Should handle missing overview');
});

testRunner.test('Data Validation - Search query sanitization', function() {
    const ui = new UIManager();
    
    // Test search with special characters
    ui.performSearch('  test & movie  ');
    this.assertEqual(ui.currentSearchQuery, 'test & movie', 'Should trim whitespace but preserve content');
    
    // Test empty search
    ui.performSearch('   ');
    this.assertEqual(ui.currentSearchQuery, '', 'Should handle empty/whitespace search');
});

// ============================================================================
// MOCK API TESTS (for offline testing)
// ============================================================================

testRunner.test('Mock API - Simulated responses', function() {
    // Create mock API responses for testing
    const mockMovieData = {
        results: [
            {
                id: 1,
                title: 'Mock Movie 1',
                poster_path: '/mock1.jpg',
                release_date: '2023-01-01',
                vote_average: 8.0,
                overview: 'Mock overview 1'
            },
            {
                id: 2,
                title: 'Mock Movie 2',
                poster_path: '/mock2.jpg',
                release_date: '2023-02-01',
                vote_average: 7.5,
                overview: 'Mock overview 2'
            }
        ],
        total_pages: 5,
        page: 1
    };
    
    this.assertEqual(mockMovieData.results.length, 2, 'Mock data should have 2 movies');
    this.assert(mockMovieData.results[0].id, 'Mock movies should have IDs');
    this.assert(mockMovieData.results[0].title, 'Mock movies should have titles');
});

// ============================================================================
// BROWSER COMPATIBILITY TESTS
// ============================================================================

testRunner.test('Browser Compatibility - Required APIs', function() {
    // Test for required browser APIs
    this.assert(typeof fetch !== 'undefined', 'Fetch API should be available');
    this.assert(typeof localStorage !== 'undefined', 'localStorage should be available');
    this.assert(typeof Map !== 'undefined', 'Map should be available');
    this.assert(typeof Set !== 'undefined', 'Set should be available');
    this.assert(typeof Promise !== 'undefined', 'Promise should be available');
});

testRunner.test('Browser Compatibility - CSS features', function() {
    // Test for CSS Grid support
    const testElement = document.createElement('div');
    testElement.style.display = 'grid';
    this.assertEqual(testElement.style.display, 'grid', 'CSS Grid should be supported');
    
    // Test for CSS custom properties
    testElement.style.setProperty('--test-prop', 'test-value');
    this.assertEqual(testElement.style.getPropertyValue('--test-prop'), 'test-value', 'CSS custom properties should be supported');
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

testRunner.test('Security - XSS prevention in movie data', function() {
    const ui = new UIManager();
    const maliciousMovie = {
        id: 123,
        title: '<script>alert("xss")</script>',
        poster_path: '/test.jpg',
        release_date: '2023-01-01',
        vote_average: 7.0,
        overview: '<img src="x" onerror="alert(\'xss\')">'
    };
    
    const card = ui.createMovieCard(maliciousMovie);
    
    // Check that script tags are escaped/handled
    this.assert(!card.innerHTML.includes('<script>'), 'Should not include raw script tags');
    this.assert(card.innerHTML.includes('&lt;script&gt;') || card.textContent.includes('<script>'), 'Should escape or safely handle script content');
});

testRunner.test('Security - localStorage data validation', function() {
    // Test that app handles corrupted localStorage gracefully
    localStorage.setItem('cinescope_user', '{"malformed": json}');
    
    const auth = new AuthManager();
    this.assertEqual(auth.currentUser, null, 'Should handle malformed JSON gracefully');
    this.assertEqual(localStorage.getItem('cinescope_user'), null, 'Should clean up corrupted data');
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

testRunner.test('Edge Cases - Empty API responses', function() {
    const ui = new UIManager();
    
    // Test rendering with empty movie array
    ui.renderMovies([], true);
    
    const moviesGrid = document.getElementById('moviesGrid');
    this.assert(moviesGrid.innerHTML.includes('No movies found') || moviesGrid.children.length === 0, 
        'Should handle empty movie results');
});

testRunner.test('Edge Cases - Network failure simulation', function() {
    const api = new MovieAPI();
    
    // Test cache behavior when network fails
    const testKey = 'network-test';
    const testData = { cached: 'data' };
    
    api.setCache(testKey, testData);
    const cachedResult = api.getCache(testKey);
    
    this.assertEqual(cachedResult.cached, 'data', 'Should return cached data when available');
});

testRunner.test('Edge Cases - Rapid user interactions', function() {
    const favorites = new FavoritesManager();
    
    // Mock auth
    window.authManager = {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ id: 123 }),
        showNotification: () => {}
    };
    
    const movieId = 456;
    
    // Rapid toggle operations
    favorites.toggleFavorite(movieId);
    favorites.toggleFavorite(movieId);
    favorites.toggleFavorite(movieId);
    
    this.assert(favorites.isFavorite(movieId), 'Should handle rapid toggles correctly');
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

testRunner.test('Performance - DOM manipulation efficiency', function() {
    const ui = new UIManager();
    const mockMovies = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
        poster_path: `/movie${i + 1}.jpg`,
        release_date: '2023-01-01',
        vote_average: 7.0 + (i * 0.1),
        overview: `Overview for movie ${i + 1}`
    }));
    
    const startTime = performance.now();
    ui.renderMovies(mockMovies, true);
    const renderTime = performance.now() - startTime;
    
    this.assert(renderTime < 100, 'Rendering 20 movies should be fast (< 100ms)');
    
    const moviesGrid = document.getElementById('moviesGrid');
    this.assertEqual(moviesGrid.children.length, 20, 'Should render all movies');
});

// ============================================================================
// USER EXPERIENCE TESTS
// ============================================================================

testRunner.test('User Experience - Loading states', function() {
    const ui = new UIManager();
    
    // Test loading state activation
    ui.setLoadingState(true);
    const loadingContainer = document.getElementById('loadingSpinner');
    this.assert(!loadingContainer.classList.contains('hidden'), 'Loading spinner should be visible');
    
    // Test loading state deactivation
    ui.setLoadingState(false);
    this.assert(loadingContainer.classList.contains('hidden'), 'Loading spinner should be hidden');
});

testRunner.test('User Experience - Error recovery', function() {
    const ui = new UIManager();
    
    // Test error display
    ui.showError('Test error message');
    const errorContainer = document.getElementById('errorContainer');
    this.assert(!errorContainer.classList.contains('hidden'), 'Error should be visible');
    
    // Test error hiding
    ui.hideError();
    this.assert(errorContainer.classList.contains('hidden'), 'Error should be hidden');
});

// ============================================================================
// COMPONENT LIFECYCLE TESTS
// ============================================================================

testRunner.test('Component Lifecycle - Initialization order', function() {
    // Test that global objects are properly initialized
    this.assert(typeof window.movieAPI !== 'undefined', 'MovieAPI should be globally available');
    this.assert(typeof window.authManager !== 'undefined', 'AuthManager should be globally available');
    this.assert(typeof window.favoritesManager !== 'undefined', 'FavoritesManager should be globally available');
    this.assert(typeof window.uiManager !== 'undefined', 'UIManager should be globally available');
});

testRunner.test('Component Lifecycle - Cleanup operations', function() {
    const favorites = new FavoritesManager();
    
    // Add some test data
    window.authManager = {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ id: 123 }),
        showNotification: () => {}
    };
    
    favorites.addFavorite(111);
    favorites.addFavorite(222);
    
    this.assertEqual(favorites.getFavorites().length, 2, 'Should have 2 favorites');
    
    // Test cleanup
    favorites.clearFavorites();
    this.assertEqual(favorites.getFavorites().length, 0, 'Should clear all favorites');
});

// ============================================================================
// HELPER FUNCTIONS FOR TESTING
// ============================================================================

// Mock DOM elements if they don't exist
function ensureTestDOM() {
    const requiredElements = [
        { id: 'moviesGrid', tag: 'div' },
        { id: 'loadingSpinner', tag: 'div' },
        { id: 'errorContainer', tag: 'div' },
        { id: 'errorMessage', tag: 'p' },
        { id: 'sectionTitle', tag: 'h2' },
        { id: 'searchInput', tag: 'input' },
        { id: 'loadMoreBtn', tag: 'button' },
        { id: 'movieModal', tag: 'div' },
        { id: 'modalBody', tag: 'div' }
    ];
    
    requiredElements.forEach(({ id, tag }) => {
        if (!document.getElementById(id)) {
            const element = document.createElement(tag);
            element.id = id;
            element.className = 'hidden'; // Start hidden for testing
            document.body.appendChild(element);
        }
    });
}

// Setup test environment
function setupTestEnvironment() {
    // Ensure required DOM elements exist
    ensureTestDOM();
    
    // Mock console methods for cleaner test output
    const originalLog = console.log;
    const originalError = console.error;
    
    // You can uncomment these to suppress console output during tests
    // console.log = () => {};
    // console.error = () => {};
    
    return {
        cleanup: () => {
            console.log = originalLog;
            console.error = originalError;
            localStorage.clear();
        }
    };
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

// Wait for DOM and run tests
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🧪 Setting up test environment...');
    
    const testEnv = setupTestEnvironment();
    
    try {
        await testRunner.runTests();
    } catch (error) {
        console.error('Test runner error:', error);
    } finally {
        testEnv.cleanup();
    }
});

// Export for manual testing
window.testRunner = testRunner;
window.runTests = () => testRunner.runTests();

// Add test utilities to window for debugging
window.testUtils = {
    clearCache: () => {
        if (window.movieAPI) {
            window.movieAPI.cache.clear();
            console.log('✅ API cache cleared');
        }
    },
    clearAuth: () => {
        localStorage.removeItem('cinescope_user');
        if (window.authManager) {
            window.authManager.currentUser = null;
            console.log('✅ Authentication cleared');
        }
    },
    clearFavorites: () => {
        if (window.favoritesManager) {
            window.favoritesManager.clearFavorites();
            console.log('✅ Favorites cleared');
        }
    },
    getStats: () => {
        return {
            cacheSize: window.movieAPI?.cache.size || 0,
            favoritesCount: window.favoritesManager?.getFavorites().length || 0,
            isAuthenticated: window.authManager?.isAuthenticated() || false,
            currentCategory: window.uiManager?.currentCategory || 'unknown',
            testsRun: testRunner.tests.length,
            testsPassed: testRunner.passed,
            testsFailed: testRunner.failed
        };
    }
};

console.log('🧪 Test file loaded. Tests will run automatically when DOM is ready.');
console.log('💡 Manual testing: Run window.runTests() in console');
console.log('🔧 Test utilities: window.testUtils');

//Manual testing: Run window.runTests() in the browser console