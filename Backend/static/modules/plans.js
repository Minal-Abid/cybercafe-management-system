// Plans module for CyberCafe app (with Supabase registration)
import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';
import { supabase } from './utils.js';

export class PlansModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
        this.selectedPlan = 'free';
        this.pendingRegistration = null;
    }

    async init() {
        this.pendingRegistration = JSON.parse(localStorage.getItem('pendingRegistration')) || null;
        if (!this.pendingRegistration) {
            window.location.href = '/auth';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.plan-card').forEach(card => {
            card.addEventListener('click', (e) => this.handlePlanSelection(e));
        });

        document.querySelectorAll('.plan-select-btn, .plan-button, #continue-plan').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const plan = e.target.dataset.plan || e.target.closest('.plan-card')?.dataset.plan;
                if (plan) await this.selectPlan(plan);
            });
        });
    }

    async handlePlanSelection(e) {
        const plan = e.target.dataset.plan || e.target.closest('.plan-card')?.dataset.plan;
        if (plan) await this.selectPlan(plan);
    }

    async selectPlan(plan) {
        this.selectedPlan = plan;
        localStorage.setItem('selectedPlan', plan);

        if (!this.pendingRegistration) {
            console.error('No pending registration data found.');
            return;
        }

        if (plan === 'premium') {
            window.location.href = '/payment';
        } else {
            await this.registerWithPlan(this.pendingRegistration, plan);
        }
    }

    async registerWithPlan(regData, plan) {
        const { username, email, password } = regData;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        plan,
                        score: 0,
                        solvedChallenges: []
                    }
                }
            });

            if (error) {
                console.error('Supabase registration error:', error.message);
                alert('Registration failed: ' + error.message);
                return;
            }

            // Wait for Supabase to reflect authenticated session
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {
                console.warn('User not logged in yet after signup');
                return;
            }

            const profile = {
                id: user.id,
                email: user.email,
                username,
                plan,
                score: 0,
                solvedChallenges: [],
                createdAt: user.created_at
            };

            this.storage.setCurrentUser(profile);
            localStorage.removeItem('pendingRegistration');
            localStorage.removeItem('selectedPlan');
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('Unexpected error during registration:', err);
            alert('Unexpected error during registration. Please try again.');
        }
    }
}
