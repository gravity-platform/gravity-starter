// Credit Card Eligibility Widget - Default/Mock Data for Storybook

import {
  BestFitAnswers,
  PolicySafetyAnswers,
  CardRecommendation,
  EligibilityResult,
  CreditCardEligibilityState,
  QuestionOption,
  PrimaryGoal,
  AirlinePreference,
  TravelFrequency,
  FeeTolerance,
  IncomeRange,
  SalaryTransfer,
  Residency,
} from "./types";
import { SAB_CARDS, getCardById } from "./cardData";

// Question options for Phase 1: Eligibility
// Apple-style: No icons for simple choices, let the text speak
export const INCOME_RANGE_OPTIONS: QuestionOption<IncomeRange>[] = [
  {
    value: "<7000",
    label: "Less than 7,000 SAR",
  },
  {
    value: "7000-12000",
    label: "7,000 – 12,000 SAR",
  },
  {
    value: "12000-20000",
    label: "12,000 – 20,000 SAR",
  },
  {
    value: "20000+",
    label: "20,000+ SAR",
  },
];

export const SALARY_TRANSFER_OPTIONS: QuestionOption<SalaryTransfer>[] = [
  {
    value: "yes",
    label: "Yes",
    description: "My salary is transferred to SAB",
  },
  {
    value: "no",
    label: "No",
    description: "My salary goes to another bank",
  },
  {
    value: "unsure",
    label: "Not sure",
    description: "I need to check",
  },
];

export const RESIDENCY_OPTIONS: QuestionOption<Residency>[] = [
  {
    value: "saudi",
    label: "Saudi National",
  },
  {
    value: "non-saudi",
    label: "Non-Saudi Resident",
  },
];

// Question options for Phase 2: Best Fit
// Apple-style: Clean descriptions, no emoji clutter
export const PRIMARY_GOAL_OPTIONS: QuestionOption<PrimaryGoal>[] = [
  {
    value: "cashback",
    label: "Cashback",
    description: "Earn money back on everyday purchases",
  },
  {
    value: "travel",
    label: "Travel perks",
    description: "Lounges, insurance, and travel benefits",
  },
  {
    value: "miles",
    label: "Airline miles",
    description: "Earn miles with your preferred airline",
  },
  {
    value: "premium",
    label: "Premium lifestyle",
    description: "Concierge, exclusive access, and luxury perks",
  },
];

export const AIRLINE_PREFERENCE_OPTIONS: QuestionOption<AirlinePreference>[] = [
  {
    value: "emirates",
    label: "Emirates",
    description: "Earn Skywards miles",
  },
  {
    value: "saudia",
    label: "SAUDIA",
    description: "Earn AlFursan miles",
  },
  {
    value: "none",
    label: "No preference",
    description: "Flexible rewards across airlines",
  },
];

export const TRAVEL_FREQUENCY_OPTIONS: QuestionOption<TravelFrequency>[] = [
  {
    value: "0-1",
    label: "0–1 flights per year",
    description: "Occasional traveler",
  },
  {
    value: "2-4",
    label: "2–4 flights per year",
    description: "Regular traveler",
  },
  {
    value: "5-10",
    label: "5–10 flights per year",
    description: "Frequent traveler",
  },
  {
    value: "10+",
    label: "10+ flights per year",
    description: "Very frequent traveler",
  },
];

export const FEE_TOLERANCE_OPTIONS: QuestionOption<FeeTolerance>[] = [
  {
    value: "low",
    label: "Prefer free / low fee",
    description: "Keep costs minimal",
  },
  {
    value: "medium",
    label: "Will pay if value is clear",
    description: "Balance cost and benefits",
  },
  {
    value: "high",
    label: "Happy to pay for premium",
    description: "Best perks matter most",
  },
];

// Default states for Storybook stories

export const defaultBestFitAnswers: BestFitAnswers = {};

export const completedBestFitAnswers: BestFitAnswers = {
  primaryGoal: "miles",
  airlinePreference: "emirates",
  travelFrequency: "5-10",
  feeTolerance: "high",
};

export const defaultPolicySafetyAnswers: PolicySafetyAnswers = {};

export const completedPolicySafetyAnswers: PolicySafetyAnswers = {
  incomeRange: "12000-20000",
  salaryTransfer: "yes",
  residency: "saudi",
};

export const borderlinePolicySafetyAnswers: PolicySafetyAnswers = {
  incomeRange: "7000-12000",
  salaryTransfer: "no",
  residency: "saudi",
};

// Mock recommendations
const emiratesCard = getCardById("sab_emirates_visa_infinite")!;
const signatureCard = getCardById("sab_visa_signature")!;
const cashbackCard = getCardById("sab_visa_cashback")!;

