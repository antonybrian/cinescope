class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        this.initializeAuth();
    }

    initializeAuth() {
        // Check for existing session
        const savedUser = localStorage.getItem('cinescope_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateAuthUI();
            } catch (error) {
                console.error('Error loading saved user:', error);
                localStorage.removeItem('cinescope_user');
            }
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth button click
        document.getElementById('authBtn')?.addEventListener('click', () => {
            this.showAuthModal();
        });

            // Open Sign Up modal
            document.getElementById('authSignUp').addEventListener('click', () => {
                this.showSignupModal();
            });

            // Close Sign Up modal
            document.getElementById('signupModalClose').addEventListener('click', () => {
                this.hideSignupModal();
            });

            // Close modal when clicking overlay
            document.querySelector('#signupModal .modal-overlay').addEventListener('click', () => {
                this.hideSignupModal();
            });

            // Optional: Escape key closes modal
            document.addEventListener('keydown', (e) => {
                if (e.key === "Escape" && !document.getElementById('signupModal').classList.contains('hidden')) {
                    this.hideSignupModal();
                }
            });


        // Logout button click
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Auth modal close
        document.getElementById('authModalClose')?.addEventListener('click', () => {
            this.hideAuthModal();
        });

        // Modal overlay click
        document.getElementById('authModal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.hideAuthModal();
            }
        });

        // Auth form submission
        document.getElementById('authForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.authModal?.classList.contains('visible')) {
                this.hideAuthModal();
            }
        });
    }

    showAuthModal() {
        this.authModal = document.getElementById('authModal');
        this.authModal.classList.remove('hidden');
        setTimeout(() => {
            this.authModal.classList.add('visible');
        }, 10);

        // Focus on email input
        setTimeout(() => {
            document.getElementById('email')?.focus();
        }, 100);
    }

    hideAuthModal() {
        if (this.authModal) {
            this.authModal.classList.remove('visible');
            setTimeout(() => {
                this.authModal.classList.add('hidden');
                this.resetAuthForm();
            }, 250);
        }
    }

    resetAuthForm() {
        const form = document.getElementById('authForm');
        if (form) {
            form.reset();
        }
    }


    // ===== SIGNUP MODAL HANDLERS =====
showSignupModal() {
    this.signupModal = document.getElementById('signupModal');
    this.signupModal.classList.remove('hidden');
    setTimeout(() => {
        this.signupModal.classList.add('visible');
    }, 10);

    // Focus on first name input when modal opens
    setTimeout(() => {
        document.getElementById('firstName')?.focus();
    }, 100);
}

hideSignupModal() {
    if (this.signupModal) {
        this.signupModal.classList.remove('visible');
        setTimeout(() => {
            this.signupModal.classList.add('hidden');
            this.resetSignupForm();
        }, 250);
    }
}

// Reset signup form when modal closes
resetSignupForm() {
    const form = document.getElementById('signupForm');
    form?.reset();
}


    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        // Simple validation
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        // Simulate authentication (in real app, this would be an API call)
        try {
            // Show loading state
            const submitBtn = e.target.querySelector('.auth-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create user object
            const user = {
                id: Date.now(),
                email: email,
                name: email.split('@')[0],
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
                loginTime: new Date().toISOString()
            };

            this.currentUser = user;
            localStorage.setItem('cinescope_user', JSON.stringify(user));
            
            this.updateAuthUI();
            this.hideAuthModal();
            
            // Show success message
            this.showNotification('Welcome back! You are now signed in.', 'success');
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            const submitBtn = e.target.querySelector('.auth-submit-btn');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('cinescope_user');
        this.updateAuthUI();
        this.showNotification('You have been signed out.', 'info');
        
        // Clear favorites if user logs out
        if (window.favoritesManager) {
            window.favoritesManager.clearFavorites();
        }
    }

    updateAuthUI() {
        const authBtn = document.getElementById('authBtn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const favoritesBtn = document.getElementById('favoritesBtn');

        if (this.currentUser) {
            authBtn.style.display = 'none';
            userProfile.classList.remove('hidden');
            userName.textContent = this.currentUser.name;
            favoritesBtn.style.display = 'block';
        } else {
            authBtn.style.display = 'block';
            userProfile.classList.add('hidden');
            favoritesBtn.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? 'var(--success-500)' : 
                       type === 'error' ? 'var(--error-500)' : 
                       'var(--primary-500)',
            color: 'white',
            padding: 'var(--space-4)',
            borderRadius: '8px',
            zIndex: '3000',
            transform: 'translateX(100%)',
            transition: 'transform var(--transition-normal)',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 250);
        }, 3000);
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();