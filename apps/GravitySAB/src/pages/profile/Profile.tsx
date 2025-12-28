import React, { useState } from "react";
import { useProfileData } from "@gravity-platform/gravity-client";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileNavigation } from "./components/ProfileNavigation";
import { ProfileContent } from "./components/ProfileContent";

export interface ProfileProps {
  userId: string;
  workflowId: string;
  apiUrl: string;
  getAccessToken?: () => Promise<string | null>;
  onBack?: () => void;
}

export function Profile({ userId, workflowId, apiUrl, getAccessToken, onBack }: ProfileProps) {
  const [activeView, setActiveView] = useState("overview");
  const { profileData, memories, insights, loading, error } = useProfileData(userId, workflowId, {
    apiUrl,
    getAccessToken,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-medium text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading profile</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden overscroll-none">
      {/* Fixed background with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 overflow-hidden pointer-events-none">
        {/* Gradient orbs contained within background */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gray-300/30 to-gray-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-gray-400/20 to-gray-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      {onBack && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <ProfileHeader userId={userId} profileData={profileData} insights={insights} />
        <ProfileNavigation activeView={activeView} onViewChange={setActiveView} />
        <ProfileContent activeView={activeView} profileData={profileData} memories={memories} insights={insights} />
      </div>
    </div>
  );
}

export default Profile;
