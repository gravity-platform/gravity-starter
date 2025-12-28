import React from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Calendar, Lightbulb, Layers, User } from "lucide-react";

const VIEW_TABS = [
  { id: "overview", label: "Overview", icon: "Layers" },
  { id: "interests", label: "Interests", icon: "Sparkles" },
  {
    id: 'personality',
    label: 'Business Profile',
    icon: 'Brain',
    description: 'Service interests and business characteristics'
  },
  { id: "timeline", label: "Timeline", icon: "Calendar" },
  { id: "insights", label: "Insights", icon: "Lightbulb" },
  { id: "profile", label: "Profile Data", icon: "User" },
];

const iconMap = {
  Layers,
  Sparkles,
  Brain,
  Calendar,
  Lightbulb,
  User,
};

export function ProfileNavigation({ activeView, onViewChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative bg-white rounded-2xl p-1.5 shadow-lg border border-gray-100"
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
    >
      <div className="inline-flex">
        {VIEW_TABS.map((tab) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeView === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`relative px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeView === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              whileHover={{ scale: isActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-md"
                  style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                  initial={false}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 35
                  }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
