import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function NextStepCard({ step }) {
  const priorityColors = {
    high: "from-red-500 to-orange-500",
    medium: "from-yellow-500 to-amber-500",
    low: "from-green-500 to-emerald-500",
  };

  const priorityIcons = {
    high: AlertCircle,
    medium: Clock,
    low: CheckCircle,
  };

  const Icon = priorityIcons[step.priority] || CheckCircle;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${priorityColors[step.priority]} bg-opacity-20`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{step.title}</h4>
          <p className="text-gray-400 text-sm">{step.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </div>
    </motion.div>
  );
}
