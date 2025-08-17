// admin.js
import { supabase } from './utils.js';
import { StorageModule } from './storage.js';
import { UtilsModule } from './utils.js';

export class AdminModule {
    constructor() {
        this.storage = new StorageModule();
        this.utils = new UtilsModule();
    }

    async init() {
        await this.storage.init();
        const currentUser = this.storage.getCurrentUser();

        // ✅ Security: only allow admins
        if (!currentUser || !currentUser.isAdmin) {
            alert("Access denied: Admins only");
            window.location.href = "/dashboard";
            return;
        }

        await this.loadUsers();
    }

    async loadUsers() {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, username, email, plan, score, is_admin');

            if (error) throw error;

            this.renderUsers(users);
        } catch (err) {
            console.error("Error loading users:", err.message);
            this.utils.showError("error-message", "Failed to load users.");
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById("users-table-body");
        tbody.innerHTML = "";

        users.forEach(user => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${user.username || "N/A"}</td>
                <td>${user.email || "N/A"}</td>
                <td>${user.plan || "free"}</td>
                <td>${user.score || 0}</td>
                <td>${user.is_admin ? "✅" : "❌"}</td>
                <td>
                    <button class="table-btn" data-id="${user.id}" data-action="toggle-admin">
                        ${user.is_admin ? "Remove Admin" : "Make Admin"}
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Add button listeners
        this.setupActionButtons();
    }

    setupActionButtons() {
        const buttons = document.querySelectorAll(".table-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", async () => {
                const userId = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === "toggle-admin") {
                    await this.toggleAdmin(userId, btn);
                }
            });
        });
    }

    async toggleAdmin(userId, btn) {
        try {
            const isCurrentlyAdmin = btn.textContent.includes("Remove");

            const { error } = await supabase
                .from("profiles")
                .update({ is_admin: !isCurrentlyAdmin })
                .eq("id", userId);

            if (error) throw error;

            btn.textContent = isCurrentlyAdmin ? "Make Admin" : "Remove Admin";
            btn.closest("tr").querySelector("td:nth-child(5)").textContent = isCurrentlyAdmin ? "❌" : "✅";
        } catch (err) {
            console.error("Error toggling admin:", err.message);
            alert("Failed to update admin status.");
        }
    }
}
