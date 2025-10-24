declare module "overlapping-marker-spiderfier-leaflet" {
  // Module side-effect only
}

// Déclaration globale pour window.OverlappingMarkerSpiderfier
declare global {
  interface Window {
    OverlappingMarkerSpiderfier: {
      new (
        map: any,
        options?: {
          keepSpiderfied?: boolean;
          nearbyDistance?: number;
          circleSpiralSwitchover?: number;
          spiralLengthStart?: number;
          spiralLengthFactor?: number;
          spiralFootSeparation?: number;
          circleFootSeparation?: number;
          maxCircleFootprints?: number;
          legWeight?: number;
          legColors?: {
            usual?: string;
            highlighted?: string;
          };
        }
      ): {
        addMarker(marker: any): void;
        removeMarker(marker: any): void;
        clearMarkers(): void;
        addListener(event: string, callback: (markers: any[]) => void): void;
        removeListener(event: string, callback: (markers: any[]) => void): void;
      };
    };
  }
}
