// main.js
import { AuthModule } from '/static/modules/auth.js';
import { PlansModule } from '/static/modules/plans.js';
import { PaymentModule } from '/static/modules/payment.js';
import { DashboardModule } from '/static/modules/dashboard.js';
import { LeaderboardModule } from '/static/modules/leaderboard.js';
import { StorageModule } from '/static/modules/storage.js';
import { UtilsModule } from '/static/modules/utils.js';

class CyberCafeMain {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.modules = {
            auth: new AuthModule(),
            plans: new PlansModule(),
            payment: new PaymentModule(),
            dashboard: new DashboardModule(),
            leaderboard: new LeaderboardModule(),
            storage: new StorageModule(),
            utils: new UtilsModule()
        };

        this.init();
    }

    detectCurrentPage() {
        const pathname = window.location.pathname;
        const pageMap = {
            '/': 'index',
            '/auth': 'auth',
            '/plans': 'plans',
            '/payment': 'payment',
            '/dashboard': 'dashboard',
            '/leaderboard': 'leaderboard'
        };

        return pageMap[pathname] || 'index';
    }

    async init() {
        await this.modules.storage.init();

        const user = this.modules.storage.getCurrentUser();

        if (this.currentPage === 'index') {
            const loadingScreen = document.getElementById('loading-screen');
            const landingContent = document.getElementById('landing-content');

            if (loadingScreen && landingContent) {
                landingContent.classList.remove('active');
                loadingScreen.style.display = 'flex';

                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    landingContent.classList.add('active');

                    if (!user) {
                        window.location.href = '/auth';
                    } else if (user.plan === 'free' || user.plan === 'premium') {
                        window.location.href = '/dashboard';
                    } else {
                        window.location.href = '/plans';
                    }
                }, 2000);
            }
            return;
        }

        switch (this.currentPage) {
            case 'auth':
                await this.modules.auth.init();
                break;
            case 'plans':
                await this.modules.plans.init();
                break;
            case 'payment':
                await this.modules.payment.init();
                break;
            case 'dashboard':
                await this.modules.dashboard.init();
                break;
            case 'leaderboard':
                await this.modules.leaderboard.init();
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Handle tab switch visuals
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const usernameField = document.getElementById('username-field');
    const buttonText = document.querySelector('.button-text');
    const authTitle = document.getElementById('auth-title');

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            usernameField.classList.add('hidden');
            if (buttonText) buttonText.textContent = 'Sign In';
            if (authTitle) authTitle.textContent = 'Welcome Back';
        });

        registerTab.addEventListener('click', () => {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            usernameField.classList.remove('hidden');
            if (buttonText) buttonText.textContent = 'Sign Up';
            if (authTitle) authTitle.textContent = 'Create Account';
        });
    }

    new CyberCafeMain();
});
