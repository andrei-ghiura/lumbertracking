import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000, // Optional: define a port for the dev server
  },
  // If you plan to deploy to a subfolder, you might need to set the base path:
  // base: '/your-app-base-path/',
});