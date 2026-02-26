import { useRef, useEffect, useState } from 'react';
import MapContainer from '@/components/map/MapContainer';
import type { MapContainerRef } from '@/components/map/MapContainer';
import { Loader2, MapPin } from 'lucide-react';

interface PetLocationMapProps {
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    petName: string;
}

/** Known city center coordinates for fallback */
const CITY_CENTERS: Record<string, [number, number]> = {
    '北京': [116.397428, 39.90923],
    '上海': [121.473701, 31.230416],
    '广州': [113.264434, 23.129162],
    '深圳': [114.057868, 22.543099],
    '杭州': [120.15507, 30.274084],
    '南京': [118.796877, 32.060255],
    '成都': [104.065735, 30.659462],
    '武汉': [114.305393, 30.593099],
    '重庆': [106.551556, 29.563009],
    '西安': [108.939621, 34.343147],
    '天津': [117.190182, 39.125596],
    '苏州': [120.619585, 31.299379],
    '长沙': [112.982279, 28.19409],
    '郑州': [113.665412, 34.757975],
    '青岛': [120.355173, 36.082982],
    '大连': [121.618622, 38.91459],
    '厦门': [118.11022, 24.490474],
    '昆明': [102.712251, 25.040609],
    '合肥': [117.283042, 31.86119],
    '福州': [119.306239, 26.075302],
};

/**
 * Clean address string for geocoding.
 * Removes "市辖区" (invalid administrative placeholder) and normalizes whitespace.
 */
function formatAddress(address: string): string {
    return address
        .replace(/\s*市辖区\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Try to find a city center from the address string */
function getCityCenterFromAddress(address: string): [number, number] | null {
    for (const [city, center] of Object.entries(CITY_CENTERS)) {
        if (address.includes(city)) {
            return center;
        }
    }
    return null;
}

export default function PetLocationMap({ location, latitude, longitude, petName }: PetLocationMapProps) {
    const mapRef = useRef<MapContainerRef>(null);
    const [loading, setLoading] = useState(true);
    const [geocoded, setGeocoded] = useState(false);
    const [usedFallback, setUsedFallback] = useState(false);
    const coords: [number, number] | null =
        latitude && longitude ? [longitude, latitude] : null;

    const cleanLocation = formatAddress(location || '');

    // Poll for map ready state and then geocode if needed
    useEffect(() => {
        if (geocoded) return;

        // If we already have coordinates, mark as done
        if (coords) {
            setLoading(false);
            setGeocoded(true);
            return;
        }

        if (!cleanLocation) {
            setLoading(false);
            setGeocoded(true);
            return;
        }

        // Poll every 300ms until the map ref signals ready
        const interval = setInterval(async () => {
            const ref = mapRef.current;
            if (!ref) return;

            // If map has error, still show the map area (no error overlay from us)
            if (ref.error) {
                console.warn('PetLocationMap: MapContainer error:', ref.error);
                setLoading(false);
                setGeocoded(true);
                clearInterval(interval);
                return;
            }

            if (!ref.ready) return; // not ready yet, keep polling

            clearInterval(interval);
            console.log('PetLocationMap: map ready, geocoding address:', cleanLocation);

            // Try geocoding
            let positioned = false;
            try {
                let result = await ref.geocode(cleanLocation);
                console.log('PetLocationMap: geocode result for', cleanLocation, ':', result);

                // Fallback 1: try city name only
                if (!result && cleanLocation.includes(' ')) {
                    const cityName = cleanLocation.split(' ')[0];
                    console.log('PetLocationMap: fallback geocoding with city:', cityName);
                    result = await ref.geocode(cityName);
                }

                if (result) {
                    ref.setCenter([result.lng, result.lat], 14);
                    ref.addMarker([result.lng, result.lat], {
                        title: petName,
                        content: `<div style="padding:8px;font-size:14px;"><strong>${petName}</strong><br/><span style="color:#666;">${location}</span></div>`,
                    });
                    positioned = true;
                }
            } catch (err) {
                console.error('PetLocationMap: Geocode error:', err);
            }

            // Fallback 2: use known city center coordinates
            if (!positioned) {
                const cityCenter = getCityCenterFromAddress(cleanLocation);
                if (cityCenter) {
                    console.log('PetLocationMap: using city center fallback for', cleanLocation);
                    ref.setCenter(cityCenter, 11);
                    ref.addMarker(cityCenter, {
                        title: petName,
                        content: `<div style="padding:8px;font-size:14px;"><strong>${petName}</strong><br/><span style="color:#666;">${location}</span></div>`,
                    });
                    setUsedFallback(true);
                    positioned = true;
                }
            }

            // Fallback 3: default to Beijing
            if (!positioned) {
                console.log('PetLocationMap: using default center (Beijing)');
                ref.setCenter([116.397428, 39.90923], 5);
                setUsedFallback(true);
            }

            setLoading(false);
            setGeocoded(true);
        }, 300);

        return () => clearInterval(interval);
    }, [cleanLocation, coords, petName, geocoded, location]);

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
            {usedFallback && !loading && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <MapPin className="w-3 h-3" />
                    <span>已定位到 {cleanLocation.split(' ')[0]} 城市中心（精确地址解析未成功）</span>
                </div>
            )}
        </div>
    );
}
