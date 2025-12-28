import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Zap, Mail, Target } from "lucide-react";
import CryptoJS from "crypto-js";

export function ProfileHeader({ profileData, userId, insights }) {
  // Get user's name from profileData
  const userName = profileData?.profile?.name || profileData?.profile?.firstName || "User Profile";
  const userFirstName = profileData?.profile?.firstName;
  const userEmail = profileData?.profile?.email;
  const userLocation =
    profileData?.profile?.attributes?.location || profileData?.businessProfile?.targetMarket || "Abu Dhabi";

  // Generate Gravatar URL from email
  const getGravatarUrl = (email, size = 128) => {
    if (!email) return null;
    // Generate MD5 hash of the email
    const hash = CryptoJS.MD5(email.toLowerCase().trim()).toString();
    // Return Gravatar URL with identicon as default
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
  };

  const gravatarUrl = getGravatarUrl(userEmail);

  const getInitials = (name, id) => {
    if (name && name !== "User Profile") {
      // Get initials from name
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    // Fallback to ID-based initials
    return id.substring(0, 2).toUpperCase();
  };

  const getTechLevel = (level) => {
    const levels = {
      beginner: { text: "Beginner", color: "text-emerald-400" },
      intermediate: { text: "Intermediate", color: "text-sky-400" },
      expert: { text: "Expert", color: "text-violet-400" },
    };
    return levels[level] || levels.intermediate;
  };

  const getCommunicationStyle = (style) => {
    const styles = {
      formal: { text: "Formal", icon: "🎩" },
      casual: { text: "Casual", icon: "😊" },
      technical: { text: "Technical", icon: "💻" },
    };
    return styles[style] || styles.casual;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
      style={{
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1), inset 0 1px 3px rgba(255, 255, 255, 0.9)",
        background: "linear-gradient(145deg, #ffffff 0%, #fafafa 100%)",
      }}
    >
      {/* Gradient background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-gray-50/30" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top accent bar with shimmer */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-50" />

      {/* Subtle shimmer effect */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 animate-shimmer" />
      </div>

      <div className="relative px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="flex items-start gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative flex-shrink-0"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-full blur-xl opacity-60" />
                  <div className="relative w-28 h-28 rounded-full bg-white p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center overflow-hidden">
                      {gravatarUrl && userEmail ? (
                        <img
                          src={gravatarUrl}
                          alt={userName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="text-3xl font-light text-gray-700 flex items-center justify-center w-full h-full"
                        style={{ display: gravatarUrl && userEmail ? "none" : "flex" }}
                      >
                        {getInitials(userName, userId)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Name and Details */}
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight"
                >
                  {userName}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-gray-500 text-sm mb-4"
                >
                  {userId}
                </motion.p>

                {/* Contact and Location */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{userLocation}</span>
                  </div>

                  {userEmail && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{userEmail}</span>
                    </div>
                  )}
                </motion.div>

                {/* Business Info Pills */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap gap-2 mt-6"
                >
                  {profileData?.businessProfile?.industry && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {profileData.businessProfile.industry}
                    </span>
                  )}
                  {profileData?.businessProfile?.businessStage && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {profileData.businessProfile.businessStage}
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Column - Current Needs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Current Needs */}
            {(profileData?.insights?.needs?.immediate ||
              profileData?.insights?.needs?.upcoming ||
              profileData?.insights?.needs?.latent) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Current Needs
                </h3>

                <div className="space-y-4">
                  {profileData.insights.needs.immediate && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Immediate</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{profileData.insights.needs.immediate}</p>
                    </div>
                  )}

                  {profileData.insights.needs.upcoming && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Upcoming</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{profileData.insights.needs.upcoming}</p>
                    </div>
                  )}

                  {profileData.insights.needs.latent && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Future</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{profileData.insights.needs.latent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
