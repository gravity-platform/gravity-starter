/**
 * Type definitions for ApolloPeopleEnrich node
 */

export interface ApolloPeopleEnrichConfig {
  firstName: string;
  lastName: string;
  email: string;
  domain: string;
  linkedinUrl: string;
  organizationName: string;
  revealPersonalEmails: boolean;
  revealPhoneNumber: boolean;
}

export interface ApolloPeopleEnrichExecutorOutput {
  __outputs: {
    person: Record<string, any> | null;
    found: boolean;
  };
}
