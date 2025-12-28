import { useState, useEffect, useCallback, memo } from "react";
import { X } from "lucide-react";
import { ServiceDetails } from "./ServiceDetails";
import { BookingEngine } from "./BookingEngine";

/**
 * ServiceSidebar - Responsive sidebar
 *
 * Desktop (>=768px): Side-by-side panels when booking is active
 * Mobile (<768px): Stacked sliding panels
 */
export function ServiceSidebar({ isOpen, service, onClose, onBook }) {
  const [showBooking, setShowBooking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen && service) {
      setIsVisible(true);
      setShowBooking(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowBooking(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, service]);

  const handleBookClick = useCallback(() => {
    setShowBooking(true);
    onBook?.(service);
  }, [service, onBook]);

  const handleBackFromBooking = useCallback(() => {
    setShowBooking(false);
  }, []);

  const handleBookingComplete = useCallback((bookingData) => {
    console.log("[ServiceSidebar] Booking complete:", bookingData);
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowBooking(false);
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

  // Desktop: side-by-side (480px + 480px = 960px when booking shown)
  // Mobile: single panel (90vw max)
  const panelWidth = showBooking ? "min(960px, 95vw)" : "min(480px, 90vw)";

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
          {/* Left panel: Service Details */}
          <div
            className={`h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 ease-out ${
              showBooking ? "hidden md:block md:w-[480px] flex-shrink-0" : "w-full"
            }`}
          >
            <ServiceDetails service={service} onBookClick={handleBookClick} showButton={!showBooking} />
          </div>

          {/* Right panel: Booking Engine */}
          {showBooking && (
            <div className="h-full bg-white dark:bg-black flex-1 overflow-hidden">
              <BookingEngine
                service={service}
                onBack={handleBackFromBooking}
                onBookingComplete={handleBookingComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ServiceSidebar);
