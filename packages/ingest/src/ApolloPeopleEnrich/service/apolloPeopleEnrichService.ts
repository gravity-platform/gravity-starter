import { createLogger } from "../../shared/platform";
import { ApolloPeopleEnrichConfig } from "../util/types";

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

/**
 * Enrich a single person via Apollo POST /people/match
 * Provide as many identifiers as possible for best match rate
 */
export async function enrichApolloPerson(
  config: ApolloPeopleEnrichConfig,
  context: any,
): Promise<{ person: Record<string, any> | null; found: boolean }> {
  const logger = createLogger("ApolloPeopleEnrich");

  const credentials = context.credentials?.apolloCredential || context.credentials;
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Apollo API key not found in credentials");
  }

  const body: Record<string, any> = {};

  if (config.firstName?.trim()) body.first_name = config.firstName.trim();
  if (config.lastName?.trim()) body.last_name = config.lastName.trim();
  if (config.email?.trim()) body.email = config.email.trim();
  if (config.domain?.trim()) body.domain = config.domain.trim();
  if (config.linkedinUrl?.trim()) body.linkedin_url = config.linkedinUrl.trim();
  if (config.organizationName?.trim()) body.organization_name = config.organizationName.trim();
  if (config.revealPersonalEmails) body.reveal_personal_emails = true;
  if (config.revealPhoneNumber) body.reveal_phone_number = true;

  logger.info("Calling Apollo People Enrichment", { identifiers: Object.keys(body) });

  const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Apollo API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const person = data.person ?? null;
  const found = !!person && !!person.id;

  logger.info("Apollo People Enrichment complete", { found });

  return { person, found };
}
