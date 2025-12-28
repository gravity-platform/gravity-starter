import React from "react";
import { motion } from "framer-motion";
import EngagementScoreCard from "../components/EngagementScoreCard";
import FocusAreasCard from "../components/FocusAreasCard";
import RecommendedStepsCard from "../components/RecommendedStepsCard";
import {
  calculateEngagementReadiness,
  calculateRegulatoryInterest,
  calculateTimelineUrgency,
  getEngagementStage,
  getSegment,
  generateRecommendedSteps
} from "../utils/profileCalculations";

/**
 * BusinessInsightsView Component
 *
 * Displays business insights and recommendations based on profile data and memories.
 * Uses backend-provided insights when available, falls back to local calculations.
 *
 * @param {Object} props
 * @param {Object} props.profileData - User profile data including business profile and service interests
 * @param {Array} props.memories - Array of user memories/interactions
 * @param {Object} props.insights - Backend-provided insights including:
 *   - userSegment: Classification of the user (e.g., "high_value_prospect")
 *   - engagementStage: Current stage in the user journey
 *   - focusAreas: Array of areas with scores and priorities
 *   - nextSteps: Recommended actions for the user
 *   - timelineUrgency: Urgency level for taking action
 */
export default function BusinessInsightsView({ profileData, memories, insights }) {
  // Use backend insights if available, otherwise calculate locally
  const engagementScore = insights?.userSegment
    ? insights.userSegment === "high_value_prospect"
      ? 85
      : insights.userSegment === "qualified_lead"
      ? 65
      : insights.userSegment === "active_client"
      ? 100
      : 40
    : calculateEngagementReadiness(profileData, memories);

  const regulatoryInterest = insights?.focusAreas
    ? insights.focusAreas.find((area) => area.area.toLowerCase().includes("regulatory"))?.score * 100 || 0
    : calculateRegulatoryInterest(memories);

  const timelineUrgency = insights?.timelineUrgency
    ? insights.timelineUrgency
    : insights?.engagementStage === "decision"
    ? "High"
    : insights?.engagementStage === "evaluation"
    ? "Medium"
    : calculateTimelineUrgency(memories);

  // Convert nextSteps object to array format
  const recommendedSteps = insights?.nextSteps 
    ? [
        ...(insights.nextSteps.immediate || []),
        ...(insights.nextSteps.shortTerm || []),
        ...(insights.nextSteps.longTerm || [])
      ]
    : generateRecommendedSteps(profileData, memories);

  return (
    <div className="space-y-6">
      {/* Engagement Score */}
      <EngagementScoreCard
        engagementScore={engagementScore}
        insights={insights}
        getEngagementStage={getEngagementStage}
        getSegment={getSegment}
        timelineUrgency={timelineUrgency}
      />

      {/* Focus Areas */}
      <FocusAreasCard focusAreas={insights?.focusAreas} />

      {/* Recommended Next Steps */}
      <RecommendedStepsCard recommendedSteps={recommendedSteps} />


      {/* Recent Activity Summary */}
      {memories && memories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Total Interactions</span>
              <span className="text-white">{memories.length}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>This Week</span>
              <span className="text-white">
                {
                  memories.filter(
                    (m) => new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Regulatory Interest</span>
              <span className="text-white">{regulatoryInterest}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
