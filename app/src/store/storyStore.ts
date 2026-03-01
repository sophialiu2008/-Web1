import { create } from 'zustand';
import { useUserStore } from './userStore';

export interface Story {
    id: string | number;
    petName: string;
    petType: string;
    adopterName: string;
    location: string;
    date: string;
    image: string;
    avatar: string;
    rating: number;
    title: string;
    content: string;
    fullStory: string;
}

interface StoryState {
    stories: Story[];
    isLoading: boolean;
    totalCount: number;
    fetchStories: () => Promise<void>;
    createStory: (payload: any) => Promise<{ success: boolean; error?: string }>;
    fetchMyAdoptions: () => Promise<any[]>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
    stories: [],
    isLoading: false,
    totalCount: 0,

    fetchStories: async () => {
        set({ isLoading: true });
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/api/stories`);
            const data = await response.json();
            if (data.data) {
                set({
                    stories: data.data.map((item: any) => ({
                        id: item.id,
                        petName: item.pet_name,
                        petType: item.pet_type,
                        adopterName: item.adopter_name,
                        location: item.location,
                        date: new Date(item.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
                        image: item.images?.[0] || '/images/default-pet.jpg',
                        avatar: item.avatar || '/images/default-avatar.jpg',
                        rating: item.rating,
                        title: item.title,
                        content: item.content,
                        fullStory: item.full_story
                    })),
                    totalCount: data.total || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch stories:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createStory: async (payload: any) => {
        const user = useUserStore.getState().user;
        if (!user) return { success: false, error: '请先登录' };

        payload.user_id = user.id;
        payload.adopter_name = user.name || '爱心人士';

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8789'}/api/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${useUserStore.getState().accessToken}`
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (response.ok) {
                await get().fetchStories(); // Refresh list
                return { success: true };
            } else {
                return { success: false, error: result.error || '提交失败' };
            }
        } catch (error) {
            return { success: false, error: '网络错误，请稍后重试' };
        }
    },

    fetchMyAdoptions: async () => {
        const user = useUserStore.getState().user;
        if (!user) return [];

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/api/my-adoptions?user_id=${user.id}`);
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch my adoptions:', error);
            return [];
        }
    }
}));
