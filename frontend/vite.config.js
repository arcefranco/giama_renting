import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  // Cargar variables del .env según el modo
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return defineConfig({
    plugins: [react()],
    base: env.VITE_BASENAME || "/",
  });
};
