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

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('No profile found, using fallback:', profileError.message);
            this.currentUser = {
                id: user.id,
                email: user.email,
                username: user.email.split('@')[0],
                plan: 'free',
                score: 0,
                solvedChallenges: [],
                createdAt: user.created_at
            };
        } else {
            this.currentUser = {
                id: user.id,
                email: user.email,
                username: profile.username || user.email.split('@')[0],
                plan: profile.plan || 'free',
                score: profile.score || 0,
                solvedChallenges: profile.solvedChallenges || [],
                createdAt: user.created_at
            };
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
