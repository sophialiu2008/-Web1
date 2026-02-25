import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAMap } from './useAMap';

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
}

const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
    ({ center, zoom, height = '400px', className = '', onClick, markers, fitView: shouldFitView }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const {
            ready,
            addMarker,
            clearMarkers,
            setCenter,
            geocode,
            reverseGeocode,
            getUserLocation,
            fitView,
        } = useAMap(containerRef, { center, zoom, onClick });

        useImperativeHandle(ref, () => ({
            geocode,
            reverseGeocode,
            getUserLocation,
            setCenter,
            addMarker,
            clearMarkers,
        }));

        useEffect(() => {
            if (!ready || !markers) return;
            clearMarkers();
            markers.forEach((m) => {
                addMarker(m.position, { title: m.title, content: m.content });
            });
            if (shouldFitView && markers.length > 0) {
                setTimeout(() => fitView(), 100);
            }
        }, [ready, markers, shouldFitView, clearMarkers, addMarker, fitView]);

        return (
            <div
                ref={containerRef}
                className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}
                style={{ height, width: '100%' }}
            />
        );
    }
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
