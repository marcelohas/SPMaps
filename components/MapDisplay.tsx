import React, { useEffect, useRef, useState } from 'react';
import { GeoLocation, HistoricalPlace } from '../types';

interface MapDisplayProps {
  userLocation: GeoLocation | null;
  places: HistoricalPlace[];
  onSelectPlace: (place: HistoricalPlace) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const MapDisplay: React.FC<MapDisplayProps> = ({ userLocation, places, onSelectPlace }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const googleMapRef = useRef<any>(null);
  if (window.google && window.google.maps) {
    setMapLoaded(true);
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
  script.async = true;
  script.defer = true;

  script.onload = () => {
    setMapLoaded(true);
  };

  document.head.appendChild(script);
}, [apiKey]);

// Initialize Map
useEffect(() => {
  if (mapLoaded && mapRef.current && !googleMapRef.current) {
    const initialLat = userLocation ? userLocation.lat : -23.5505;
    const initialLng = userLocation ? userLocation.lng : -46.6333;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 17,
      disableDefaultUI: true, // Cleaner interface for driving
      zoomControl: false,
      mapId: "DEMO_MAP_ID",
      heading: 0,
      tilt: 0,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [
            { "visibility": "off" }
          ]
        }
      ]
    });

    // Add Traffic Layer
    const trafficLayer = new window.google.maps.TrafficLayer();
    trafficLayer.setMap(googleMapRef.current);

    // Initialize Directions
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: googleMapRef.current,
      suppressMarkers: false, // Let Google show A/B markers
      polylineOptions: {
        strokeColor: "#4285F4",
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    // Initialize Search Box
    if (inputRef.current) {
      searchBoxRef.current = new window.google.maps.places.SearchBox(inputRef.current);
      // Bias the SearchBox results towards current map's viewport.
      googleMapRef.current.addListener("bounds_changed", () => {
        searchBoxRef.current.setBounds(googleMapRef.current.getBounds());
      });

      searchBoxRef.current.addListener("places_changed", () => {
        const places = searchBoxRef.current.getPlaces();
        if (!places || places.length === 0) {
        }
      }
}, [mapLoaded]);

const calculateRoute = (destinationParam: any) => {
  if (!userLocation || !directionsServiceRef.current) return;

  const origin = { lat: userLocation.lat, lng: userLocation.lng };

  directionsServiceRef.current.route(
    {
      origin: origin,
      destination: destinationParam,
      travelMode: window.google.maps.TravelMode.DRIVING,
    },
    (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
      } else {
        console.error("Directions request failed due to " + status);
      }
    }
  );
};

// Update User Location & Heading
useEffect(() => {
  if (!googleMapRef.current || !userLocation || !window.google) return;

  const pos = { lat: userLocation.lat, lng: userLocation.lng };

  if (!userMarkerRef.current) {
    // Create a navigation arrow for user
    const icon = {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      rotation: userLocation.heading || 0
    };

    userMarkerRef.current = new window.google.maps.Marker({
      position: pos,
      map: googleMapRef.current,
      icon: icon,
      title: "Você está aqui",
      zIndex: 999
    });
  } else {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    places.forEach(place => {
      const marker = new window.google.maps.Marker({
        position: { lat: place.location.lat, lng: place.location.lng },
        map: googleMapRef.current,
        title: place.title,
        label: {
          text: "🏛️",
          fontFamily: "Material Icons",
          fontSize: "24px",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: "#d4af37", // History Gold
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          labelOrigin: new window.google.maps.Point(0, 0)
        }
      });

      marker.addListener("click", () => {
        onSelectPlace(place);
      });

      markersRef.current.push(marker);
    });
  }, [places, onSelectPlace]);

if (!apiKey) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">Mapa indisponível (Chave não configurada)</p>
    </div>
  );
}

return (
  <div className="relative w-full h-full">
    {/* Navigation Search Bar */}
    <div className="absolute top-28 left-4 right-16 z-10 pointer-events-auto">
      <input
        ref={inputRef}
        type="text"
        placeholder="Para onde vamos? (Navegação GPS)"
        className="w-full h-12 px-4 rounded-xl shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-lg bg-white/95 backdrop-blur"
      />
    </div>

    {/* Map Container */}
    <div ref={mapRef} className="w-full h-full" />
  </div>
);
};

export default MapDisplay;