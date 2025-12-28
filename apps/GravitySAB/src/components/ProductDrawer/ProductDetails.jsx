import { CreditCard, Info } from "lucide-react";

/**
 * ProductDetails - Matches ADCB legacy design
 * Clean, minimal: hero image → blue title section → white disclaimer
 */
export function ProductDetails({ product, onApplyClick, showButton = true }) {
  if (!product) return null;

  const { title, name, description, tier, imageUrl, metadata = {} } = product;

  const displayTitle = title || name || "Product";
  const displayDescription = description || metadata?.shortDescription || "";
  const heroImage = imageUrl || metadata?.images?.[0];
  const displayTier = tier || "STANDARD";

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Blue section */}
        <div className="bg-blue-600">
          {/* Header bar - icon + tier badge */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <CreditCard className="w-7 h-7 text-white/70" />
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white uppercase tracking-wider">
              {displayTier}
            </span>
          </div>

          {/* Hero Image - Full width */}
          {heroImage && (
            <div className="w-full">
              <img src={heroImage} alt={displayTitle} className="w-full h-auto object-cover" loading="lazy" />
            </div>
          )}

          {/* Title & Description */}
          <div className="px-5 pt-6 pb-8">
            <h1 className="text-[26px] font-bold text-white leading-tight">{displayTitle}</h1>
            {displayDescription && (
              <p className="text-[15px] text-white/85 mt-4 leading-relaxed">{displayDescription}</p>
            )}
          </div>
        </div>

        {/* White section with disclaimer */}
        <div className="px-5 py-6">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Subject to credit approval. Terms and conditions apply. Your application will be reviewed within 24-48
              hours.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      {showButton && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onApplyClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[15px] py-4 rounded-xl transition-all active:scale-[0.98]"
          >
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
