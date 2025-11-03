import "leaflet";

declare module "leaflet" {
  namespace L {
    namespace Velocity {
      interface VelocityLayerOptions {
        displayValues?: boolean;
        displayOptions?: boolean;
        velocityScale?: number;
        colorScale?: string[];
        minVelocity?: number;
        maxVelocity?: number;
        lineWidth?: number;
        data?: any;
        overlayName?: string;
      }
    }

    function velocityLayer(options?: L.Velocity.VelocityLayerOptions): L.Layer;
  }
}

