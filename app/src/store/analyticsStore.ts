import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { postAnalyticsEvent, postPetView } from '@/services/api';

interface AnalyticsState {
  pageViews: Record<string, number>;
  petViews: Record<number, number>;
  searchQueries: string[];
  clickEvents: Array<{ type: string; id: string; timestamp: number }>;
  
  // Actions
  trackPageView: (page: string) => void;
  trackPetView: (petId: number) => void;
  trackSearch: (query: string) => void;
  trackClick: (type: string, id: string) => void;
  getPetViewCount: (petId: number) => number;
  getPopularPets: (limit?: number) => Array<{ petId: number; views: number }>;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      pageViews: {},
      petViews: {},
      searchQueries: [],
      clickEvents: [],

      trackPageView: (page) => {
        set((state) => ({
          pageViews: {
            ...state.pageViews,
            [page]: (state.pageViews[page] || 0) + 1
          }
        }));
      },

      trackPetView: (petId) => {
        set((state) => ({
          petViews: {
            ...state.petViews,
            [petId]: (state.petViews[petId] || 0) + 1
          }
        }));
        postPetView(petId);
      },

      trackSearch: (query) => {
        if (!query.trim()) return;
        set((state) => ({
          searchQueries: [query, ...state.searchQueries].slice(0, 100)
        }));
      },

      trackClick: (type, id) => {
        set((state) => ({
          clickEvents: [
            { type, id, timestamp: Date.now() },
            ...state.clickEvents
          ].slice(0, 500)
        }));
        postAnalyticsEvent(type, id);
      },

      getPetViewCount: (petId) => {
        return get().petViews[petId] || 0;
      },

      getPopularPets: (limit = 5) => {
        const { petViews } = get();
        return Object.entries(petViews)
          .map(([petId, views]) => ({ petId: Number(petId), views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, limit);
      },
    }),
    {
      name: 'analytics-storage',
    }
  )
);
