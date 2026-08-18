import { defineConfig } from "vite";
import { version } from "./package.json";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: "named",
        icon: true, // This will transform SVG to a React component
        namedExport: "ReactComponent"
      }
    })
  ],

  resolve: {
    alias: {
      // Use "@" as an alias for the "src" directory
      // "@": "/src",
      "@": path.resolve(__dirname, "src"),
      "@/core": path.resolve(__dirname, "src/core"),
      "@/ai": path.resolve(__dirname, "src/ai"),
      "@/cc": path.resolve(__dirname, "src/cc"),
      "@/cms": path.resolve(__dirname, "src/cms"),
      "@/kms": path.resolve(__dirname, "src/kms")
    }
  },

  // @arcgis/core is only reachable behind React.lazy (the case-form map), so Vite
  // can discover it mid-session and re-optimize. That leaves the page holding two
  // copies of the same dep chunk - one requested with ?v=<browserHash>, one without -
  // and since each copy re-evaluates `Symbol("Accessor-beforeDestroy")`, the symbols
  // no longer match. Accessor's generated destroy() then reads `this[symbol]` as
  // undefined and throws "Cannot read properties of undefined (reading 'call')".
  // Pinning every entry point keeps them all in the initial optimize pass.
  //
  // Keep this list in sync: importing a new "@arcgis/core/*" entry point without
  // adding it here re-opens the same late-discovery window. Dev-only setting.
  optimizeDeps: {
    include: [
      "@arcgis/core/config.js",
      "@arcgis/core/Graphic.js",
      "@arcgis/core/Map.js",
      "@arcgis/core/geometry/Point.js",
      "@arcgis/core/layers/GraphicsLayer.js",
      "@arcgis/core/rest/locator.js",
      "@arcgis/core/views/MapView.js",
      "@arcgis/core/widgets/Search.js"
    ]
  },

  // CORS Solution: Proxy API requests to backend
  server: {
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(","),
    hmr: process.env.NODE_ENV === "production" ? {
      clientPort: 443, // Needed if the browser connects over HTTPS
      host: process.env.VITE_HMR_HOST, // Public host browser is loading from
      // port: 5173, // If exposing the Vite port directly without proxy
      protocol: "wss" // Use "ws" if not serving over HTTPS
    } : undefined,
    host: true, // Allow external connections
    port: 5173,

    // Proxy configuration to handle CORS
    proxy: {
      "/api": {
        changeOrigin: true,
        secure: false,
        target: process.env.VITE_BASE_URL,
        configure: (proxy) => {
          // Log proxy requests for debugging
          proxy.on("error", err => {
            console.log("🚀 ~ Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("🚀 ~ Proxying request:", proxyReq, req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("🚀 ~ Proxy response:", proxyRes.statusCode, req.url);
          });
        },
        rewrite: (path) => path.replace(/^\/api/, "/api")
      },
      "/ws": {
        changeOrigin: true,
        target: process.env.VITE_WEBSOCKET_BASE_URL,
        ws: true
      }
    }
  },
  
  build: {
    chunkSizeWarningLimit: 2000,
    cssMinify: false,
    // cssMinify: true,
    minify: "esbuild",
    // minify: "terser",
    outDir: "dist",
    rollupOptions: {
      output: {
        // manualChunks: {
        //   "charts": [
        //     "apexcharts",
        //     "react-apexcharts"
        //   ],
        //   "dnd": [
        //     "@dnd-kit/core", "@dnd-kit/modifiers", 
        //     "@dnd-kit/sortable", "@dnd-kit/utilities",
        //     "@hello-pangea/dnd", "react-dnd", "react-dnd-html5-backend"
        //   ],
        //   "fullcalendar": [
        //     "@fullcalendar/core",
        //     "@fullcalendar/daygrid", 
        //     "@fullcalendar/interaction",
        //     "@fullcalendar/list",
        //     "@fullcalendar/react",
        //     "@fullcalendar/timegrid"
        //   ],
        //   "icons": [
        //     "lucide",
        //     "lucide-react"
        //   ],
        //   "maps": [
        //     "@react-jvectormap/core",
        //     "@react-jvectormap/world"
        //   ],
        //   "react-vendor": [
        //     "react",
        //     "react-dom"
        //   ],
        //   "redux": [
        //     "react-redux",
        //     "@reduxjs/toolkit"
        //   ],
        //   "router": [
        //     // "react-router",
        //     "react-router-dom"
        //   ],
        //   "ui": [
        //     "@headlessui/react",
        //     "@radix-ui/react-avatar",
        //     "@radix-ui/react-dialog", 
        //     "@radix-ui/react-scroll-area"
        //   ],
        //   "utils": [
        //     "axios",
        //     "flatpickr",
        //     "react-grid-layout",
        //     "uuid"
        //   ]
        // }

        // manualChunks(id) {
        //   if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
        //     return "react";
        //   }
        //   if (id.includes("react-router")) {
        //     return "router";
        //   }
        //   if (id.includes("@reduxjs/toolkit") || id.includes("react-redux")) {
        //     return "redux";
        //   }
        //   if (id.includes("apexcharts") || id.includes("react-apexcharts")) {
        //     return "charts";
        //   }
        //   if (id.includes("@fullcalendar")) {
        //     return "fullcalendar";
        //   }
        //   if (id.includes("@dnd-kit") || id.includes("react-dnd") || id.includes("@hello-pangea/dnd")) {
        //     return "dnd";
        //   }
        //   if (id.includes("lucide")) {
        //     return "icons";
        //   }
        //   if (id.includes("react-jvectormap")) {
        //     return "maps";
        //   }
        //   if (id.includes("@headlessui") || id.includes("@radix-ui")) {
        //     return "ui";
        //   }
        //   if (id.includes("axios") || id.includes("uuid") || id.includes("date-fns") || id.includes("flatpickr")) {
        //     return "utils";
        //   }
        //   if (id.includes("node_modules")) {
        //     return "vendor";
        //   }
        // }

        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }
          // Leave the ArcGIS SDK and the packages it pulls in UNASSIGNED so Rollup
          // can place them in the async chunks created by the lazy-loaded map.
          //
          // Do not force these into a manual chunk: @arcgis/core and its runtime
          // deps (calcite, amcharts, vaadin, zip.js, ...) form one mutually
          // referencing group. Splitting it across arcgis/vendor makes vendor
          // import arcgis, and since vendor is eager that drags the whole ~12MB
          // SDK into the initial bundle (and warns "Circular chunk").
          if (/node_modules\/(@arcgis|@esri|@amcharts|@vaadin|@zip\.js|luxon|marked)\//.test(id)) {
            return;
          }
          return "vendor";
        }
      },
      onwarn(warning, warn) {
        // Suppress eval warnings from react-jvectormap
        if (warning.code === "EVAL" && warning.id?.includes("@react-jvectormap/core")) {
          return;
        }
        warn(warning);
      }
    },
    sourcemap: true
    // sourcemap: false
  },
  
  define: {
    // Define environment variables
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __API_URL__: JSON.stringify(process.env.VITE_API_BASE_URL),
    __APP_VERSION__: JSON.stringify(version)
  }
});
