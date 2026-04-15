/**
 * Credential definitions for ingest package
 * Following the package specification pattern
 */

// SearchAPI Credential for web search
export const SearchAPICredential = {
  name: "searchapiCredential",
  displayName: "SearchAPI",
  description: "SearchAPI.io credentials for web search functionality",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your SearchAPI.io API key",
      placeholder: "Enter your SearchAPI.io API key",
    },
  ],
};

// Apify Credential for web scraping
export const ApifyCredential = {
  name: "apifyCredential",
  displayName: "Apify",
  description: "Apify API credentials for web scraping",
  properties: [
    {
      name: "token",
      displayName: "API Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Apify API token",
      placeholder: "Enter your Apify API token",
    },
  ],
};

// Hyperbrowser Credential for web scraping
export const HyperbrowserCredential = {
  name: "hyperbrowserCredential",
  displayName: "Hyperbrowser",
  description: "Hyperbrowser API credentials for web scraping",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Hyperbrowser API key",
      placeholder: "Enter your Hyperbrowser API key",
    },
  ],
};

// Google API Credential for Google Sheets
export const GoogleAPICredential = {
  name: "googleApiCredential",
  displayName: "Google API",
  description: "Google API credentials for accessing Google services",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Google API key with Sheets API enabled",
      placeholder: "Enter your Google API key",
    },
  ],
};

// Plaid Credential for banking data
export const PlaidCredential = {
  name: "plaidCredential",
  displayName: "Plaid",
  description: "Plaid API credentials for accessing banking data (Sandbox/Development/Production)",
  properties: [
    {
      name: "clientId",
      displayName: "Client ID",
      type: "string" as const,
      required: true,
      secret: false,
      description: "Your Plaid client ID from the Plaid Dashboard",
      placeholder: "Enter your Plaid client ID",
    },
    {
      name: "secret",
      displayName: "Secret",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Plaid secret key (use Sandbox secret for testing)",
      placeholder: "Enter your Plaid secret",
    },
    {
      name: "environment",
      displayName: "Environment",
      type: "string" as const,
      required: false,
      secret: false,
      description: "Plaid environment: sandbox, development, or production",
      placeholder: "sandbox",
      default: "sandbox",
    },
  ],
};

// Abyssale Credential for template rendering
export const AbyssaleCredential = {
  name: "abyssaleCredential",
  displayName: "Abyssale",
  description: "Abyssale API credentials for high-quality template rendering",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Abyssale API key from the dashboard",
      placeholder: "Enter your Abyssale API key",
    },
  ],
};

// Airtable Credential
export const AirtableCredential = {
  name: "airtableCredential",
  displayName: "Airtable",
  description: "Airtable Personal Access Token for reading and writing to Airtable bases",
  properties: [
    {
      name: "personalAccessToken",
      displayName: "Personal Access Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Airtable Personal Access Token (create at airtable.com/create/tokens)",
      placeholder: "patXXXXXXXXXXXXXX",
    },
  ],
};

// Apollo.io Credential for people and organisation search
export const ApolloCredential = {
  name: "apolloCredential",
  displayName: "Apollo.io",
  description: "Apollo.io master API key for people and organisation search",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Apollo.io master API key (required for search endpoints)",
      placeholder: "Enter your Apollo.io API key",
    },
  ],
};

// ElevenLabs Credential for text-to-speech
export const ElevenLabsCredential = {
  name: "elevenlabsCredential",
  displayName: "ElevenLabs",
  description: "ElevenLabs API credentials for high-quality text-to-speech",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your ElevenLabs API key from the dashboard",
      placeholder: "Enter your ElevenLabs API key",
    },
  ],
};
