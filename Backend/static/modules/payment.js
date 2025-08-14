// payment.js
import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';

export class PaymentModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
    }

    async init() {
        await this.storage.init();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePaymentSubmit();
            });
        }
    }

    async handlePaymentSubmit() {
        const email = document.getElementById('payment-email')?.value;
        const cardNumber = document.getElementById('card-number')?.value;
        const expiry = document.getElementById('expiry')?.value;
        const cvv = document.getElementById('cvv')?.value;

        const submitButton = document.getElementById('payment-submit');
        const buttonText = submitButton?.querySelector('.button-text');
        const buttonLoader = submitButton?.querySelector('.button-loader');

        if (!submitButton || !buttonText || !buttonLoader) return;

        // Validate inputs
        if (!this.utils.validateEmail(email)) {
            this.utils.showError('payment-error', 'Invalid email address.');
            return;
        }
        if (!this.utils.validateCardNumber(cardNumber)) {
            this.utils.showError('payment-error', 'Invalid card number. Must be 16 digits.');
            return;
        }
        if (!this.utils.validateExpiry(expiry)) {
            this.utils.showError('payment-error', 'Invalid expiry date. Use MM/YY format.');
            return;
        }
        if (!this.utils.validateCvv(cvv)) {
            this.utils.showError('payment-error', 'Invalid CVV. Must be 3 digits.');
            return;
        }

        // Show loading state
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
        submitButton.disabled = true;
        this.utils.hideError('payment-error');

        await this.utils.delay(2000); // Simulate payment processing

        try {
            const pendingRegistration = JSON.parse(localStorage.getItem('pendingRegistration') || '{}');

            if (pendingRegistration.username) {
                const user = {
                    id: Date.now(),
                    username: pendingRegistration.username,
                    email: pendingRegistration.email,
                    score: 0,
                    plan: 'premium',
                    solvedChallenges: [],
                    createdAt: new Date()
                };

                this.storage.setCurrentUser(user);
                localStorage.removeItem('pendingRegistration');
                window.location.href = '/dashboard';
            } else {
                this.utils.showError('payment-error', 'No pending registration found.');
            }
        } catch (error) {
            this.utils.showError('payment-error', 'Payment failed. Please try again.');
        } finally {
            buttonText.classList.remove('hidden');
            buttonLoader.classList.add('hidden');
            submitButton.disabled = false;
        }
    }
}
