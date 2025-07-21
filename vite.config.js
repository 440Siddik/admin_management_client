import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Essential for React
import tailwindcss from '@tailwindcss/vite'; // Your Tailwind CSS plugin

export default defineConfig({
  plugins: [
    react(), // Always include this first for React projects
    tailwindcss(),
  ],
});