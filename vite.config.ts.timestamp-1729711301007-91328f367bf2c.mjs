// vite.config.ts
import path from "path";
import react from "file:///Users/drolya/Sites/budget/app-v2/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { visualizer } from "file:///Users/drolya/Sites/budget/app-v2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { VitePWA } from "file:///Users/drolya/Sites/budget/app-v2/node_modules/vite-plugin-pwa/dist/index.js";
import { configDefaults, defineConfig } from "file:///Users/drolya/Sites/budget/app-v2/node_modules/vitest/dist/config.js";
var __vite_injected_original_dirname = "/Users/drolya/Sites/budget/app-v2";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }),
    // This will open a visualization of your chunks after build
    VitePWA()
    // pwaOptions was mentioned but not defined in your snippet
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.tsx",
    coverage: {
      reporter: ["text", "json", "html"],
      // Coverage output formats
      all: true,
      // Include all files in coverage, even if not tested
      include: ["src/**/*.ts", "src/**/*.tsx"],
      // Only include source files
      exclude: ["node_modules", "dist", "__tests__", "src/setupTests.ts"]
      // Exclude tests and setup
    },
    include: ["__tests__/**/*.spec.ts", "__tests__/**/*.spec.tsx"],
    // Include only test files
    exclude: [...configDefaults.exclude]
    // Use default excludes from Vitest
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZHJvbHlhL1NpdGVzL2J1ZGdldC9hcHAtdjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kcm9seWEvU2l0ZXMvYnVkZ2V0L2FwcC12Mi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZHJvbHlhL1NpdGVzL2J1ZGdldC9hcHAtdjIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuaW1wb3J0IHsgVml0ZVBXQSwgVml0ZVBXQU9wdGlvbnMgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xuaW1wb3J0IHsgY29uZmlnRGVmYXVsdHMsIGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVzdC9jb25maWcnO1xuXG5jb25zdCBwd2FPcHRpb25zOiBQYXJ0aWFsPFZpdGVQV0FPcHRpb25zPiA9IHtcbiAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnbWFza2VkLWljb24uc3ZnJ10sXG4gIG1hbmlmZXN0OiB7XG4gICAgbmFtZTogJ0ZpbmFuY2UgQXBwJyxcbiAgICBzaG9ydF9uYW1lOiAnRmluQXBwJyxcbiAgICBkZXNjcmlwdGlvbjogJ1lvdXIgcGVyc29uYWwgZmluYW5jZSBtYW5hZ2VyJyxcbiAgICB0aGVtZV9jb2xvcjogJyNmZmZmZmYnLFxuICAgIGljb25zOiBbXG4gICAgICB7XG4gICAgICAgIHNyYzogJy9pY29uLTE5MngxOTIucG5nJyxcbiAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNyYzogJy9pY29uLTUxMng1MTIucG5nJyxcbiAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgIH1cbiAgICBdXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHZpc3VhbGl6ZXIoeyBvcGVuOiB0cnVlIH0pLCAvLyBUaGlzIHdpbGwgb3BlbiBhIHZpc3VhbGl6YXRpb24gb2YgeW91ciBjaHVua3MgYWZ0ZXIgYnVpbGRcbiAgICBWaXRlUFdBKCksIC8vIHB3YU9wdGlvbnMgd2FzIG1lbnRpb25lZCBidXQgbm90IGRlZmluZWQgaW4geW91ciBzbmlwcGV0XG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICBzZXR1cEZpbGVzOiAnLi9zcmMvc2V0dXBUZXN0cy50c3gnLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCddLCAvLyBDb3ZlcmFnZSBvdXRwdXQgZm9ybWF0c1xuICAgICAgYWxsOiB0cnVlLCAvLyBJbmNsdWRlIGFsbCBmaWxlcyBpbiBjb3ZlcmFnZSwgZXZlbiBpZiBub3QgdGVzdGVkXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnRzJywgJ3NyYy8qKi8qLnRzeCddLCAvLyBPbmx5IGluY2x1ZGUgc291cmNlIGZpbGVzXG4gICAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcycsICdkaXN0JywgJ19fdGVzdHNfXycsICdzcmMvc2V0dXBUZXN0cy50cyddLCAvLyBFeGNsdWRlIHRlc3RzIGFuZCBzZXR1cFxuICAgIH0sXG4gICAgaW5jbHVkZTogWydfX3Rlc3RzX18vKiovKi5zcGVjLnRzJywgJ19fdGVzdHNfXy8qKi8qLnNwZWMudHN4J10sIC8vIEluY2x1ZGUgb25seSB0ZXN0IGZpbGVzXG4gICAgZXhjbHVkZTogWy4uLmNvbmZpZ0RlZmF1bHRzLmV4Y2x1ZGVdLCAvLyBVc2UgZGVmYXVsdCBleGNsdWRlcyBmcm9tIFZpdGVzdFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFSLE9BQU8sVUFBVTtBQUV0UyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxlQUErQjtBQUN4QyxTQUFTLGdCQUFnQixvQkFBb0I7QUFMN0MsSUFBTSxtQ0FBbUM7QUE4QnpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFdBQVcsRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBO0FBQUEsSUFDekIsUUFBUTtBQUFBO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLElBQ1osVUFBVTtBQUFBLE1BQ1IsVUFBVSxDQUFDLFFBQVEsUUFBUSxNQUFNO0FBQUE7QUFBQSxNQUNqQyxLQUFLO0FBQUE7QUFBQSxNQUNMLFNBQVMsQ0FBQyxlQUFlLGNBQWM7QUFBQTtBQUFBLE1BQ3ZDLFNBQVMsQ0FBQyxnQkFBZ0IsUUFBUSxhQUFhLG1CQUFtQjtBQUFBO0FBQUEsSUFDcEU7QUFBQSxJQUNBLFNBQVMsQ0FBQywwQkFBMEIseUJBQXlCO0FBQUE7QUFBQSxJQUM3RCxTQUFTLENBQUMsR0FBRyxlQUFlLE9BQU87QUFBQTtBQUFBLEVBQ3JDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
