export interface SendEmailConfig {
  provider: "microsoft365";
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyType?: "text" | "html";
  autoLinkUrls?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  gaMeasurementId?: string;
  cc?: string;
  bcc?: string;
}

export interface SendEmailExecutorOutput {
  __outputs: {
    sent: boolean;
    messageId: string;
  };
}
