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
  city?: string;
  bio?: string;
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
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
  isCompareOpen: boolean;

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
  setCompareOpen: (isOpen: boolean) => void;
  updateUser: (data: Partial<User>) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  setUser: (user: User) => void;
  setFavorites: (favs: string[]) => void;
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
      isCompareOpen: false,

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

      setFavorites: (favs) => set({ favorites: favs }),

      toggleFavorite: async (petId: string) => {
        const { favorites, user } = get();
        const strId = String(petId);
        const isFav = favorites.map(String).includes(strId);

        const newFavorites = isFav
          ? favorites.filter((id: string | number) => String(id) !== strId)
          : [...favorites, strId];
        set({ favorites: newFavorites });

        if (user?.id) {
          try {
            const { addFavorite, removeFavorite } = await import('@/services/api');
            if (isFav) {
              await removeFavorite(strId, user.id);
            } else {
              await addFavorite(strId, user.id);
            }
          } catch (error) {
            console.error('Failed to sync favorite', error);
            set({ favorites });
            toast.error('同步收藏状态失败');
          }
        }
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

      cancelBooking: async (id: string) => {
        try {
          const { cancelUserBooking } = await import('@/services/api');
          await cancelUserBooking(id);

          set((state: UserState) => ({
            bookings: state.bookings.map((booking: Booking) =>
              String(booking.id) === String(id) ? { ...booking, status: 'cancelled' as const } : booking
            )
          }));
          toast.success('已成功取消预约');
        } catch (error: any) {
          toast.error(error.message || '取消预约失败');
        }
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
      setCompareOpen: (isOpen: boolean) => set({ isCompareOpen: isOpen }),

      updateUser: (data: Partial<User>) => {
        set((state: UserState) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
