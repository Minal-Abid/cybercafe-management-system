// auth.js
import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';
import { supabase } from './utils.js';

export class AuthModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
    }

    async init() {
        await this.checkLoggedIn();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const authForm = document.getElementById('auth-form-element');
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const authSubmit = document.getElementById('auth-submit');

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuthSubmit();
            });
        }

        if (loginTab) {
            loginTab.addEventListener('click', () => this.switchTab('login'));
        }

        if (registerTab) {
            registerTab.addEventListener('click', () => this.switchTab('register'));
        }

        if (authSubmit) {
            authSubmit.addEventListener('click', () => this.handleAuthSubmit());
        }
    }

    async handleAuthSubmit() {
        const isLogin = document.getElementById('login-tab').classList.contains('active');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const username = document.getElementById('username')?.value.trim();

        const submitButton = document.getElementById('auth-submit');
        const buttonText = submitButton.querySelector('.button-text');
        const buttonLoader = submitButton.querySelector('.button-loader');

        this.utils.hideError('error-message');
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    this.utils.showError('error-message', error.message);
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                if (!username || !email || !password) {
                    this.utils.showError('error-message', 'All fields are required.');
                    return;
                }

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password
                });

                if (signUpError) {
                    this.utils.showError('error-message', signUpError.message);
                    return;
                }

                const userId = signUpData.user?.id;
                if (!userId) {
                    this.utils.showError('error-message', 'Failed to get user ID.');
                    return;
                }

                // ✅ Insert user into profiles table
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        username: username,
                        score: 0,
                        plan: 'free',
                        solvedChallenges: []
                    }]);

                if (insertError) {
                    this.utils.showError('error-message', insertError.message);
                    return;
                }

                // ✅ Save pending info locally (if needed)
                const pending = { username, email, password };
                localStorage.setItem('pendingRegistration', JSON.stringify(pending));

                // ✅ Redirect to plan selection
                window.location.href = '/plans';
            }
        } catch (err) {
            this.utils.showError('error-message', 'Unexpected error occurred.');
            console.error('Auth submit error:', err);
        } finally {
            buttonText.classList.remove('hidden');
            buttonLoader.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    switchTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const usernameField = document.getElementById('username-field');
        const authTitle = document.getElementById('auth-title');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            usernameField.classList.add('hidden');
            authTitle.textContent = 'Welcome Back';
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            usernameField.classList.remove('hidden');
            authTitle.textContent = 'Create Account';
        }

        document.getElementById('auth-form-element').reset();
        this.utils.hideError('error-message');
    }

    async checkLoggedIn() {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            window.location.href = '/dashboard';
        }
    }
}
