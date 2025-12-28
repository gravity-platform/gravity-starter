// Engagement score calculation
export function calculateEngagementReadiness(profileData, memories) {
  let score = 20; // Base score for any interaction

  // Profile completeness (generic fields)
  const profileFields = [
    profileData?.profile?.name,
    profileData?.profile?.email,
    profileData?.profile?.phone,
    profileData?.profile?.firstName
  ];
  const filledProfileFields = profileFields.filter(field => field && field.trim() !== '').length;
  score += (filledProfileFields / profileFields.length) * 20; // Up to 20% for basic profile

  // Service interests engagement
  if (profileData?.serviceInterests) {
    const interestValues = Object.values(profileData.serviceInterests);
    const activeInterests = interestValues.filter(v => v > 0).length;
    const avgInterestLevel = interestValues.length > 0 
      ? interestValues.reduce((a, b) => a + b, 0) / interestValues.length 
      : 0;
    
    // Up to 15% based on number of interests selected
    score += Math.min((activeInterests / Math.max(interestValues.length, 1)) * 15, 15);
    // Up to 10% based on average interest level (0-10 scale)
    score += (avgInterestLevel / 10) * 10;
  }

  // Memory depth and recency
  if (memories && memories.length > 0) {
    // Up to 15% for memory count (capped at 10 memories)
    score += Math.min((memories.length / 10) * 15, 15);
    
    // Recent activity bonus (up to 20%)
    const recentMemories = memories.filter(
      (m) => new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const veryRecentMemories = memories.filter(
      (m) => new Date(m.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (veryRecentMemories.length > 0) score += 20; // Active in last 24h
    else if (recentMemories.length > 0) score += 10; // Active in last week
  }

  return Math.min(Math.round(score), 100);
}

// Calculate regulatory interest based on memories
export function calculateRegulatoryInterest(memories) {
  const regulatoryKeywords = ["regulatory", "compliance", "license", "permit", "approval"];
  const relevantMemories = memories.filter((m) =>
    regulatoryKeywords.some((keyword) => m.content.toLowerCase().includes(keyword))
  );
  return Math.min(relevantMemories.length * 20, 100);
}

// Calculate timeline urgency based on recent activity
export function calculateTimelineUrgency(memories) {
  const recentMemories = memories.filter(
    (m) => new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  return recentMemories.length > 5 ? "High" : recentMemories.length > 2 ? "Medium" : "Low";
}

// Get engagement stage based on score
export function getEngagementStage(score) {
  if (score >= 80) return "Active";
  if (score >= 60) return "Engaged";
  if (score >= 40) return "Exploring";
  return "Initial";
}

// Get user segment based on score
export function getSegment(score) {
  if (score >= 85) return "High Value";
  if (score >= 65) return "Qualified";
  if (score >= 40) return "Prospect";
  return "New Lead";
}

// Generate recommended steps based on profile and memories
export function generateRecommendedSteps(profileData, memories) {
  const steps = [];
  
  // Check profile completeness
  if (!profileData?.profile?.email || !profileData?.profile?.phone) {
    steps.push({
      title: "Complete Your Profile",
      description: "Add missing contact information to help us serve you better",
      priority: "high",
    });
  }

  // Check service interests
  if (!profileData?.serviceInterests || Object.values(profileData.serviceInterests).every(v => v === 0)) {
    steps.push({
      title: "Select Your Interests",
      description: "Tell us what services you're interested in",
      priority: "medium",
    });
  }

  // Check recent activity
  const recentMemories = memories.filter(
    (m) => new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (recentMemories.length === 0) {
    steps.push({
      title: "Stay Engaged",
      description: "Continue your conversation to get personalized recommendations",
      priority: "low",
    });
  }

  return steps;
}
