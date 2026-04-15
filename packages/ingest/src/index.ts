import { createPlugin } from "@gravity-platform/plugin-base";

// Create and export the plugin
const plugin = createPlugin({
  name: "@gravity-platform/ingest",
  version: "1.0.0",
  description: "Data ingestion nodes for Gravity workflow system",

  async setup(api) {
    // Initialize platform dependencies
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import and register DocumentParser node
    const { DocumentParserNode } = await import("./DocumentParser/node");
    api.registerNode(DocumentParserNode);

    // Import and register Document node
    const { DocumentNode } = await import("./Document/node");
    api.registerNode(DocumentNode);

    // Import and register SearchWeb node
    const { SearchWebNode } = await import("./SearchWeb/node");
    api.registerNode(SearchWebNode);

    // Import and register ApifyResults node
    const { ApifyResultsNode } = await import("./ApifyResults/node");
    api.registerNode(ApifyResultsNode);

    // Import and register ApifyStarter node
    const { ApifyStarterNode } = await import("./ApifyStarter/node");
    api.registerNode(ApifyStarterNode);

    // Import and register Hyperbrowser node
    const { HyperbrowserNode } = await import("./Hyperbrowser/node");
    api.registerNode(HyperbrowserNode);

    // Import and register GoogleSheet node
    const { GoogleSheetNode } = await import("./GoogleSheet/node");
    api.registerNode(GoogleSheetNode);

    // Import and register PlaidTransactions node
    const { PlaidTransactionsNode } = await import("./PlaidTransactions/node");
    api.registerNode(PlaidTransactionsNode);

    // Import and register Abyssale node
    const { AbyssaleNode } = await import("./Abyssale/node");
    api.registerNode(AbyssaleNode);

    // Import and register ElevenLabs node
    const { ElevenLabsNode } = await import("./ElevenLabs/node");
    api.registerNode(ElevenLabsNode);

    // Import and register SpatialIngest node
    const { SpatialIngestNode } = await import("./SpatialIngest/node");
    api.registerNode(SpatialIngestNode);

    // Import and register ApolloPeople node
    const { ApolloPeopleNode } = await import("./ApolloPeople/node");
    api.registerNode(ApolloPeopleNode);

    // Import and register ApolloCompany node
    const { ApolloCompanyNode } = await import("./ApolloCompany/node");
    api.registerNode(ApolloCompanyNode);

    // Import and register ApolloPeopleEnrich node
    const { ApolloPeopleEnrichNode } = await import("./ApolloPeopleEnrich/node");
    api.registerNode(ApolloPeopleEnrichNode);

    // Import and register ApolloCompanyEnrich node
    const { ApolloCompanyEnrichNode } = await import("./ApolloCompanyEnrich/node");
    api.registerNode(ApolloCompanyEnrichNode);

    // Import and register credentials
    const {
      SearchAPICredential,
      ApifyCredential,
      HyperbrowserCredential,
      GoogleAPICredential,
      PlaidCredential,
      AbyssaleCredential,
      ElevenLabsCredential,
      ApolloCredential,
    } = await import("./credentials");
    api.registerCredential(SearchAPICredential);
    api.registerCredential(ApifyCredential);
    api.registerCredential(HyperbrowserCredential);
    api.registerCredential(GoogleAPICredential);
    api.registerCredential(PlaidCredential);
    api.registerCredential(AbyssaleCredential);
    api.registerCredential(ElevenLabsCredential);
    api.registerCredential(ApolloCredential);
  },
});

export default plugin;
