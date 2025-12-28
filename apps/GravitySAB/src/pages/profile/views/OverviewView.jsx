import React from "react";
import { Sparkles, Heart, Lightbulb, TrendingUp, Target, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { InterestBubbles } from "../components/InterestBubbles";
import { PersonalityRadar } from "../components/PersonalityRadar";
import { InsightCards } from "../components/InsightCards";
import { calculateEngagementReadiness } from "../utils/profileCalculations";

export function OverviewView({ profileData, memories, insights }) {
  console.log('[OverviewView] Received props:', { profileData, memories, insights });
  
  // Extract service interests from the standardized structure
  const serviceInterests = profileData?.serviceInterests || {};

  // Extract basic profile info
  const userName = profileData?.profile?.name || profileData?.profile?.firstName || "User";
  const userEmail = profileData?.profile?.email;

  // Transform service interests for the radar chart
  const serviceInterestScores = Object.entries(serviceInterests).map(([key, score]) => ({
    area: key.replace(/([A-Z])/g, " $1").trim(),
    score: score || 0,
  }));

  // Extract interests from profile tags and attributes
  const interests = [...(profileData?.profile?.tags || []), ...(profileData?.insights?.focusAreas || [])]
    .filter(Boolean)
    .map((interest, index) => ({
      name: typeof interest === "string" ? interest : interest.area,
      weight: 0.9 - index * 0.15,
    }));

  // Calculate engagement score using backend insights or fallback calculation
  const engagementScore = insights?.userSegment
    ? insights.userSegment === "active_client" ? 100
      : insights.userSegment === "high_value_prospect" ? 85
      : insights.userSegment === "qualified_lead" ? 65
      : 40
    : calculateEngagementReadiness(profileData, memories);

  // Generate next steps based on user priorities and current state

  
  // Generate next steps dynamically based on needs
  const generateNextSteps = () => {
    const steps = [];
    const needs = profileData?.insights?.needs || {};
    
    // Create actions from immediate needs
    if (needs.immediate) {
      steps.push({
        action: needs.immediate,
        category: "immediate",
        priority: "high",
        reason: "Immediate need",
        cta: { 
          text: "Take Action", 
          link: "#" 
        }
      });
    }
    
    // Create actions from upcoming needs
    if (needs.upcoming) {
      steps.push({
        action: needs.upcoming,
        category: "upcoming",
        priority: "medium",
        reason: "Upcoming need",
        cta: { 
          text: "Plan Ahead", 
          link: "#" 
        }
      });
    }
    
    // If no needs exist, return empty
    if (steps.length === 0) {
      return { immediate: [] };
    }
    
    return { immediate: steps.slice(0, 3) }; // Return top 3 priorities as actions
  };
  
  const nextSteps = insights?.nextSteps || generateNextSteps();

  return (
    <div className="space-y-6">
      {/* Business Readiness - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            Engagement Score
          </h3>
          <span className="text-3xl font-semibold text-gray-900">{engagementScore}%</span>
        </div>

        <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden mb-4 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${engagementScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Stage</div>
            <div className="text-base font-medium text-gray-900">
              {insights?.engagementStage?.replace(/\b\w/g, (l) => l.toUpperCase()) ||
                "Exploring"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Segment</div>
            <div className="text-base font-medium text-gray-900">
              {insights?.userSegment?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Early Stage"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Priority</div>
            <div className="text-base font-medium text-gray-900">Low</div>
          </div>
        </div>
      </motion.div>

      {/* Recommended Next Steps - Apple Style */}
      {nextSteps.immediate && nextSteps.immediate.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            Recommended Next Steps
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="uppercase tracking-wider">Immediate Actions</span>
            </div>
            {nextSteps.immediate.map((step, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl hover:from-gray-100 hover:to-gray-100/50 transition-all group cursor-pointer border border-gray-100 hover:border-gray-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{step.action}</h4>
                    <p className="text-sm text-gray-600">{step.reason}</p>
                  </div>
                  {step.cta && (
                    <button className="ml-4 px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors">
                      {step.cta.text}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interest Bubbles - Apple Style */}
      {interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
          style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            Areas of Interest
          </h3>
          <InterestBubbles interests={interests} />
        </motion.div>
      )}



      {/* Recent Insights - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
        style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          Recent Insights
        </h3>
        <InsightCards insights={memories.slice(0, 4)} />
      </motion.div>
    </div>
  );
}
