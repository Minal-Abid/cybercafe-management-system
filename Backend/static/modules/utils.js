// Utility module for CyberCafe app - shared utility functions
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://oecjzxzklcvmehcjiwja.supabase.co';  
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2p6eHprbGN2bWVoY2ppd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjE5MzcsImV4cCI6MjA3MDEzNzkzN30.JMsltU-C0VCxhH5FpSKo04n2Z_M-fkPiy1NGXSM4bbs';             
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class UtilsModule {
    constructor() {
        // No initialization needed for utilities
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (!errorElement) return;

        const errorText = errorElement.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        errorElement.classList.remove('hidden');
    }

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validateCardNumber(number) {
        return /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(number);
    }

    validateExpiry(date) {
        return /^(0[1-9]|1[0-2])\/\d{2}$/.test(date);
    }

    validateCvv(code) {
        return /^\d{3}$/.test(code);
    }
}
