import { create } from 'zustand';
import { fetchPublicStats } from '@/services/api';

interface StatsState {
    successfulAdoptions: number;
    totalPets: number;
    totalStories: number;
    satisfactionRate: number;
    isLoading: boolean;
    error: string | null;
    lastFetched: number;
    fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
    successfulAdoptions: 0,
    totalPets: 0,
    totalStories: 0,
    satisfactionRate: 98,
    isLoading: false,
    error: null,
    lastFetched: 0,

    fetchStats: async () => {
        // Cache for 60 seconds
        const now = Date.now();
        if (now - get().lastFetched < 60000 && !get().error) {
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const data = await fetchPublicStats();
            set({
                successfulAdoptions: data.successfulAdoptions || 0,
                totalPets: data.totalPets || 0,
                totalStories: data.totalStories || 0,
                satisfactionRate: data.satisfactionRate || 98,
                isLoading: false,
                lastFetched: now,
            });
        } catch (err: any) {
            console.error('Failed to fetch public stats:', err);
            set({ error: err.message, isLoading: false });
        }
    },
}));
