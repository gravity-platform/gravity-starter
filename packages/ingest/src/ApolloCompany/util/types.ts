/**
 * Type definitions for ApolloSearchCompany node
 */

export interface ApolloSearchCompanyConfig {
  keywords: string;
  organizationNames: string;
  organizationDomains: string;
  organizationLocations: string;
  industries: string;
  organizationNumEmployeesRanges: string;
  limit: number;
}

export interface ApolloCompany {
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
  founded_year?: number;
  annual_revenue?: number;
  phone?: string;
}

export interface ApolloSearchCompanyOutput {
  companies: ApolloCompany[];
  totalCount: number;
  page: number;
  perPage: number;
}

export interface ApolloSearchCompanyExecutorOutput {
  __outputs: {
    companies: ApolloCompany[];
    totalCount: number;
    page: number;
    perPage: number;
  };
}
