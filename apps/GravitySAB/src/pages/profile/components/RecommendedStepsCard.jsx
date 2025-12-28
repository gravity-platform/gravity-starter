import React from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import NextStepCard from "./NextStepCard";

export default function RecommendedStepsCard({ recommendedSteps }) {
  if (!recommendedSteps || recommendedSteps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10"
    >
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-purple-400" />
        Recommended Next Steps
      </h3>
      <div className="space-y-4">
        {recommendedSteps.map((step, index) => (
          <NextStepCard key={index} step={step} />
        ))}
      </div>
    </motion.div>
  );
}
