import { useState, useCallback, useEffect } from "react";

/**
 * Hook to manage service sidebar state
 * Listens for gravity:action CustomEvents from streamed components
 */
export function useServiceSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeService, setActiveService] = useState(null);

  // Listen for gravity:action events directly
  useEffect(() => {
    const handleAction = (e) => {
      const { type, data, componentId } = e.detail || {};
      console.log("[useServiceSidebar] Received gravity:action", { type, componentId });
      if (type === "click" && data?.object) {
        setActiveService(data.object);
        setSidebarOpen(true);
      }
    };
    window.addEventListener("gravity:action", handleAction);
    return () => window.removeEventListener("gravity:action", handleAction);
  }, []);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setActiveService(null);
  }, []);

  // Handle book action
  const handleBook = useCallback((service) => {
    console.log("[useServiceSidebar] Book clicked for service:", service?.title);
  }, []);

  return {
    sidebarOpen,
    activeService,
    closeSidebar,
    handleBook,
  };
}
