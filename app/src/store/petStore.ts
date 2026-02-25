import { create } from 'zustand';
import { fetchPets } from '@/services/api';
import { mapBackendPetToFrontend } from '@/utils/petMapper';
import type { BackendPet } from '@/utils/petMapper';
import type { Pet } from '@/data/pets';

interface PetState {
    pets: Pet[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number;
    fetchPets: (params?: any) => Promise<void>;
    invalidateCache: () => void;
}

export const usePetStore = create<PetState>((set, get) => ({
    pets: [],
    isLoading: false,
    error: null,
    lastFetched: 0,

    fetchPets: async (params = {}) => {
        // Basic cache: 30 seconds
        const now = Date.now();
        if (get().pets.length > 0 && now - get().lastFetched < 30000 && !params.force) {
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const response = await fetchPets(params);
            const backendPets = response.data as BackendPet[];
            const mappedPets = backendPets.map(mapBackendPetToFrontend);
            set({ pets: mappedPets, isLoading: false, lastFetched: now });
        } catch (err) {
            set({ error: '无法获取宠物数据', isLoading: false });
            console.error('Fetch pets error:', err);
        }
    },

    invalidateCache: () => {
        set({ lastFetched: 0 });
    }
}));
