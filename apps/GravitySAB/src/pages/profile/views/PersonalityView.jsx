import React from "react";
import { PersonalityRadar } from "../components/PersonalityRadar";

export default function PersonalityView({ profileData }) {
  // Extract service interests from the standardized profile data
  const serviceInterestsData = profileData?.serviceInterests || {};
  const businessProfile = profileData?.businessProfile || {};

  // Check if we have any service interests data
  const hasServiceInterests = Object.keys(serviceInterestsData).length > 0;

  // Transform service interests into radar chart format dynamically
  const serviceInterests = [];

  // Dynamically create radar chart data from actual service interests
  if (serviceInterestsData && typeof serviceInterestsData === "object") {
    Object.entries(serviceInterestsData).forEach(([key, value]) => {
      // Convert camelCase to readable format
      const trait = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      serviceInterests.push({
        trait,
        score: Number(value) || 0,
      });
    });

    // Sort by score descending (highest scores first)
    serviceInterests.sort((a, b) => b.score - a.score);

    // Always show exactly 8 categories
    serviceInterests.splice(8);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Service Interests</h3>
        {hasServiceInterests ? (
          <PersonalityRadar data={serviceInterests} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No service interests captured yet</p>
            <p className="text-gray-400 text-sm text-center max-w-md">
              Service interest levels will be calculated based on your conversations and business needs
            </p>
          </div>
        )}
      </div>

      {/* Products Interested Section */}
      {profileData?.interactions?.productsInterested && profileData.interactions.productsInterested.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Products & Services of Interest</h3>
          <div className="flex flex-wrap gap-3">
            {profileData.interactions.productsInterested.map((product, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Stage</h4>
          <p className="text-lg font-medium text-gray-900">{businessProfile.businessStage || "Exploring Options"}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Entity Type</h4>
          <p className="text-lg font-medium text-gray-900">{businessProfile.entityType || "Not Specified"}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Industry</h4>
          <p className="text-lg font-medium text-gray-900">{businessProfile.industry || "General Business"}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm" style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Target Market</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
              {businessProfile.targetMarket || "Not Specified"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
