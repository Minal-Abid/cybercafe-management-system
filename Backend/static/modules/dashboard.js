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

    loadTodaysChallenge() {
        this.currentChallenge = this.generateTodaysChallenge();

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
    }

    loadHints() {
        const hintsList = document.getElementById('hints-list');
        hintsList.innerHTML = '';

        this.currentChallenge.hints.forEach((hint, index) => {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'hint-item';
            hintDiv.innerHTML = `<span class="hint-number">${index + 1}.</span><span>${hint}</span>`;
            hintsList.appendChild(hintDiv);
        });
    }

    updateWriteupAvailability() {
        const writeupToggle = document.getElementById('writeup-toggle');

        const canViewWriteup = this.user.plan === 'premium' &&
            this.user.solvedChallenges?.includes(this.currentChallenge.id.toString());

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

    async handleFlagSubmit(e) {
        if (e) e.preventDefault();

        const flagInput = document.getElementById('flag-input');
        const flag = flagInput.value.trim();
        const submitButton = document.getElementById('flag-submit');

        if (!flag) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        await this.utils.delay(1000);

        const isCorrect = this.validateFlag(flag);
        this.showSubmissionResult(isCorrect);

        if (isCorrect) {
            const alreadySolved = this.user.solvedChallenges?.includes(this.currentChallenge.id.toString());

            if (!alreadySolved) {
                this.user.score += this.currentChallenge.points;
                this.user.solvedChallenges = [...(this.user.solvedChallenges || []), this.currentChallenge.id.toString()];

                await supabase
                    .from('profiles')
                    .update({
                        score: this.user.score,
                        solvedChallenges: this.user.solvedChallenges
                    })
                    .eq('id', this.user.id);

                flagInput.value = '';
                this.updateUserStats();
                this.showSolvedBadge();
                this.updateWriteupAvailability();
            }
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Submit Flag';
    }

    validateFlag(flag) {
        const expected = this.currentChallenge.flag || 'CYBER{demo_flag_123}';
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

    generateTodaysChallenge() {
        const challenges = [
            {
                id: 1,
                title: "Crack the Hash",
                description: "Find the original text of the following hash: 5f4dcc3b5aa765d61d8327deb882cf99",
                points: 50,
                category: "Cryptography",
                difficulty: "easy",
                hints: ["It's an MD5 hash", "Common password"],
                writeup: "The hash corresponds to 'password', a very common weak password.",
                flag: "CYBER{password}"
            },
            {
                id: 2,
                title: "Stego Secrets",
                description: "A secret message is hidden inside an image. Can you extract it?",
                points: 70,
                category: "Steganography",
                difficulty: "medium",
                hints: ["Try using steg tools", "Check LSB encoding"],
                writeup: "Using a tool like zsteg or steghide can help extract hidden text from images.",
                flag: "CYBER{hidden_msg_001}"
            },
            {
                id: 3,
                title: "SQLi Buster",
                description: "Bypass the login form using SQL injection.",
                points: 100,
                category: "Web Exploitation",
                difficulty: "hard",
                hints: ["Use ' OR 1=1 --", "Test input fields"],
                writeup: "This challenge demonstrates classic SQL injection bypass by manipulating WHERE clause.",
                flag: "CYBER{sql_injection_win}"
            },
            {
                id: 4,
                title: "XSS Warrior",
                description: "Trigger a JavaScript alert by injecting a payload.",
                points: 60,
                category: "Web Exploitation",
                difficulty: "medium",
                hints: ["<script>alert(1)</script>", "Check comment fields"],
                writeup: "Cross-Site Scripting (XSS) can often be tested in comment forms or search bars.",
                flag: "CYBER{xss_triggered}"
            },
            {
                id: 5,
                title: "Base64 Madness",
                description: "Decode the following string: Q1lCRVIge3VzZV9iYXNlNjR9",
                points: 40,
                category: "Forensics",
                difficulty: "easy",
                hints: ["Use base64 decoder", "Online tools help"],
                writeup: "Decoding reveals 'CYBER{use_base64}', which is a basic encoding method.",
                flag: "CYBER{use_base64}"
            }
        ];

        return challenges[Math.floor(Math.random() * challenges.length)];
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
