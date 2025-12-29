import { defineConfig, loadEnv } from "vite";
import preact from "@preact/preset-vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from root .env file (monorepo)
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "VITE_");

  return {
    plugins: [preact()],
    define: {
      // Make VITE_ env vars available at build time
      "import.meta.env.VITE_AUTH_ISSUER": JSON.stringify(env.VITE_AUTH_ISSUER),
      "import.meta.env.VITE_AUTH_CLIENT_ID": JSON.stringify(env.VITE_AUTH_CLIENT_ID),
      "import.meta.env.VITE_AUTH_AUDIENCE": JSON.stringify(env.VITE_AUTH_AUDIENCE),
      "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
      "import.meta.env.VITE_WEBSOCKET_URL": JSON.stringify(env.VITE_WEBSOCKET_URL),
    },
    resolve: {
      alias: {
        react: "preact/compat",
        "react-dom": "preact/compat",
        "react/jsx-runtime": "preact/jsx-runtime",
      },
      dedupe: ["react", "react-dom", "zustand", "preact"],
    },
    optimizeDeps: {
      include: ["zustand", "react-oidc-context", "oidc-client-ts", "@gravity-platform/gravity-client"],
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
    server: {
      port: 3007,
      host: "0.0.0.0",
    },
  };
});
