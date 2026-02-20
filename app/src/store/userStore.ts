import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface AdoptionApplication {
  id: string;
  petId: number;
  petName: string;
  status: 'pending' | 'reviewing' | 'home_visit' | 'approved' | 'completed' | 'rejected';
  submitDate: string;
  updateDate: string;
  notes?: string;
}

export interface Booking {
  id: string;
  petId: number;
  petName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  accessExpiresAt?: number | null;
  favorites: number[];
  applications: AdoptionApplication[];
  bookings: Booking[];
  compareList: number[];

  // Actions
  login: (user: User, tokens?: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  logout: () => void;
  setTokens: (t: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  toggleFavorite: (petId: number) => void;
  addApplication: (application: AdoptionApplication) => void;
  updateApplicationStatus: (id: string, status: AdoptionApplication['status']) => void;
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
  setApplications: (apps: AdoptionApplication[]) => void;
  setBookings: (bks: Booking[]) => void;
  addToCompare: (petId: number) => void;
  removeFromCompare: (petId: number) => void;
  clearCompare: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      favorites: [],
      applications: [],
      bookings: [],
      compareList: [],

      login: (user, tokens) => set({
        user,
        isLoggedIn: true,
        accessToken: tokens?.accessToken ?? get().accessToken ?? null,
        refreshToken: tokens?.refreshToken ?? get().refreshToken ?? null,
        accessExpiresAt: tokens ? Date.now() + tokens.expiresIn * 1000 : get().accessExpiresAt ?? null
      }),

      logout: () => set({ user: null, isLoggedIn: false, accessToken: null, refreshToken: null, accessExpiresAt: null, favorites: [], applications: [], bookings: [] }),

      setTokens: (t) => set({ accessToken: t.accessToken, refreshToken: t.refreshToken, accessExpiresAt: Date.now() + t.expiresIn * 1000 }),

      toggleFavorite: (petId) => {
        const { favorites } = get();
        const newFavorites = favorites.includes(petId)
          ? favorites.filter(id => id !== petId)
          : [...favorites, petId];
        set({ favorites: newFavorites });
      },

      addApplication: (application) => {
        set((state) => ({
          applications: [application, ...state.applications]
        }));
      },

      updateApplicationStatus: (id, status) => {
        set((state) => ({
          applications: state.applications.map(app =>
            app.id === id ? { ...app, status, updateDate: new Date().toISOString() } : app
          )
        }));
      },

      addBooking: (booking) => {
        set((state) => ({
          bookings: [booking, ...state.bookings]
        }));
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map(booking =>
            booking.id === id ? { ...booking, status: 'cancelled' as const } : booking
          )
        }));
      },

      setApplications: (apps) => set({ applications: apps }),
      setBookings: (bks) => set({ bookings: bks }),

      addToCompare: (petId) => {
        const { compareList } = get();
        if (compareList.length >= 3) {
          alert('最多只能对比3只宠物');
          return;
        }
        if (!compareList.includes(petId)) {
          set({ compareList: [...compareList, petId] });
        }
      },

      removeFromCompare: (petId) => {
        set((state) => ({
          compareList: state.compareList.filter(id => id !== petId)
        }));
      },

      clearCompare: () => set({ compareList: [] }),
    }),
    {
      name: 'user-storage',
    }
  )
);
