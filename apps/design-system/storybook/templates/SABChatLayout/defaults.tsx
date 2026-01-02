/**
 * SABChatLayout Template Defaults
 * Following the 3-state pattern: Initial, Streaming, Complete
 */

import { createMockClients } from "../core";
import AIResponse from "../../components/AIResponse/AIResponse";
import Card from "../../components/Card/Card";
import KenBurnsImage from "../../atoms/Image/KenBurnsImage";
import { AIResponseDefaults } from "../../components/AIResponse/defaults";
import { CardDefaults } from "../../components/Card/defaults";
import { KenBurnsImageDefaults } from "../../atoms/Image/defaults";
import { demoFaqs, demoActions } from "../../components/ChatInput/defaults";

// Use component defaults for suggestions (no duplication)
const defaultSuggestions = {
  faqs: demoFaqs,
  actions: demoActions,
  recommendations: [],
};

// Create all 3 states using shared factory
export const {
  mockHistoryInitial,
  mockHistoryStreaming,
  mockHistoryComplete,
  mockClientInitial,
  mockClientStreaming,
  mockClientComplete,
} = createMockClients(
  [
    { componentType: "AIResponse", Component: AIResponse, props: AIResponseDefaults },
    { componentType: "KenBurnsImage", Component: KenBurnsImage, props: KenBurnsImageDefaults },
    { componentType: "Card", Component: Card, props: CardDefaults },
  ],
  { suggestions: defaultSuggestions }
);

// Template-specific defaults
export const SABChatLayoutDefaults = {
  placeholder: "Ask me anything...",
  autoScroll: true,
  brandName: "SAB Smart Assistant",
  brandSubtitle: "How can I help you today?",
  logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1764865338/SAB/sablogo.jpg",
  suggestions: [
    {
      icon: "creditCard",
      title: "Travel Cards",
      question: "What card is best for travel?",
    },
    {
      icon: "banknotes",
      title: "Make Transfer",
      question: "Transfer money to kieran",
    },
    {
      icon: "newcard",
      title: "New Card",
      question: "Which card should I apply for?",
    },
    {
      icon: "chatBubble",
      title: "Live Support",
      question: "I want to speak to a real person",
    },
  ],
};
