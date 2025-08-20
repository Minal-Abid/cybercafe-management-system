import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';
import { supabase } from './utils.js';

export class DashboardModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
        this.currentChallenge = null;
        this.user = null;
    }

    async init() {
        await this.storage.init();
        this.user = this.storage.getCurrentUser();

        if (!this.user) {
            window.location.href = '/auth';

            return;
        }

        this.setupEventListeners();
        this.showInitialScreen();
    }

    setupEventListeners() {
        document.getElementById('flag-form')?.addEventListener('submit', (e) => this.handleFlagSubmit(e));
        document.getElementById('flag-submit')?.addEventListener('click', () => this.handleFlagSubmit());
        document.getElementById('hints-toggle')?.addEventListener('click', () => this.toggleHints());
        document.getElementById('writeup-toggle')?.addEventListener('click', () => this.toggleWriteup());
        document.getElementById('nav-leaderboard')?.addEventListener('click', () => window.location.href = 'leaderboard.html');
        document.getElementById('logout-button')?.addEventListener('click', () => this.logout());
    }

    showInitialScreen() {
        this.loadDashboard();
        this.updateNavbar();
    }

    loadDashboard() {
        this.loadTodaysChallenge();
        this.updateUserStats();
    }

   async loadTodaysChallenge() {
    try {
        // Fetch all published challenges from Supabase
        const { data: challenges, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('published', true);

        if (error) throw error;
        if (!challenges || challenges.length === 0) {
            document.getElementById('challenge-title').textContent = "No challenges available.";
            document.getElementById('challenge-description-text').textContent = "Ask the admin to add some challenges.";
            return;
        }

        // Deterministic daily random challenge
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const seed = today.replace(/-/g, ""); // e.g. "20250820"
        const index = parseInt(seed, 10) % challenges.length;

        this.currentChallenge = challenges[index];

        // Update UI
        document.getElementById('challenge-title').textContent = this.currentChallenge.title;
        document.getElementById('challenge-description-text').textContent = this.currentChallenge.description;
        document.getElementById('challenge-points').textContent = `${this.currentChallenge.points} pts`;
        document.getElementById('challenge-category').textContent = this.currentChallenge.category;

        const difficultyBadge = document.getElementById('challenge-difficulty');
        difficultyBadge.textContent = this.currentChallenge.difficulty.toUpperCase();
        difficultyBadge.className = `difficulty-badge ${this.currentChallenge.difficulty}`;

        this.loadHints();

        if (this.user?.solvedChallenges?.includes(this.currentChallenge.id.toString())) {
            this.showSolvedBadge();
        }

        this.updateWriteupAvailability();
    } catch (err) {
        console.error('Error loading challenge:', err.message);
        document.getElementById('challenge-title').textContent = "Failed to load challenge.";
    }
}


loadHints() {
    const hintsList = document.getElementById('hints-list');
    hintsList.innerHTML = '';

    let hints = this.currentChallenge.hints || [];
    if (typeof hints === 'string') {
        try { hints = JSON.parse(hints); } catch { hints = [hints]; }
    }

    hints.forEach((hint, index) => {
        const hintDiv = document.createElement('div');
        hintDiv.className = 'hint-item';
        hintDiv.innerHTML = `<span class="hint-number">${index + 1}.</span><span>${hint}</span>`;
        hintsList.appendChild(hintDiv);
    });

    document.getElementById('hints-count').textContent = hints.length;
}

validateFlag(flag) {
    const expected = this.currentChallenge.flag;
    return flag.toLowerCase() === expected.toLowerCase();
}

    showSubmissionResult(isCorrect) {
        const resultDiv = document.getElementById('submission-result');
        const title = resultDiv.querySelector('.result-title');
        const message = resultDiv.querySelector('.result-message');

        resultDiv.classList.remove('hidden', 'correct', 'incorrect');

        if (isCorrect) {
            resultDiv.classList.add('correct');
            title.textContent = '🎉 Congratulations!';
            message.textContent = `You earned ${this.currentChallenge.points} points and solved the challenge!`;
        } else {
            resultDiv.classList.add('incorrect');
            title.textContent = '❌ Incorrect Flag';
            message.textContent = "Don't give up! Try again tomorrow with a fresh perspective.";
        }
    }

    updateUserStats() {
        document.getElementById('total-score').textContent = this.user.score;
        document.getElementById('challenges-solved').textContent = this.user.solvedChallenges?.length || 0;
        document.getElementById('plan-status').textContent = this.user.plan.toUpperCase();
    }

    updateNavbar() {
        document.getElementById('user-name').textContent = this.user.username;
        document.getElementById('user-score').textContent = `${this.user.score} points`;

        const premiumBadge = document.getElementById('premium-badge');
        if (this.user.plan === 'premium') {
            premiumBadge.classList.remove('hidden');
        } else {
            premiumBadge.classList.add('hidden');
        }
    }

    logout() {
        this.storage.logout();
    }

    showSolvedBadge() {
        const badge = document.getElementById('solved-badge');
        if (badge) badge.classList.remove('hidden');
    }

   

    toggleHints() {
        const hints = document.getElementById('hints-section');
        hints?.classList.toggle('hidden');
    }

   toggleWriteup() {
    const writeup = document.getElementById('writeup-section');
    const writeupToggle = document.getElementById('writeup-toggle');
    const writeupText = document.getElementById('writeup-text-content');

    if (!writeup || !writeupToggle || !writeupText) return;

    const span = writeupToggle.querySelector('span');
    if (!span) return;

    if (writeup.classList.contains('hidden')) {
        writeup.classList.remove('hidden');
        span.textContent = 'Hide Writeup';
        writeupText.textContent = this.currentChallenge.writeup;
    } else {
        writeup.classList.add('hidden');
        span.textContent = 'Show Writeup';
    }
}

}
