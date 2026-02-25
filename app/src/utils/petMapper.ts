import type { Pet } from '@/data/pets';

export interface BackendPet {
    id: string;
    name: string;
    category: string;
    breed?: string | null;
    age_years?: number | null;
    gender?: string | null;
    province?: string | null;
    city?: string | null;
    district?: string | null;
    description?: string | null;
    images?: string[] | null;
    personality_tags?: string[] | null;
    personality_traits?: string[] | null;
    suitable_for?: string[] | null;
    is_vaccinated?: boolean | null;
    is_neutered?: boolean | null;
    view_count?: number | null;
    created_at?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    distance?: number | null;
}

export function mapBackendPetToFrontend(remotePet: BackendPet): Pet {
    return {
        id: remotePet.id as any, // Cast to any as frontend expects number but backend provides UUID string or ID
        name: remotePet.name,
        type: remotePet.category === '狗狗' ? 'dog' : remotePet.category === '猫咪' ? 'cat' : 'other' as any,
        breed: remotePet.breed || '',
        age: remotePet.age_years !== null && remotePet.age_years !== undefined ? `${remotePet.age_years}岁` : '年龄未知',
        gender: remotePet.gender === '公' ? 'male' : remotePet.gender === '母' ? 'female' : 'male', // Default to male if unknown
        location: [remotePet.province, remotePet.city, remotePet.district].filter(Boolean).join(' '),
        image: remotePet.images?.[0] || '/images/cat-orange.jpg', // Fallback
        images: remotePet.images || [],
        tags: remotePet.personality_tags || [],
        description: remotePet.description || '',
        fullDescription: remotePet.description || '',
        vaccinated: !!remotePet.is_vaccinated,
        neutered: !!remotePet.is_neutered,
        personality: remotePet.personality_traits || [],
        suitableFor: remotePet.suitable_for || [],
        views: remotePet.view_count || 0,
        healthRecords: [],
        arrivalDate: remotePet.created_at || new Date().toISOString(),
        latitude: remotePet.latitude ?? null,
        longitude: remotePet.longitude ?? null,
        distance: remotePet.distance ?? null,
    };
}
