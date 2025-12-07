import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { GeoLocation, HistoricalPlace } from '../types';

interface MapDisplayProps {
  userLocation: GeoLocation | null;
  places: HistoricalPlace[];
  onSelectPlace: (place: HistoricalPlace) => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ userLocation, places, onSelectPlace }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      const initialLat = userLocation ? userLocation.lat : -23.5505;
      const initialLng = userLocation ? userLocation.lng : -46.6333;

      // Create map with OpenStreetMap tiles
      leafletMapRef.current = L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
      });

      // Add OpenStreetMap tiles (free, no API key needed!)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(leafletMapRef.current);

      // Add zoom control to top right
      L.control.zoom({ position: 'topright' }).addTo(leafletMapRef.current);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation) return;

    const pos: L.LatLngExpression = [userLocation.lat, userLocation.lng];

    if (!userMarkerRef.current) {
      // Create custom user marker (blue dot)
      const userIcon = L.divIcon({
        className: 'user-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      userMarkerRef.current = L.marker(pos, { icon: userIcon })
        .addTo(leafletMapRef.current)
        .bindPopup('Você está aqui');
    } else {
      // Update position
      userMarkerRef.current.setLatLng(pos);
    }

    // Center map on user (smooth pan)
    leafletMapRef.current.panTo(pos);
  }, [userLocation]);

  // Update Historical Place Markers
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for historical places
    places.forEach(place => {
      const placeIcon = L.divIcon({
        className: 'place-marker',
        html: '🏛️',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([place.location.lat, place.location.lng], { icon: placeIcon })
        .addTo(leafletMapRef.current!)
        .bindPopup(`<strong>${place.title}</strong><br>${place.description || ''}`);

      marker.on('click', () => {
        onSelectPlace(place);
        // Calculate route when marker is clicked
        if (userLocation) {
          calculateRoute([userLocation.lat, userLocation.lng], [place.location.lat, place.location.lng]);
        }
      });

      markersRef.current.push(marker);
    });
  }, [places, onSelectPlace, userLocation]);

  // Calculate Route using Leaflet Routing Machine
  const calculateRoute = (start: L.LatLngExpression, end: L.LatLngExpression) => {
    if (!leafletMapRef.current) return;

    // Remove existing route
    if (routingControlRef.current) {
      leafletMapRef.current.removeControl(routingControlRef.current);
    }

    // Create new route
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(start as [number, number]),
        L.latLng(end as [number, number])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#4285F4', weight: 6, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false, // Hide the instruction panel
      createMarker: () => null, // Don't create default markers
    }).addTo(leafletMapRef.current);
  };

  // Address Search using Nominatim (OpenStreetMap's free geocoding service)
  const handleSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce search (Nominatim has rate limit of 1 req/sec)
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `limit=5&` +
          `countrycodes=br&` +
          `viewbox=-46.826,-23.357,-46.365,-23.796&` + // São Paulo bounding box
          `bounded=1`
        );

        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 1000); // 1 second debounce to respect rate limits

    setSearchTimeout(timeout);
  };

  // Handle search result selection
  const handleSelectResult = (result: any) => {
    if (!leafletMapRef.current || !userLocation) return;

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Pan to location
    leafletMapRef.current.setView([lat, lng], 17);

    // Calculate route
    calculateRoute([userLocation.lat, userLocation.lng], [lat, lng]);

    // Clear search
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.value = result.display_name;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 pointer-events-auto">
        <input
          ref={inputRef}
          type="text"
          placeholder="Para onde vamos? (Busca por endereço)"
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="w-full h-12 px-4 rounded-xl shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-lg bg-white/95 backdrop-blur"
        />

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-xl max-h-64 overflow-y-auto z-20">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelectResult(result)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <p className="text-sm font-medium text-gray-900">{result.display_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Attribution Notice */}
      <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600 pointer-events-none z-10">
        Mapas: OpenStreetMap | Rotas: OSRM
      </div>
    </div>
  );
};

export default MapDisplay;