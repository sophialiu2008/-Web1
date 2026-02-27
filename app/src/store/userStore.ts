import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: string;
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
  favorites: (number | string)[];
  applications: AdoptionApplication[];
  bookings: Booking[];
  compareList: (number | string)[];

  // Actions
  login: (user: User, tokens?: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  logout: () => void;
  setTokens: (t: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  toggleFavorite: (petId: string) => void;
  addApplication: (application: AdoptionApplication) => void;
  updateApplicationStatus: (id: string, status: AdoptionApplication['status']) => void;
  addBooking: (booking: Booking) => void;
  cancelBooking: (id: string) => void;
  setApplications: (apps: AdoptionApplication[]) => void;
  setBookings: (bks: Booking[]) => void;
  addToCompare: (petId: string) => void;
  removeFromCompare: (petId: string) => void;
  clearCompare: () => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  setUser: (user: User) => void;
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

      clearAuth: () => set({ user: null, isLoggedIn: false, accessToken: null, refreshToken: null, accessExpiresAt: null }),

      isAdmin: () => get().user?.role === 'admin',

      setUser: (user) => set({ user }),

      setTokens: (t) => set({ accessToken: t.accessToken, refreshToken: t.refreshToken, accessExpiresAt: Date.now() + t.expiresIn * 1000 }),

      toggleFavorite: (petId: string) => {
        const { favorites } = get();
        // ensure string comparison
        const strId = String(petId);
        const newFavorites = favorites.map(String).includes(strId)
          ? favorites.filter((id: string | number) => String(id) !== strId)
          : [...favorites, strId];
        set({ favorites: newFavorites });
      },

      addApplication: (application: AdoptionApplication) => {
        set((state: UserState) => ({
          applications: [application, ...state.applications]
        }));
      },

      updateApplicationStatus: (id: string, status: AdoptionApplication['status']) => {
        set((state: UserState) => ({
          applications: state.applications.map((app: AdoptionApplication) =>
            app.id === id ? { ...app, status, updateDate: new Date().toISOString() } : app
          )
        }));
      },

      addBooking: (booking: Booking) => {
        set((state: UserState) => ({
          bookings: [booking, ...state.bookings]
        }));
      },

      cancelBooking: (id: string) => {
        set((state: UserState) => ({
          bookings: state.bookings.map((booking: Booking) =>
            booking.id === id ? { ...booking, status: 'cancelled' as const } : booking
          )
        }));
      },

      setApplications: (apps: AdoptionApplication[]) => set({ applications: apps }),
      setBookings: (bks: Booking[]) => set({ bookings: bks }),

      addToCompare: (petId: string) => {
        const { compareList } = get();
        if (compareList.length >= 3) {
          toast.error('最多只能对比3只宠物');
          return;
        }
        const strId = String(petId);
        if (!compareList.map(String).includes(strId)) {
          set({ compareList: [...compareList, strId] });
        }
      },

      removeFromCompare: (petId: string) => {
        const strId = String(petId);
        set((state: UserState) => ({
          compareList: state.compareList.filter((id: string | number) => String(id) !== strId)
        }));
      },

      clearCompare: () => set({ compareList: [] }),
    }),
    {
      name: 'user-storage',
    }
  )
);
