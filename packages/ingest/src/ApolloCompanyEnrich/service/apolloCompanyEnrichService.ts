import { createLogger } from "../../shared/platform";
import { ApolloCompanyEnrichConfig } from "../util/types";

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

/**
 * Enrich a single company via Apollo GET /organizations/enrich?domain=...
 */
export async function enrichApolloCompany(
  config: ApolloCompanyEnrichConfig,
  context: any,
): Promise<{ company: Record<string, any> | null; found: boolean }> {
  const logger = createLogger("ApolloCompanyEnrich");

  const credentials = context.credentials?.apolloCredential || context.credentials;
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Apollo API key not found in credentials");
  }

  const domain = config.domain?.trim();
  if (!domain) {
    throw new Error("Company domain is required for enrichment");
  }

  logger.info("Calling Apollo Organization Enrichment", { domain });

  const url = `${APOLLO_API_BASE}/organizations/enrich?domain=${encodeURIComponent(domain)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Apollo API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const company = data.organization ?? null;
  const found = !!company && !!company.id;

  logger.info("Apollo Organization Enrichment complete", { found, name: company?.name });

  return { company, found };
}
