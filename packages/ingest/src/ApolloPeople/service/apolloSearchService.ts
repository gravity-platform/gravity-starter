import { createLogger } from "../../shared/platform";
import { ApolloSearchConfig, ApolloSearchOutput, ApolloPerson, ApolloOrganization } from "../util/types";

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

/**
 * Parse a comma-separated string into an array of trimmed strings
 */
function parseList(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Search Apollo.io for people and their organisations
 */
export async function searchApollopeople(config: ApolloSearchConfig, context: any): Promise<ApolloSearchOutput> {
  const logger = createLogger("ApolloSearch");

  const credentials = context.credentials?.apolloCredential || context.credentials;
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Apollo API key not found in credentials");
  }

  const body: Record<string, any> = {
    per_page: Math.round(config.perPage ?? 25),
    page: Math.round(config.page ?? 1),
  };

  const personTitles = parseList(config.personTitles);
  if (personTitles.length) body.person_titles = personTitles;

  const organizationNames = parseList(config.organizationNames);
  if (organizationNames.length) body.organization_names = organizationNames;

  const organizationDomains = parseList(config.organizationDomains);
  if (organizationDomains.length) body.q_organization_domains_list = organizationDomains;

  const personLocations = parseList(config.personLocations);
  if (personLocations.length) body.person_locations = personLocations;

  const personSeniorities = parseList(config.personSeniorities);
  if (personSeniorities.length) body.person_seniorities = personSeniorities;

  const personDepartments = parseList(config.personDepartments);
  if (personDepartments.length) body.person_departments = personDepartments;

  logger.info("Calling Apollo People Search", {
    page: body.page,
    per_page: body.per_page,
    filters: Object.keys(body).filter((k) => k !== "page" && k !== "per_page"),
  });

  const response = await fetch(`${APOLLO_API_BASE}/mixed_people/api_search`, {
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

  const people: ApolloPerson[] = (data.people || []).map(
    (p: any): ApolloPerson => ({
      id: p.id || "",
      name: p.name || `${p.first_name || ""} ${p.last_name || p.last_name_obfuscated || ""}`.trim(),
      first_name: p.first_name || "",
      last_name: p.last_name || p.last_name_obfuscated || "",
      title: p.title || "",
      email: p.email,
      linkedin_url: p.linkedin_url,
      twitter_url: p.twitter_url,
      github_url: p.github_url,
      facebook_url: p.facebook_url,
      city: p.city,
      state: p.state,
      country: p.country,
      departments: p.departments,
      seniority: p.seniority,
      headline: p.headline,
      photo_url: p.photo_url,
      phone_numbers: p.phone_numbers,
      organization: p.organization
        ? {
            id: p.organization?.id || "",
            name: p.organization?.name || "",
            website_url: p.organization.website_url,
            linkedin_url: p.organization.linkedin_url,
            twitter_url: p.organization.twitter_url,
            facebook_url: p.organization.facebook_url,
            primary_domain: p.organization.primary_domain,
            logo_url: p.organization.logo_url,
            industry: p.organization.industry,
            estimated_num_employees: p.organization.estimated_num_employees,
            city: p.organization.city,
            state: p.organization.state,
            country: p.organization.country,
            short_description: p.organization.short_description,
          }
        : undefined,
    }),
  );

  const organizationsMap = new Map<string, ApolloOrganization>();
  for (const p of people) {
    if (p.organization?.id && !organizationsMap.has(p.organization.id)) {
      organizationsMap.set(p.organization.id, p.organization as ApolloOrganization);
    }
  }
  const organizations = Array.from(organizationsMap.values());

  const totalCount: number = data.pagination?.total_entries ?? people.length;

  logger.info("Apollo People Search complete", {
    people: people.length,
    organizations: organizations.length,
    totalCount,
  });

  return {
    people,
    organizations,
    totalCount,
    page: data.pagination?.page ?? config.page ?? 1,
    perPage: data.pagination?.per_page ?? config.perPage ?? 25,
  };
}
