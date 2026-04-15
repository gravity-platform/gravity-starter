/**
 * Type definitions for ApolloCompanyEnrich node
 */

export interface ApolloCompanyEnrichConfig {
  domain: string;
}

export interface ApolloCompanyEnrichExecutorOutput {
  __outputs: {
    company: Record<string, any> | null;
    found: boolean;
  };
}
