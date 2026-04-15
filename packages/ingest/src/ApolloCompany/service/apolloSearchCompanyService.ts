import { createLogger } from "../../shared/platform";
import { ApolloSearchCompanyConfig, ApolloSearchCompanyOutput, ApolloCompany } from "../util/types";

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

function parseList(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRanges(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Search Apollo.io for organisations/companies
 * Uses /mixed_companies/search — supports keyword/description search + name, domain, location, industry, size
 */
export async function searchApolloCompanies(
  config: ApolloSearchCompanyConfig,
  context: any,
): Promise<ApolloSearchCompanyOutput> {
  const logger = createLogger("ApolloSearchCompany");

  const credentials = context.credentials?.apolloCredential || context.credentials;
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Apollo API key not found in credentials");
  }

  const limit = Math.round(config.limit ?? 25);
  const perPage = Math.min(limit, 100);

  const baseBody: Record<string, any> = { per_page: perPage };

  const keywords = parseList(config.keywords);
  if (keywords.length) baseBody.q_organization_keyword_tags = keywords;

  const industries = parseList(config.industries);
  if (industries.length) baseBody.organization_industries = industries.map((s) => s.toLowerCase());

  const organizationNames = parseList(config.organizationNames);
  if (organizationNames.length) baseBody.organization_names = organizationNames;

  const organizationDomains = parseList(config.organizationDomains);
  if (organizationDomains.length) baseBody.organization_domains = organizationDomains;

  const organizationLocations = parseList(config.organizationLocations);
  if (organizationLocations.length) baseBody.organization_locations = organizationLocations;

  const numEmployeesRanges = parseRanges(config.organizationNumEmployeesRanges);
  if (numEmployeesRanges.length) baseBody.organization_num_employees_ranges = numEmployeesRanges;

  logger.info("Calling Apollo Organization Search", {
    limit,
    per_page: perPage,
    filters: Object.keys(baseBody).filter((k) => k !== "per_page"),
    q_organization_keyword_tags: baseBody.q_organization_keyword_tags,
  });

  const allOrgs = new Map<string, any>();
  let totalCount = 0;
  let page = 1;

  while (allOrgs.size < limit) {
    const response = await fetch(`${APOLLO_API_BASE}/mixed_companies/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ ...baseBody, page }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Apollo API error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();

    if (page === 1) {
      totalCount = data.pagination?.total_entries ?? 0;
      logger.info("Apollo mixed_companies response keys", { keys: Object.keys(data) });
    }

    for (const o of data.organizations || []) allOrgs.set(o.id, o);
    for (const o of data.accounts || []) {
      const existing = allOrgs.get(o.id);
      allOrgs.set(o.id, existing ? { ...existing, ...o } : o);
    }

    const pageCount = (data.organizations?.length ?? 0) || (data.accounts?.length ?? 0);
    if (pageCount < perPage || allOrgs.size >= totalCount) break;
    page++;
  }

  const rawOrgs = Array.from(allOrgs.values()).slice(0, limit);

  const companies: ApolloCompany[] = rawOrgs.map(
    (o: any): ApolloCompany => ({
      id: o.id || "",
      name: o.name || "",
      website_url: o.website_url,
      linkedin_url: o.linkedin_url,
      twitter_url: o.twitter_url,
      facebook_url: o.facebook_url,
      primary_domain: o.primary_domain,
      industry: o.industry,
      estimated_num_employees: o.estimated_num_employees,
      city: o.city,
      state: o.state,
      country: o.country,
      short_description: o.short_description,
      founded_year: o.founded_year,
      annual_revenue: o.annual_revenue,
      phone: o.phone,
    }),
  );

  logger.info("Apollo Organization Search complete", {
    companies: companies.length,
    totalCount,
    pages: page,
  });

  return {
    companies,
    totalCount,
    page,
    perPage,
  };
}
