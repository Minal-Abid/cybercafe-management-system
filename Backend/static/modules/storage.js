// storage.js
import { supabase } from './utils.js';

export class StorageModule {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        await this.refreshSession();
        await this.loadUserFromSupabase();
    }

    async refreshSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
            console.warn('Supabase session missing:', error?.message);
        }
    }

    async loadUserFromSupabase() {
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            console.warn('No authenticated user:', error?.message);
            this.currentUser = null;
            return;
        }

        console.log("Fetched user:", user);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        console.log("Profile fetched:", profile);
        console.log("Profile error:", profileError);

        // ✅ If no profile exists (new Google user or missing record), create one
        if (profileError || !profile) {
            console.warn('No profile found — creating new profile for user:', user.email);

            const newProfile = {
                id: user.id,
                username: user.user_metadata?.full_name || user.email.split('@')[0],
                score: 0,
                plan: 'free',
                solvedChallenges: [],
                is_admin: false   // 👈 default false
            };

            const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
            if (insertError) {
                console.error('Error creating profile:', insertError.message);
            }

            this.currentUser = {
                ...newProfile,
                email: user.email,
                createdAt: user.created_at,
                isAdmin: false   // camelCase for frontend
            };
        } else {
            // Profile exists — use it
            this.currentUser = {
                id: user.id,
                email: user.email,
                username: profile.username || user.email.split('@')[0],
                plan: profile.plan || 'free',
                score: profile.score || 0,
                solvedChallenges: profile.solvedChallenges || [],
                createdAt: user.created_at,
                isAdmin: profile.is_admin || false   // ✅ map DB -> frontend
            };
            console.log("Storage - is_admin from DB:", profile.is_admin);
            console.log("Storage - isAdmin set to:", this.currentUser.isAdmin);
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async logout() {
        await supabase.auth.signOut();
        this.currentUser = null;
        window.location.href = '/auth';
    }
}
