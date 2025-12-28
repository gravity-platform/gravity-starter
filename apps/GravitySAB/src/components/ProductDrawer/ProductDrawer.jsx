import { useState, useEffect, useCallback, memo } from "react";
import { X } from "lucide-react";
import { ProductDetails } from "./ProductDetails";
import { ProductApplicationForm } from "./ProductApplicationForm";

/**
 * ProductDrawer - Sliding drawer for SAB bank products
 *
 * Desktop (>=768px): Side-by-side panels when application is active
 * Mobile (<768px): Stacked sliding panels
 */
export function ProductDrawer({ isOpen, product, onClose, onApply }) {
  const [showApplication, setShowApplication] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen && product) {
      setIsVisible(true);
      setShowApplication(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowApplication(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  const handleApplyClick = useCallback(() => {
    setShowApplication(true);
    onApply?.(product);
  }, [product, onApply]);

  const handleBackFromApplication = useCallback(() => {
    setShowApplication(false);
  }, []);

  const handleApplicationComplete = useCallback((applicationData) => {
    console.log("[ProductDrawer] Application complete:", applicationData);
    // Could close drawer or show success state
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowApplication(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    const onEscape = (e) => e.key === "Escape" && isOpen && handleClose();
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isOpen, handleClose]);

  if (!isVisible) return null;

  // Desktop: side-by-side (480px + 520px = 1000px when application shown)
  // Mobile: single panel (90vw max)
  const panelWidth = showApplication ? "min(1000px, 95vw)" : "min(480px, 90vw)";

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel container */}
      <div
        className="relative h-full transition-all duration-300 ease-out overflow-hidden"
        style={{ width: panelWidth, transform: isAnimating ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex h-full">
          {/* Left panel: Product Details */}
          <div
            className={`h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 ease-out ${
              showApplication ? "hidden md:block md:w-[480px] flex-shrink-0" : "w-full"
            }`}
          >
            <ProductDetails product={product} onApplyClick={handleApplyClick} showButton={!showApplication} />
          </div>

          {/* Right panel: Application Form */}
          {showApplication && (
            <div className="h-full bg-white dark:bg-black flex-1 overflow-hidden">
              <ProductApplicationForm
                product={product}
                onBack={handleBackFromApplication}
                onComplete={handleApplicationComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductDrawer);