export const defaultRecommendedCard: CardRecommendation = {
  card: emiratesCard,
  fitScore: 95,
  fitReasons: [
    "Perfect match for Emirates Skywards miles earning",
    "Unlimited lounge access for frequent travelers",
    "Premium concierge aligns with lifestyle preferences",
  ],
};

export const defaultRunnerUpCard: CardRecommendation = {
  card: signatureCard,
  fitScore: 78,
  fitReasons: [
    "Strong travel benefits without airline lock-in",
    "Good lounge access (12 visits/year)",
    "Lower annual fee than Emirates Infinite",
  ],
};

export const cashbackRecommendation: CardRecommendation = {
  card: cashbackCard,
  fitScore: 92,
  fitReasons: [
    "Free for life - no annual fee",
    "Up to 10% cashback on preferred categories",
    "Light travel perks included",
  ],
};

// Mock eligibility results
export const safeEligibilityResult: EligibilityResult = {
  status: "safe",
  policyReasons: [
    "Income level meets card requirements",
    "Salary transfer to SAB boosts approval confidence",
    "Strong overall profile for this card tier",
  ],
  improvementTips: [],
};

export const borderlineEligibilityResult: EligibilityResult = {
  status: "borderline",
  policyReasons: [
    "Income slightly below typical approvals for this card",
    "No salary transfer reduces approval confidence",
  ],
  improvementTips: [
    "Transfer salary to SAB to significantly improve chances",
    "Consider SAB VISA Signature as a safer alternative",
    "Build relationship with SAB through other products",
  ],
};

export const notAdvisedEligibilityResult: EligibilityResult = {
  status: "not-advised",
  policyReasons: ["Income level below minimum for premium cards", "High rejection likelihood at this time"],
  improvementTips: [
    "Start with SAB Visa Cashback (no income requirement)",
    "Build credit history with SAB",
    "Reapply when income increases",
  ],
};

// Complete state examples for different scenarios
export const initialState: Partial<CreditCardEligibilityState> = {
  currentPhase: "eligibility",
  currentQuestion: 0,
  eligibilityAnswers: {},
  bestFitAnswers: {},
};

export const midEligibilityState: Partial<CreditCardEligibilityState> = {
  currentPhase: "eligibility",
  currentQuestion: 1,
  eligibilityAnswers: {
    incomeRange: "12000-20000",
  },
  bestFitAnswers: {},
};

export const eligibilityCompleteState: Partial<CreditCardEligibilityState> = {
  currentPhase: "eligibility",
  currentQuestion: 3,
  eligibilityAnswers: completedPolicySafetyAnswers,
  eligibleTiers: ["airline-premium", "premium-travel", "mid-tier", "cashback"],
  bestFitAnswers: {},
};

export const bestFitInProgressState: Partial<CreditCardEligibilityState> = {
  currentPhase: "best-fit",
  currentQuestion: 1,
  eligibilityAnswers: completedPolicySafetyAnswers,
  eligibleTiers: ["airline-premium", "premium-travel", "mid-tier", "cashback"],
  bestFitAnswers: {
    primaryGoal: "miles",
  },
};

export const bestFitCompleteState: Partial<CreditCardEligibilityState> = {
  currentPhase: "best-fit",
  currentQuestion: 4,
  eligibilityAnswers: completedPolicySafetyAnswers,
  eligibleTiers: ["airline-premium", "premium-travel", "mid-tier", "cashback"],
  bestFitAnswers: completedBestFitAnswers,
  recommendedCard: defaultRecommendedCard,
  runnerUpCard: defaultRunnerUpCard,
};

export const resultState: Partial<CreditCardEligibilityState> = {
  currentPhase: "result",
  currentQuestion: 0,
  eligibilityAnswers: completedPolicySafetyAnswers,
  eligibleTiers: ["airline-premium", "premium-travel", "mid-tier", "cashback"],
  bestFitAnswers: completedBestFitAnswers,
  recommendedCard: defaultRecommendedCard,
  runnerUpCard: defaultRunnerUpCard,
};

export const borderlineEligibilityState: Partial<CreditCardEligibilityState> = {
  currentPhase: "eligibility",
  currentQuestion: 3,
  eligibilityAnswers: borderlinePolicySafetyAnswers,
  eligibleTiers: ["mid-tier", "cashback"],
  bestFitAnswers: {},
};

export const lowIncomeEligibilityState: Partial<CreditCardEligibilityState> = {
  currentPhase: "eligibility",
  currentQuestion: 3,
  eligibilityAnswers: {
    incomeRange: "<7000",
    salaryTransfer: "no",
    residency: "saudi",
  },
  eligibleTiers: ["cashback"],
  bestFitAnswers: {},
};

// Default hero image (same as AccountTransferWidget)
export const DEFAULT_HERO_IMAGE = "https://res.cloudinary.com/sonik/image/upload/v1767543207/SAB/travel.jpg";
