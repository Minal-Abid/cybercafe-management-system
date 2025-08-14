import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';
import { supabase } from './utils.js';

export class LeaderboardModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
        this.users = [];
        this.currentUser = null;
    }

    async init() {
        await this.storage.init();
        this.currentUser = this.storage.getCurrentUser();

        if (!this.currentUser) {
            window.location.href = '/auth';
            return;
        }

        await this.fetchUsers();
        this.setupEventListeners();
        this.showInitialScreen();
    }

    async fetchUsers() {
        const { data, error } = await supabase.from('profiles').select('*');

        if (error) {
            console.error('Failed to fetch users:', error);
            this.users = [];
        } else {
            this.users = data;
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterLeaderboard(filter);
            });
        });

        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });

        document.getElementById('logout-button')?.addEventListener('click', () => this.logout());
    }

    showInitialScreen() {
        this.renderLeaderboard('all');
        this.updateUserStatsCard();
    }

    filterLeaderboard(filter) {
        this.renderLeaderboard(filter);

        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    }

    renderLeaderboard(filter) {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;

        let filteredUsers = [...this.users];
        if (filter !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.plan === filter);
        }

        filteredUsers.sort((a, b) => b.score - a.score);
        leaderboardList.innerHTML = '';

        if (filteredUsers.length === 0) {
            leaderboardList.innerHTML = `
                <div class="empty-leaderboard">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"/>
                        <path d="M6 2L14 2"/>
                        <path d="M6 16H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M14 16h1.5a2.5 2.5 0 0 0 0-5H14"/>
                        <path d="M6 9L14 9"/>
                    </svg>
                    <h3 class="empty-title">No users found</h3>
                    <p class="empty-message">Be the first to solve some challenges!</p>
                </div>
            `;
            return;
        }

        filteredUsers.forEach((user, index) => {
            const rank = index + 1;
            const isCurrentUser = this.currentUser && user.id === this.currentUser.id;

            const entryDiv = document.createElement('div');
            entryDiv.className = `leaderboard-entry ${this.getRankClass(rank)} ${isCurrentUser ? 'current-user' : ''}`;

            entryDiv.innerHTML = `
                <div class="entry-left">
                    <div class="rank-icon ${this.getRankClass(rank)}">${this.getRankIcon(rank)}</div>
                    <div class="entry-info">
                        <div class="entry-name-row">
                            <h3 class="entry-name ${isCurrentUser ? 'current-user' : ''}">${user.username}</h3>
                            ${isCurrentUser ? '<span class="you-badge">(You)</span>' : ''}
                            ${user.plan === 'premium' ? `
                                <div class="premium-crown">
                                    <svg class="crown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                                    </svg>
                                    <span class="premium-badge-small">PREMIUM</span>
                                </div>
                            ` : ''}
                        </div>
                        <p class="entry-meta">Rank #${rank} • ${user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1)} Member</p>
                    </div>
                </div>
                <div class="entry-right">
                    <div class="entry-score">${user.score}</div>
                    <div class="entry-points-label">points</div>
                </div>
            `;

            leaderboardList.appendChild(entryDiv);
        });
    }

    updateUserStatsCard() {
        const sortedUsers = [...this.users].sort((a, b) => b.score - a.score);
        const userRank = sortedUsers.findIndex(user => user.id === this.currentUser.id) + 1;

        document.getElementById('user-rank').textContent = userRank > 0 ? `#${userRank}` : 'N/A';
        document.getElementById('user-total-score').textContent = this.currentUser.score;
        document.getElementById('user-challenges-solved').textContent = this.currentUser.solvedChallenges?.length || 0;
    }

    getRankClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return 'default';
    }

    getRankIcon(rank) {
        switch (rank) {
            case 1: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"/><path d="M6 2L14 2"/><path d="M6 16H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M14 16h1.5a2.5 2.5 0 0 0 0-5H14"/><path d="M6 9L14 9"/></svg>`;
            case 2: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`;
            case 3: return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M14 9h1.5a2.5 2.5 0 0 0 0-5H14"/><path d="M6 2L14 2"/><path d="M6 16H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M14 16h1.5a2.5 2.5 0 0 0 0-5H14"/><path d="M6 9L14 9"/></svg>`;
            default: return `<span class="rank-number">#${rank}</span>`;
        }
    }

    logout() {
        this.storage.logout();
    }
}
