import { createElement as h } from "react";
import { BrowserRouter } from "react-router-dom";
import { UserProvider, GravityAuthProvider } from "@gravity-platform/gravity-client";
import { AppRoutes } from "./routes";

const authConfig = {
  issuer: import.meta.env.VITE_AUTH_ISSUER,
  clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
  audience: import.meta.env.VITE_AUTH_AUDIENCE,
};

export function App() {
  // Only wrap with auth if configured
  const hasAuth = authConfig.issuer && authConfig.clientId;

  const content = h(UserProvider, null, h(BrowserRouter, null, h(AppRoutes)));

  if (hasAuth) {
    return h(GravityAuthProvider, { config: authConfig }, content);
  }

  return content;
}
