import { createElement as h } from "react";
import { Routes, Route } from "react-router-dom";
import { ChatPage } from "../pages/ChatPage";
import { ProfilePage } from "../pages/ProfilePage";

export function AppRoutes() {
  return h(
    Routes,
    null,
    h(Route, { path: "/", element: h(ChatPage) }),
    h(Route, { path: "/profile/:workflowId/:userId", element: h(ProfilePage) })
  );
}

// Re-export config for backwards compatibility
export { workflowConfig as defaultWorkflowConfig } from "../config";

export default AppRoutes;
