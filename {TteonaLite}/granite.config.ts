import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "tteonalite", // AIT 콘솔 등록 후 실제 appName으로 변경
  brand: {
    displayName: "떠나라이트",
    primaryColor: "#FF6B35",
    icon: "", // AIT 콘솔 등록 후 아이콘 URL 추가
  },
  web: {
    host: "172.30.1.38",
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
