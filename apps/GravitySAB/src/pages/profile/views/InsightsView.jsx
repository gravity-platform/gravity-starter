import React from "react";
import { InsightCards } from "../components/InsightCards";

export default function InsightsView({ memories }) {
  return <InsightCards insights={memories.slice(0, 6)} />;
}
