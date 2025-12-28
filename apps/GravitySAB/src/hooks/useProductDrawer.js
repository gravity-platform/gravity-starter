import { useState, useCallback, useEffect } from "react";

/**
 * Hook to manage product drawer state
 * Listens for gravity:product CustomEvents from streamed components
 */
export function useProductDrawer() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  // Listen for gravity:action events
  useEffect(() => {
    const handleAction = (e) => {
      const { type, data, componentId } = e.detail || {};

      // Only open drawer for service objects
      if (type === "click" && data?.object?.object_type === "service") {
        console.log("[useProductDrawer] Opening drawer for service", { componentId });
        setActiveProduct(data.object);
        setDrawerOpen(true);
      }
    };

    window.addEventListener("gravity:action", handleAction);
    return () => window.removeEventListener("gravity:action", handleAction);
  }, []);

  // Open drawer programmatically
  const openDrawer = useCallback((product) => {
    setActiveProduct(product);
    setDrawerOpen(true);
  }, []);

  // Close drawer
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveProduct(null);
  }, []);

  // Handle apply action
  const handleApply = useCallback((product) => {
    console.log("[useProductDrawer] Apply clicked for product:", product?.title || product?.name);
  }, []);

  return {
    drawerOpen,
    activeProduct,
    openDrawer,
    closeDrawer,
    handleApply,
  };
}
