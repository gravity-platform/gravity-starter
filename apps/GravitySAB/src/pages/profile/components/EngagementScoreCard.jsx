import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function EngagementScoreCard({ engagementScore, insights, getEngagementStage, getSegment, timelineUrgency }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Engagement Score
        </h3>
        <span className="text-2xl font-bold text-purple-400">{engagementScore}%</span>
      </div>

      <div className="w-full bg-gray-700/50 rounded-full h-3 mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${engagementScore}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-400">Stage</div>
          <div className="text-white font-medium">
            {insights?.engagementStage || getEngagementStage(engagementScore)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Segment</div>
          <div className="text-white font-medium">
            {insights?.userSegment?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
              getSegment(engagementScore)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Timeline</div>
          <div className="text-white font-medium">{timelineUrgency}</div>
        </div>
      </div>
    </motion.div>
  );
}
