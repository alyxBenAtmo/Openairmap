import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "crista-unlockable-vivan.ngrok-free.dev",
      "localhost",
      "127.0.0.1",
      ".ngrok-free.dev",
    ],
    proxy: {
      "/signalair": {
        target: "https://www.signalair.eu",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/signalair/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      "/aircarto": {
        target: "https://api.aircarto.fr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aircarto/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("aircarto proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Sending Request to AirCarto:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "Received Response from AirCarto:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
});
