// admin.js
import { supabase } from './utils.js';
import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';

export class AdminModule {
  constructor() {
    this.storage = new StorageModule();
    this.utils = new UtilsModule();

    this.columns = [];            
    this.colIndex = {};           
  }

  async init() {
    await this.storage.init();
    const currentUser = this.storage.getCurrentUser();

    console.log('Admin check - currentUser:', currentUser);
    console.log('Admin check - isAdmin:', currentUser?.isAdmin);

    if (!currentUser || !currentUser.isAdmin) {
      alert('Access denied: Admins only');
      window.location.href = '/dashboard';
      return;
    }

    this.setupTabs();
    this.computeColumns();

    console.log('Initializing admin panel...');
    await this.loadUsers();
    await this.loadChallenges();   // ✅ load all challenges
    this.setupLogoutButton();
    this.setupChallengeForm();
  }

  /* ---------- Tabs ---------- */
  setupTabs() {
    const buttons = document.querySelectorAll('.nav-button[data-tab]');
    if (!buttons.length) return; 

    const showTab = (name) => {
      document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
      const target = document.getElementById(`tab-${name}`);
      if (target) target.classList.remove('hidden');

      buttons.forEach(b => b.classList.toggle('active', (b.dataset.tab === name)));
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });

    const first = buttons[0];
    if (first) showTab(first.dataset.tab);
  }

  /* ---------- Header helpers ---------- */
  computeColumns() {
    const ths = document.querySelectorAll('.glass-table thead th');
    this.columns = Array.from(ths).map(th => th.textContent.trim().toLowerCase());
    this.colIndex = {};
    this.columns.forEach((name, i) => (this.colIndex[name] = i));
  }

  /* ---------- Load all users ---------- */
  async loadUsers() {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, email, plan, score');

      if (error) throw error;
      this.renderUsers(users || []);
    } catch (err) {
      console.error('Error loading users:', err.message);
      alert('Failed to load users.');
    }
  }

  /* ---------- Render users ---------- */
  renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(user => {
      const tr = document.createElement('tr');
      const fields = ['id', 'username', 'email', 'plan', 'score'];
      fields.forEach(field => {
        const td = document.createElement('td');
        td.textContent = user[field] ?? 'N/A';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* ---------- Load all challenges ---------- */
  async loadChallenges() {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, title, category, difficulty, points, published');

      if (error) throw error;
      this.renderChallenges(challenges || []);
    } catch (err) {
      console.error('Error loading challenges:', err.message);
      alert('Failed to load challenges.');
    }
  }

  /* ---------- Render challenges ---------- */
  renderChallenges(challenges) {
    const tbody = document.getElementById('challenges-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    challenges.forEach(ch => {
      const tr = document.createElement('tr');
      const fields = ['id', 'title', 'category', 'difficulty', 'points', 'published'];
      fields.forEach(field => {
        const td = document.createElement('td');
        td.textContent = ch[field] ?? 'N/A';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  /* ---------- Challenges form ---------- */
  setupChallengeForm() {
    const showBtn = document.getElementById('show-challenge-form');
    const form = document.getElementById('challenge-form');
    const cancelBtn = document.getElementById('cancel-challenge');
    const errorBox = document.getElementById('challenge-error');

    if (!showBtn || !form) return;

    showBtn.addEventListener('click', () => {
      form.style.display = 'block';
      errorBox.style.display = 'none';
    });

    cancelBtn?.addEventListener('click', () => {
      form.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      try {
        const payload = this.collectChallengePayload();
        const { error } = await supabase.from('challenges').insert([payload]);
        if (error) throw error;

        alert('Challenge added ✅');
        form.reset();
        form.style.display = 'none';
        await this.loadChallenges();   // ✅ refresh table
      } catch (err) {
        console.error('Error adding challenge:', err);
        errorBox.textContent = err.message || 'Failed to add challenge';
        errorBox.style.display = 'block';
      }
    });
  }

  collectChallengePayload() {
    const title = document.getElementById('ch-title').value.trim();
    const description = document.getElementById('ch-description').value.trim();
    const points = parseInt(document.getElementById('ch-points').value, 10);
    const category = document.getElementById('ch-category').value.trim();
    const difficulty = document.getElementById('ch-difficulty').value;
    const hintsRaw = document.getElementById('ch-hints').value.trim();
    const writeup = document.getElementById('ch-writeup').value.trim();
    const flag = document.getElementById('ch-flag').value.trim();
    const published = document.getElementById('ch-published').checked;

    if (!title || !description || !points || !category || !difficulty || !writeup || !flag) {
      throw new Error('Please fill all required fields (*)');
    }

    return {
      title,
      description,
      points,
      category,
      difficulty,
      hints: hintsRaw ? hintsRaw.split(',').map(h => h.trim()) : [],
      writeup,
      flag,
      published,
      created_by: this.storage.getCurrentUser()?.id
    };
  }

  /* ---------- Logout ---------- */
  setupLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
      try {
        await this.storage.logout();
      } catch (err) {
        console.error('Logout error:', err);
        alert('An unexpected error occurred during logout.');
      }
    });
  }
}
