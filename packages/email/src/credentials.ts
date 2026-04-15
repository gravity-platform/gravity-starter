export const Microsoft365Credential = {
  name: "microsoft365Credential",
  displayName: "Microsoft 365",
  description: "SMTP credentials for Microsoft 365. Enable SMTP AUTH for the mailbox in M365 Admin Center first.",
  properties: [
    {
      name: "username",
      displayName: "Email Address",
      type: "string" as const,
      required: true,
      secret: false,
      description: "Your full Microsoft 365 email address (e.g. you@yourdomain.com)",
      placeholder: "you@yourdomain.com",
    },
    {
      name: "password",
      displayName: "Password / App Password",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your M365 password or an App Password if MFA is enabled on the account",
      placeholder: "",
    },
  ],
};
