import { useEffect, useRef, useState, useCallback } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';

let _AMap: any = null;
let _loading: Promise<any> | null = null;

function loadAMap(): Promise<any> {
    if (_AMap) return Promise.resolve(_AMap);
    if (_loading) return _loading;
    _loading = AMapLoader.load({
        key: import.meta.env.VITE_AMAP_KEY || '',
        version: '2.0',
        plugins: ['AMap.Geocoder', 'AMap.Geolocation', 'AMap.PlaceSearch', 'AMap.InfoWindow'],
    }).then((AMap: any) => {
        _AMap = AMap;
        return AMap;
    });
    return _loading;
}

export function useAMap(
    containerRef: React.RefObject<HTMLDivElement | null>,
    options?: {
        center?: [number, number];
        zoom?: number;
        onClick?: (lnglat: { lng: number; lat: number }) => void;
    }
) {
    const mapRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const [AMap, setAMap] = useState<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        let destroyed = false;

        loadAMap().then((AMapClass) => {
            if (destroyed || !containerRef.current) return;
            const map = new AMapClass.Map(containerRef.current, {
                zoom: options?.zoom || 12,
                center: options?.center || [116.397428, 39.90923],
                viewMode: '2D',
                resizeEnable: true,
            });
            mapRef.current = map;
            setAMap(AMapClass);
            setReady(true);

            if (options?.onClick) {
                map.on('click', (e: any) => {
                    options.onClick?.({ lng: e.lnglat.getLng(), lat: e.lnglat.getLat() });
                });
            }
        });

        return () => {
            destroyed = true;
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef.current]);

    const addMarker = useCallback(
        (position: [number, number], opts?: { title?: string; content?: string; icon?: string }) => {
            if (!mapRef.current || !AMap) return null;
            const marker = new AMap.Marker({
                position: new AMap.LngLat(position[0], position[1]),
                title: opts?.title || '',
            });
            mapRef.current.add(marker);

            if (opts?.content) {
                const infoWindow = new AMap.InfoWindow({
                    content: opts.content,
                    offset: new AMap.Pixel(0, -30),
                });
                marker.on('click', () => {
                    infoWindow.open(mapRef.current, marker.getPosition());
                });
            }

            return marker;
        },
        [AMap]
    );

    const clearMarkers = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.clearMap();
        }
    }, []);

    const setCenter = useCallback(
        (center: [number, number], zoom?: number) => {
            if (mapRef.current) {
                mapRef.current.setCenter(center);
                if (zoom) mapRef.current.setZoom(zoom);
            }
        },
        []
    );

    const geocode = useCallback(
        (address: string): Promise<{ lng: number; lat: number } | null> => {
            if (!AMap) return Promise.resolve(null);
            return new Promise((resolve) => {
                const geocoder = new AMap.Geocoder();
                geocoder.getLocation(address, (status: string, result: any) => {
                    if (status === 'complete' && result.geocodes?.length > 0) {
                        const { lng, lat } = result.geocodes[0].location;
                        resolve({ lng, lat });
                    } else {
                        resolve(null);
                    }
                });
            });
        },
        [AMap]
    );

    const reverseGeocode = useCallback(
        (lnglat: [number, number]): Promise<{
            province: string;
            city: string;
            district: string;
            address: string;
        } | null> => {
            if (!AMap) return Promise.resolve(null);
            return new Promise((resolve) => {
                const geocoder = new AMap.Geocoder();
                geocoder.getAddress(lnglat, (status: string, result: any) => {
                    if (status === 'complete' && result.regeocode) {
                        const addr = result.regeocode.addressComponent;
                        resolve({
                            province: addr.province || '',
                            city: addr.city || addr.province || '',
                            district: addr.district || '',
                            address: result.regeocode.formattedAddress || '',
                        });
                    } else {
                        resolve(null);
                    }
                });
            });
        },
        [AMap]
    );

    const getUserLocation = useCallback((): Promise<{ lng: number; lat: number } | null> => {
        if (!AMap) return Promise.resolve(null);
        return new Promise((resolve) => {
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
            });
            geolocation.getCurrentPosition((status: string, result: any) => {
                if (status === 'complete') {
                    resolve({ lng: result.position.lng, lat: result.position.lat });
                } else {
                    resolve(null);
                }
            });
        });
    }, [AMap]);

    const fitView = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.setFitView();
        }
    }, []);

    return {
        map: mapRef,
        AMap,
        ready,
        addMarker,
        clearMarkers,
        setCenter,
        geocode,
        reverseGeocode,
        getUserLocation,
        fitView,
    };
}
