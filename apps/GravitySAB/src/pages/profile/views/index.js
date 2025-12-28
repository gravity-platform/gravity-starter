export { OverviewView } from "./OverviewView";

// Lazy load other views
import { lazy } from "react";

export const InterestsView = lazy(() => import("./InterestsView"));
export const PersonalityView = lazy(() => import("./PersonalityView"));
export const TimelineView = lazy(() => import("./TimelineView"));
export const InsightsView = lazy(() => import("./InsightsView"));
export const ProfileDataView = lazy(() => import("./ProfileDataView"));
