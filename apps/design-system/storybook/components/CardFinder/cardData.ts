// Credit Card Eligibility Widget - SAB Card Data & Routing Logic

import { CreditCard, CardFamily } from "./types";

// SAB Card Images - from https://www.sab.com/en/personal/compare-credit-cards/
const CARD_IMAGES = {
  emirates_infinite: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/ek-visa-472X296.png",
  alfursan_black: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/alfursan-mastercard-472X296.png",
  visa_signature: "https://res.cloudinary.com/sonik/image/upload/v1766077415/SAB/visa-signature-472X296.png",
  visa_cashback: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/visa-cashback-472X296.png",
  premier_mastercard: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/premier-472X296.png",
  advance_visa_platinum: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/visa-platinum-472X296.png",
  visa_platinum: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/visa-platinum-472X296.png",
  platinum_mastercard: "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/alfursan-mastercard-472X296.png",
};

export const SAB_CARDS: CreditCard[] = [
  {
    id: "sab_emirates_visa_infinite",
    name: "SAB Emirates Infinite",
    network: "VISA",
    tier: "Infinite",
    family: "airline-premium",
    positioning: "Travel + lifestyle card with Emirates Skywards benefits.",
    imageUrl: CARD_IMAGES.emirates_infinite,
    annualFee: 750,
    annualFeeNotes: "Applicable from first year (without VAT)",
    keyBenefits: [
      "Earn 2 Skywards Miles per SAR 3.75 on Emirates",
      "Unlimited lounge access (1,200+ lounges)",
      "Complimentary Emirates Skywards Silver membership",
      "50,000 bonus miles on SAR 50K spend in 6 months",
    ],
    uiTags: ["Travel", "Emirates", "Miles", "Premium", "Lounge", "Concierge"],
  },
  {
    id: "sab_alfursan_black_mastercard",
    name: "SAB AlFursan BLACK",
    network: "Mastercard",
    tier: "BLACK",
    family: "airline-premium",
    positioning: "Luxury travel card with SAUDIA AlFursan miles acceleration.",
    imageUrl: CARD_IMAGES.alfursan_black,
    annualFee: null,
    annualFeeNotes: "Free for first year (Feb-Dec 2025)",
    keyBenefits: [
      "30,000 miles upon activation",
      "1 mile per SAR 1 on international transactions",
      "Lounge access (1,000+ lounges) + 1 guest",
      "Fast Track to SAUDIA Silver Tier",
    ],
    uiTags: ["Travel", "Miles", "SAUDIA", "Premium", "Lounge"],
  },
  {
    id: "sab_visa_signature",
    name: "SAB VISA Signature",
    network: "VISA",
    tier: "Signature",
    family: "premium-travel",
    positioning: "Premium travel and lifestyle card with lounge access, insurance, and concierge.",
    imageUrl: CARD_IMAGES.visa_signature,
    annualFee: null,
    annualFeeNotes: "Contact SAB for details",
    keyBenefits: [
      "12 lounge visits per year (1,200+ lounges)",
      "Multi-trip travel insurance (up to 90 days)",
      "24/7 Visa concierge service",
      "Free credit protection",
    ],
    uiTags: ["Travel", "Premium", "Lounge", "Insurance", "Concierge"],
  },
  {
    id: "sab_premier_mastercard",
    name: "SAB Premier Mastercard",
    network: "Mastercard",
    tier: "Premier World",
    family: "premium-travel",
    positioning: "Premium Mastercard with unlimited lounge access and strong travel insurance.",
    imageUrl: CARD_IMAGES.premier_mastercard,
    annualFee: null,
    annualFeeNotes: "Contact SAB for details",
    keyBenefits: [
      "Unlimited lounge access (1,200+ lounges)",
      "Travel medical insurance up to SAR 1,875,000",
      "Primary + supplementary can each bring 1 guest",
      "Free credit protection",
    ],
    uiTags: ["Premium", "Mastercard", "Lounge", "Insurance"],
  },
  {
    id: "sab_visa_platinum",
    name: "SAB VISA Platinum",
    network: "VISA",
    tier: "Platinum",
    family: "mid-tier",
    positioning: "On-the-move Visa Platinum with lounge access and travel assistance.",
    imageUrl: CARD_IMAGES.visa_platinum,
    annualFee: null,
    annualFeeNotes: "Contact SAB for details",
    keyBenefits: [
      "6 lounge visits per year (25 lounges)",
      "Medical & travel assistance",
      "Extended warranty (up to 1 year)",
      "ICSAB+ loyalty points",
    ],
    uiTags: ["Travel", "Platinum", "Lounge"],
  },
  {
    id: "sab_advance_visa_platinum",
    name: "SAB Advance Visa Platinum",
    network: "VISA",
    tier: "Platinum (Advance)",
    family: "mid-tier",
    positioning: "Travel-focused Visa Platinum with lounge access and SAB add-ons.",
    imageUrl: CARD_IMAGES.advance_visa_platinum,
    annualFee: null,
    annualFeeNotes: "Contact SAB for details",
    keyBenefits: [
      "6 lounge visits per year (25 lounges)",
      "YQ Meet & Assist (15% off)",
      "Medical & travel assistance",
      "ICSAB+ loyalty points",
    ],
    uiTags: ["Travel", "Platinum", "Lounge"],
  },
  {
    id: "sab_platinum_mastercard",
    name: "SAB Platinum Mastercard",
    network: "Mastercard",
    tier: "Platinum",
    family: "mid-tier",
    positioning: "Mastercard Platinum with Travel Pass lounge access.",
    imageUrl: CARD_IMAGES.platinum_mastercard,
    annualFee: null,
    annualFeeNotes: "Contact SAB for details",
    keyBenefits: [
      "Lounge access via Mastercard Travel Pass",
      "Medical & travel assistance",
      "ICSAB+ loyalty points",
      "Free credit protection",
    ],
    uiTags: ["Mastercard", "Platinum", "Lounge"],
  },
  {
    id: "sab_visa_cashback",
    name: "SAB Visa Cashback",
    network: "VISA",
    tier: "Cashback",
    family: "cashback",
    positioning: "Everyday spending cashback card with category boosts.",
    imageUrl: CARD_IMAGES.visa_cashback,
    annualFee: 0,
    annualFeeNotes: "Free for life",
    keyBenefits: [
      "1% unlimited cashback on domestic",
      "2% unlimited cashback on international",
      "Up to 10% on 3 preferred categories",
      "6 lounge visits per year",
    ],
    uiTags: ["Cashback", "Everyday", "Free", "Light Travel"],
  },
];

// Helper to get card by ID
export function getCardById(id: string): CreditCard | undefined {
  return SAB_CARDS.find((card) => card.id === id);
}

// Helper to get cards by family
export function getCardsByFamily(family: CardFamily): CreditCard[] {
  return SAB_CARDS.filter((card) => card.family === family);
}

// Card family descriptions for UI
export const CARD_FAMILY_INFO: Record<CardFamily, { name: string; description: string }> = {
  "airline-premium": {
    name: "Airline Premium",
    description: "Maximum miles earning with your preferred airline",
  },
  "premium-travel": {
    name: "Premium Travel",
    description: "Flexible travel benefits without airline lock-in",
  },
  "mid-tier": {
    name: "Travel Essentials",
    description: "Core travel perks at accessible price points",
  },
  cashback: {
    name: "Cashback",
    description: "Earn money back on everyday spending",
  },
};
