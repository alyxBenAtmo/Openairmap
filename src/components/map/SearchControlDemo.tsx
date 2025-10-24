import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "geoportal-extensions-leaflet";

// Déclaration de type pour l'extension Geoportal
declare module "leaflet" {
  namespace L {
    namespace geoportalControl {
      function SearchEngine(options?: any): any;
    }
  }
}

interface SearchControlDemoProps {
  center: [number, number];
  zoom: number;
}

const SearchControlDemo: React.FC<SearchControlDemoProps> = ({ center, zoom }) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      try {
        // Créer le contrôle de recherche IGN
        const searchCtrl = (L as any).geoportalControl.SearchEngine({
          placeholder: "Rechercher une adresse...",
          position: "topright",
          resultFormat: "json",
          maxResults: 5,
          style: {
            width: "300px",
            height: "40px",
          }
        });
        
        // Ajouter le contrôle à la carte
        searchCtrl.addTo(mapRef.current);
        
        // Fonction utilitaire pour déterminer le niveau de zoom optimal
        const getOptimalZoomLevel = (result: any): number => {
          const address = result.address || '';
          const name = result.name || '';
          const type = result.type || '';
          
          switch (type.toLowerCase()) {
            case 'house':
            case 'building':
            case 'address':
              return 18;
            case 'street':
            case 'road':
              return 16;
            case 'neighbourhood':
            case 'suburb':
            case 'district':
              return 14;
            case 'city':
            case 'town':
            case 'village':
              return 12;
            case 'county':
            case 'state':
            case 'department':
              return 10;
            case 'country':
            case 'region':
              return 6;
            default:
              if (address.match(/\d+/) || name.match(/\d+/)) {
                return 18;
              } else if (address.includes('rue') || address.includes('avenue') || 
                         address.includes('boulevard') || address.includes('place') ||
                         name.includes('rue') || name.includes('avenue') || 
                         name.includes('boulevard') || name.includes('place')) {
                return 16;
              } else if (address.includes('arrondissement') || address.includes('quartier') ||
                         name.includes('arrondissement') || name.includes('quartier')) {
                return 14;
              } else if (address.includes('commune') || name.includes('commune')) {
                return 12;
              } else {
                return 15;
              }
          }
        };

        // Écouter les résultats de recherche
        searchCtrl.on('search:locationfound', (e: any) => {
          console.log('Localisation trouvée:', e.location);
          if (mapRef.current) {
            const result = e.location;
            const zoomLevel = getOptimalZoomLevel(result);
            
            console.log(`Zoom adaptatif: niveau ${zoomLevel} pour "${result.name || result.address}" (type: ${result.type || 'non spécifié'})`);
            
            mapRef.current.setView([result.lat, result.lng], zoomLevel, {
              animate: true,
              duration: 1.5
            });
          }
        });

        // Gérer les erreurs de recherche
        searchCtrl.on('search:error', (e: any) => {
          console.warn('Erreur lors de la recherche:', e.error);
        });
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du contrôle de recherche IGN:', error);
      }
    }
  }, []);

  return (
    <div className="w-full h-96 border border-gray-300 rounded-lg">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};

export default SearchControlDemo;
