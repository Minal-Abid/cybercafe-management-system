// dashboard.js
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
        document.getElementById('hints-toggle')?.addEventListener('click', () => this.toggleHints());
        document.getElementById('writeup-toggle')?.addEventListener('click', () => this.toggleWriteup());
        document.getElementById('nav-leaderboard')?.addEventListener('click', () => window.location.href = '/leaderboard');
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

            // Select the latest challenge (or change to random/daily if you want)
            this.currentChallenge = challenges[challenges.length - 1];

            // Update UI
            document.getElementById('challenge-title').textContent = this.currentChallenge.title;
            document.getElementById('challenge-description-text').textContent = this.currentChallenge.description;
            document.getElementById('challenge-points').textContent = `${this.currentChallenge.points} pts`;
            document.getElementById('challenge-category').textContent = this.currentChallenge.category;

            const difficultyBadge = document.getElementById('challenge-difficulty');
            difficultyBadge.textContent = this.currentChallenge.difficulty.toUpperCase();
            difficultyBadge.className = `difficulty-badge ${this.currentChallenge.difficulty}`;

            this.loadHints();
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

    async handleFlagSubmit(e) {
        if (e) e.preventDefault();

        const flagInput = document.getElementById('flag-input');
        const flag = flagInput.value.trim();
        if (!flag) return;

        const submitButton = document.getElementById('flag-submit');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        await this.utils.delay(1000);

        const isCorrect = this.validateFlag(flag);
        this.showSubmissionResult(isCorrect);

        if (isCorrect) {
            // Increment score + solvedChallenges (integer)
            const newScore = this.user.score + this.currentChallenge.points;
            const newSolvedCount = (this.user.solvedChallenges || 0) + 1;

            const { error } = await supabase
                .from('profiles')
                .update({
                    score: newScore,
                    solvedChallenges: newSolvedCount
                })
                .eq('id', this.user.id);

            if (!error) {
                this.user.score = newScore;
                this.user.solvedChallenges = newSolvedCount;

                flagInput.value = '';
                this.updateUserStats();
                this.showSolvedBadge();
                this.updateWriteupAvailability();
            } else {
                console.error("Error updating profile:", error.message);
            }
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Submit Flag';
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
        document.getElementById('challenges-solved').textContent = this.user.solvedChallenges || 0;
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
        const hints = document.getElementById('hints-content');
        hints?.classList.toggle('hidden');
    }

    toggleWriteup() {
        const writeupContent = document.getElementById('writeup-content');
        const writeupToggle = document.getElementById('writeup-toggle');
        const writeupText = document.getElementById('writeup-text-content');

        if (!writeupContent || !writeupToggle || !writeupText) return;

        const span = writeupToggle.querySelector('span');
        if (!span) return;

        if (writeupContent.classList.contains('hidden')) {
            writeupContent.classList.remove('hidden');
            span.textContent = 'Hide Writeup';
            writeupText.textContent = this.currentChallenge.writeup || "No writeup available.";
        } else {
            writeupContent.classList.add('hidden');
            span.textContent = 'Show Writeup';
        }
    }

    updateWriteupAvailability() {
        const writeupToggle = document.getElementById('writeup-toggle');
        if (!writeupToggle) return;

        const canViewWriteup = this.user.plan === 'premium' &&
            (this.user.solvedChallenges || 0) > 0; // simple check

        if (canViewWriteup) {
            writeupToggle.disabled = false;
            writeupToggle.classList.remove('disabled');
            writeupToggle.querySelector('span').textContent = 'Show Writeup';
        } else {
            writeupToggle.disabled = true;
            writeupToggle.classList.add('disabled');
            writeupToggle.querySelector('span').textContent = 'Writeup (Premium + Solve Required)';
        }
    }
}
