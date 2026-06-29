import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "tteonalite",
  brand: {
    displayName: "떠나·라이트",
    primaryColor: "#FF6B35",
    icon: "https://static.toss.im/appsintoss/43107/5c89de61-5a5b-4c58-93b7-043ba37f0e3f.png",
  },
  web: {
    host: "0.0.0.0",
    port: 5175,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [
    { name: "geolocation", access: "access" },
    { name: "camera", access: "access" },
    { name: "photos", access: "read" },
  ],
  outdir: "dist",
});
