import React from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

export default function FocusAreasCard({ focusAreas }) {
  if (!focusAreas || focusAreas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10"
    >
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-400" />
        Focus Areas
      </h3>
      <div className="space-y-3">
        {focusAreas.map((area, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium">{area.area}</span>
                <span className="text-xs text-gray-400">Priority {area.priority}</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${area.score * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
            </div>
            <span className="text-sm text-gray-400 ml-4">{Math.round(area.score * 100)}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
