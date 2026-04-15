/**
 * Type definitions for ApolloSearch node
 */

export interface ApolloSearchConfig {
  personTitles: string;
  personLocations: string;
  personSeniorities: string;
  personDepartments: string;
  organizationNames: string;
  organizationDomains: string;
  perPage: number;
  page: number;
}

export interface ApolloPerson {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  email?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: ApolloOrganization;
  departments?: string[];
  seniority?: string;
  headline?: string;
  photo_url?: string;
  phone_numbers?: Array<{ raw_number: string; type: string }>;
}

export interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  primary_domain?: string;
  logo_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  city?: string;
  state?: string;
  country?: string;
  short_description?: string;
}

export interface ApolloSearchOutput {
  people: ApolloPerson[];
  organizations: ApolloOrganization[];
  totalCount: number;
  page: number;
  perPage: number;
}

export interface ApolloSearchExecutorOutput {
  __outputs: {
    people: ApolloPerson[];
    organizations: ApolloOrganization[];
    totalCount: number;
    page: number;
    perPage: number;
  };
}
