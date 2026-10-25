// vite.config.ts
import { sentryVitePlugin } from "file:///C:/Users/rafae/OneDrive/Documentos/DEV/Cronograma-de-Gravacoes/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import react from "file:///C:/Users/rafae/OneDrive/Documentos/DEV/Cronograma-de-Gravacoes/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig, loadEnv } from "file:///C:/Users/rafae/OneDrive/Documentos/DEV/Cronograma-de-Gravacoes/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const release = env.VERCEL_GIT_COMMIT_SHA ?? "";
  const uploadSourceMaps = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);
  return {
    base: "./",
    plugins: [
      react(),
      ...uploadSourceMaps ? [
        sentryVitePlugin({
          authToken: env.SENTRY_AUTH_TOKEN,
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          release: release ? { name: release } : void 0,
          sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
          telemetry: false
        })
      ] : []
    ],
    define: {
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(release)
    },
    build: {
      sourcemap: uploadSourceMaps ? "hidden" : false
    },
    optimizeDeps: {
      exclude: ["@vieira/institucional", "@vieira/analytics"]
    },
    server: {
      port: 3333,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3334",
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 3333
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxyYWZhZVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXERFVlxcXFxDcm9ub2dyYW1hLWRlLUdyYXZhY29lc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxccmFmYWVcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRvc1xcXFxERVZcXFxcQ3Jvbm9ncmFtYS1kZS1HcmF2YWNvZXNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3JhZmFlL09uZURyaXZlL0RvY3VtZW50b3MvREVWL0Nyb25vZ3JhbWEtZGUtR3JhdmFjb2VzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuXHJcbi8vIGJhc2UgcmVsYXRpdm8gKCcuLycpIGZ1bmNpb25hIHRhbnRvIGVtIEdpdEh1YiBQYWdlcyAoc3VicGF0aCBkbyByZXBvKVxyXG4vLyBxdWFudG8gZW0gVmVyY2VsL3NlcnZpZG9yIG5hIHJhaXosIHNlbSBwcmVjaXNhciBhanVzdGFyIG8gY2FtaW5oby5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpXHJcbiAgY29uc3QgcmVsZWFzZSA9IGVudi5WRVJDRUxfR0lUX0NPTU1JVF9TSEEgPz8gJydcclxuICBjb25zdCB1cGxvYWRTb3VyY2VNYXBzID0gQm9vbGVhbihlbnYuU0VOVFJZX0FVVEhfVE9LRU4gJiYgZW52LlNFTlRSWV9PUkcgJiYgZW52LlNFTlRSWV9QUk9KRUNUKVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYmFzZTogJy4vJyxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgLi4uKHVwbG9hZFNvdXJjZU1hcHNcclxuICAgICAgICA/IFtcclxuICAgICAgICAgICAgc2VudHJ5Vml0ZVBsdWdpbih7XHJcbiAgICAgICAgICAgICAgYXV0aFRva2VuOiBlbnYuU0VOVFJZX0FVVEhfVE9LRU4sXHJcbiAgICAgICAgICAgICAgb3JnOiBlbnYuU0VOVFJZX09SRyxcclxuICAgICAgICAgICAgICBwcm9qZWN0OiBlbnYuU0VOVFJZX1BST0pFQ1QsXHJcbiAgICAgICAgICAgICAgcmVsZWFzZTogcmVsZWFzZSA/IHsgbmFtZTogcmVsZWFzZSB9IDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgIHNvdXJjZW1hcHM6IHsgZmlsZXNUb0RlbGV0ZUFmdGVyVXBsb2FkOiBbJy4vZGlzdC8qKi8qLm1hcCddIH0sXHJcbiAgICAgICAgICAgICAgdGVsZW1ldHJ5OiBmYWxzZSxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgOiBbXSksXHJcbiAgICBdLFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TRU5UUllfUkVMRUFTRSc6IEpTT04uc3RyaW5naWZ5KHJlbGVhc2UpLFxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIHNvdXJjZW1hcDogdXBsb2FkU291cmNlTWFwcyA/ICdoaWRkZW4nIDogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIGV4Y2x1ZGU6IFsnQHZpZWlyYS9pbnN0aXR1Y2lvbmFsJywgJ0B2aWVpcmEvYW5hbHl0aWNzJ10sXHJcbiAgICB9LFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDMzMzMsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMzMzQnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBwb3J0OiAzMzMzLFxyXG4gICAgfSxcclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFgsU0FBUyx3QkFBd0I7QUFDM1osT0FBTyxXQUFXO0FBQ2xCLFNBQVMsY0FBYyxlQUFlO0FBSXRDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLFVBQVUsSUFBSSx5QkFBeUI7QUFDN0MsUUFBTSxtQkFBbUIsUUFBUSxJQUFJLHFCQUFxQixJQUFJLGNBQWMsSUFBSSxjQUFjO0FBRTlGLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLEdBQUksbUJBQ0E7QUFBQSxRQUNFLGlCQUFpQjtBQUFBLFVBQ2YsV0FBVyxJQUFJO0FBQUEsVUFDZixLQUFLLElBQUk7QUFBQSxVQUNULFNBQVMsSUFBSTtBQUFBLFVBQ2IsU0FBUyxVQUFVLEVBQUUsTUFBTSxRQUFRLElBQUk7QUFBQSxVQUN2QyxZQUFZLEVBQUUsMEJBQTBCLENBQUMsaUJBQWlCLEVBQUU7QUFBQSxVQUM1RCxXQUFXO0FBQUEsUUFDYixDQUFDO0FBQUEsTUFDSCxJQUNBLENBQUM7QUFBQSxJQUNQO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTix1Q0FBdUMsS0FBSyxVQUFVLE9BQU87QUFBQSxJQUMvRDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsV0FBVyxtQkFBbUIsV0FBVztBQUFBLElBQzNDO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMseUJBQXlCLG1CQUFtQjtBQUFBLElBQ3hEO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
