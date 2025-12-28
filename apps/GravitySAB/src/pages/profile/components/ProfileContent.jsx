import React, { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { 
  OverviewView,
  InterestsView,
  PersonalityView,
  TimelineView,
  InsightsView,
  ProfileDataView
} from "../views";

const viewComponents = {
  overview: OverviewView,
  interests: InterestsView,
  personality: PersonalityView,
  timeline: TimelineView,
  insights: InsightsView,
  profile: ProfileDataView,
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export function ProfileContent({ activeView, profileData, memories, insights }) {
  const ViewComponent = viewComponents[activeView] || OverviewView;
  const isLazyView = activeView !== "overview";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {isLazyView ? (
          <Suspense fallback={<LoadingFallback />}>
            <ViewComponent profileData={profileData} memories={memories} insights={insights} />
          </Suspense>
        ) : (
          <ViewComponent profileData={profileData} memories={memories} insights={insights} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
