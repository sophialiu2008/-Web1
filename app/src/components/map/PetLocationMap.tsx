import { useRef, useEffect, useState } from 'react';
import MapContainer from '@/components/map/MapContainer';
import type { MapContainerRef } from '@/components/map/MapContainer';
import { Loader2 } from 'lucide-react';

interface PetLocationMapProps {
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    petName: string;
}

export default function PetLocationMap({ location, latitude, longitude, petName }: PetLocationMapProps) {
    const mapRef = useRef<MapContainerRef>(null);
    const [loading, setLoading] = useState(true);
    const [coords, setCoords] = useState<[number, number] | null>(
        latitude && longitude ? [longitude, latitude] : null
    );

    useEffect(() => {
        if (coords) {
            setLoading(false);
            return;
        }

        // Geocode the address text if no coordinates stored
        if (!location) {
            setLoading(false);
            return;
        }

        // Wait for the map to be ready, then geocode
        const timer = setTimeout(async () => {
            if (mapRef.current) {
                const result = await mapRef.current.geocode(location);
                if (result) {
                    setCoords([result.lng, result.lat]);
                    mapRef.current.setCenter([result.lng, result.lat], 14);
                    mapRef.current.addMarker([result.lng, result.lat], {
                        title: petName,
                        content: `<div style="padding:8px;font-size:14px;"><strong>${petName}</strong><br/><span style="color:#666;">${location}</span></div>`,
                    });
                }
            }
            setLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [location, coords, petName]);

    const markers = coords
        ? [
            {
                position: coords as [number, number],
                title: petName,
                content: `<div style="padding:8px;font-size:14px;"><strong>${petName}</strong><br/><span style="color:#666;">${location}</span></div>`,
            },
        ]
        : [];

    return (
        <div className="relative">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 rounded-xl">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="ml-2 text-sm text-gray-500">正在加载地图...</span>
                </div>
            )}
            <MapContainer
                ref={mapRef}
                center={coords || [116.397428, 39.90923]}
                zoom={coords ? 14 : 5}
                height="350px"
                markers={markers}
            />
        </div>
    );
}
