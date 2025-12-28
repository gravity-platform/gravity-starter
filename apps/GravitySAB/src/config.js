// App configuration

export const workflowConfig = {
  workflowId: "wf-r4jzo7",
  targetTriggerNode: "inputtrigger5",
};

export const apiUrl = import.meta.env.VITE_API_URL;
export const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;

// Amazon Connect configuration (loaded from env vars)
// Only create config if all required values are present
const acApiGateway = import.meta.env.VITE_API_GATEWAY_ENDPOINT;
const acContactFlowId = import.meta.env.VITE_CONTACT_FLOW_ID;
const acInstanceId = import.meta.env.VITE_INSTANCE_ID;
const acRegion = import.meta.env.VITE_CONNECT_REGION || "eu-central-1";

export const amazonConnectConfig =
  acApiGateway && acContactFlowId && acInstanceId
    ? {
        apiGatewayEndpoint: acApiGateway,
        contactFlowId: acContactFlowId,
        instanceId: acInstanceId,
        region: acRegion,
      }
    : undefined;

// Debug: log config on load
console.log(
  "[Config] amazonConnectConfig:",
  amazonConnectConfig ? "configured" : "NOT SET - add VITE_AMAZON_CONNECT_* env vars"
);
