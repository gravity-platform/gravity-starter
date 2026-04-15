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
