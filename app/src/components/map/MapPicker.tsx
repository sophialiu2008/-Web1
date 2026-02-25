import { useRef, useState, useCallback, useEffect } from 'react';
import { useAMap } from './useAMap';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapPickerProps {
    onLocationSelect: (location: {
        province: string;
        city: string;
        district: string;
        address: string;
        lng: number;
        lat: number;
    }) => void;
    initialCenter?: [number, number];
    initialAddress?: string;
    height?: string;
}

export default function MapPicker({
    onLocationSelect,
    initialCenter,
    initialAddress,
    height = '300px',
}: MapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<any>(null);
    const [address, setAddress] = useState(initialAddress || '');
    const [locating, setLocating] = useState(false);

    const handleClick = useCallback(
        async (lnglat: { lng: number; lat: number }) => {
            if (!reverseGeocode || !AMap) return;
            // Update marker
            if (markerRef.current) {
                markerRef.current.setPosition(new AMap.LngLat(lnglat.lng, lnglat.lat));
            } else {
                markerRef.current = addMarker([lnglat.lng, lnglat.lat], { title: '选择位置' });
            }

            const result = await reverseGeocode([lnglat.lng, lnglat.lat]);
            if (result) {
                setAddress(result.address);
                onLocationSelect({
                    ...result,
                    lng: lnglat.lng,
                    lat: lnglat.lat,
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const {
        ready,
        AMap,
        addMarker,
        reverseGeocode,
        geocode,
        getUserLocation,
        setCenter,
    } = useAMap(containerRef, {
        center: initialCenter || [116.397428, 39.90923],
        zoom: 13,
        onClick: handleClick,
    });

    // Reassign the callback refs after hook is ready
    useEffect(() => {
        if (!ready) return;
        // Update the handleClick closure
    }, [ready]);

    const handleLocateMe = async () => {
        setLocating(true);
        try {
            // Try browser geolocation first
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const lnglat = { lng: pos.coords.longitude, lat: pos.coords.latitude };
                        setCenter([lnglat.lng, lnglat.lat], 15);

                        if (markerRef.current && AMap) {
                            markerRef.current.setPosition(new AMap.LngLat(lnglat.lng, lnglat.lat));
                        } else {
                            markerRef.current = addMarker([lnglat.lng, lnglat.lat], { title: '我的位置' });
                        }

                        const result = await reverseGeocode([lnglat.lng, lnglat.lat]);
                        if (result) {
                            setAddress(result.address);
                            onLocationSelect({ ...result, lng: lnglat.lng, lat: lnglat.lat });
                        }
                        setLocating(false);
                    },
                    async () => {
                        // Fallback to AMap geolocation
                        const loc = await getUserLocation();
                        if (loc) {
                            setCenter([loc.lng, loc.lat], 15);
                            if (markerRef.current && AMap) {
                                markerRef.current.setPosition(new AMap.LngLat(loc.lng, loc.lat));
                            } else {
                                markerRef.current = addMarker([loc.lng, loc.lat], { title: '我的位置' });
                            }
                            const result = await reverseGeocode([loc.lng, loc.lat]);
                            if (result) {
                                setAddress(result.address);
                                onLocationSelect({ ...result, lng: loc.lng, lat: loc.lat });
                            }
                        }
                        setLocating(false);
                    },
                    { timeout: 8000 }
                );
            } else {
                const loc = await getUserLocation();
                if (loc) {
                    setCenter([loc.lng, loc.lat], 15);
                    const result = await reverseGeocode([loc.lng, loc.lat]);
                    if (result) {
                        setAddress(result.address);
                        onLocationSelect({ ...result, lng: loc.lng, lat: loc.lat });
                    }
                }
                setLocating(false);
            }
        } catch {
            setLocating(false);
        }
    };

    const handleSearchAddress = async () => {
        if (!address.trim() || !geocode) return;
        const result = await geocode(address.trim());
        if (result) {
            setCenter([result.lng, result.lat], 15);
            if (markerRef.current && AMap) {
                markerRef.current.setPosition(new AMap.LngLat(result.lng, result.lat));
            } else {
                markerRef.current = addMarker([result.lng, result.lat], { title: address });
            }
            const addrInfo = await reverseGeocode([result.lng, result.lat]);
            if (addrInfo) {
                onLocationSelect({ ...addrInfo, lng: result.lng, lat: result.lat });
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                        placeholder="输入地址搜索，或在地图上点选位置"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSearchAddress}
                    className="shrink-0"
                >
                    搜索
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocateMe}
                    disabled={locating || !ready}
                    className="shrink-0"
                >
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                </Button>
            </div>
            <div
                ref={containerRef}
                className="rounded-xl overflow-hidden border border-gray-200"
                style={{ height, width: '100%' }}
            />
            {address && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {address}
                </p>
            )}
        </div>
    );
}
