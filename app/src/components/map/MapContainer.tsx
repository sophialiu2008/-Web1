import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAMap } from './useAMap';
import { Loader2, AlertTriangle } from 'lucide-react';

export interface MapContainerProps {
    center?: [number, number];
    zoom?: number;
    height?: string;
    className?: string;
    onClick?: (lnglat: { lng: number; lat: number }) => void;
    markers?: Array<{
        position: [number, number];
        title?: string;
        content?: string;
    }>;
    fitView?: boolean;
}

export interface MapContainerRef {
    geocode: (address: string) => Promise<{ lng: number; lat: number } | null>;
    reverseGeocode: (lnglat: [number, number]) => Promise<{
        province: string;
        city: string;
        district: string;
        address: string;
    } | null>;
    getUserLocation: () => Promise<{ lng: number; lat: number } | null>;
    setCenter: (center: [number, number], zoom?: number) => void;
    addMarker: (position: [number, number], opts?: { title?: string; content?: string }) => any;
    clearMarkers: () => void;
    ready: boolean;
    error: string | null;
}

const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
    ({ center, zoom, height = '400px', className = '', onClick, markers, fitView: shouldFitView }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const {
            ready,
            error,
            addMarker,
            clearMarkers,
            setCenter,
            geocode,
            reverseGeocode,
            getUserLocation,
            fitView,
            resize,
        } = useAMap(containerRef, { center, zoom, onClick });

        useImperativeHandle(ref, () => ({
            geocode,
            reverseGeocode,
            getUserLocation,
            setCenter,
            addMarker,
            clearMarkers,
            ready,
            error,
        }), [geocode, reverseGeocode, getUserLocation, setCenter, addMarker, clearMarkers, ready, error]);

        useEffect(() => {
            if (!ready || !markers) return;
            clearMarkers();
            markers.forEach((m) => {
                addMarker(m.position, { title: m.title, content: m.content });
            });
            if (shouldFitView && markers.length > 0) {
                setTimeout(() => {
                    fitView();
                    resize();
                }, 100);
            }
        }, [ready, markers, shouldFitView, clearMarkers, addMarker, fitView, resize]);

        return (
            <div className="relative" style={{ height, width: '100%' }}>
                <div
                    ref={containerRef}
                    className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}
                    style={{ height: '100%', width: '100%' }}
                />
                {!ready && !error && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 rounded-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        <span className="ml-2 text-sm text-gray-500">正在加载地图...</span>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                        <AlertTriangle className="w-8 h-8 text-orange-400 mb-2" />
                        <span className="text-sm text-gray-600">{error}</span>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-3 px-4 py-1.5 text-sm bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                        >
                            刷新重试
                        </button>
                    </div>
                )}
            </div>
        );
    }
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
