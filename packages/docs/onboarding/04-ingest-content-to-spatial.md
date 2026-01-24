# Challenge 4: Ingest Content to Spatial

Add content to the spatial search index for semantic discovery.

## Goal

- Set up Apify credentials
- Import content from Apify into Spatial
- Train the UMAP model and apply clustering

## Step 1: Set Up Apify Credentials

1. Open Canvas and go to **Credentials** (http://localhost:3001/credentials)
2. Click **Add Credential**
3. Select **Apify** credential type
4. Configure:
   - **Scope**: Check both ✅ Workflow and ✅ Platform
   - **Name**: `Apify`
   - **API Token**: `YOUR_APIFY_TOKEN`
5. Click **Save Credential**

## Step 2: Open Spatial

1. In Canvas, click the **Spatial** button in the header
2. You'll see the 3D visualization space

## Step 3: Import from Apify

1. Click the **Import** button (or connector icon)
2. Select **Apify** as the data source
3. Configure the connection:
   - **Dataset ID or Run ID**: `WFfJUKJ7mIJOdTTPW`
   - **Process Full Run**: ✅ Enabled
4. Click **Import**
5. Wait for items to be ingested (e.g., 220 items)

## Step 4: Train the Model

1. Click the **Train** tab in the left panel
2. Keep defaults (Balanced clustering)
3. Click **Apply Clustering**
4. Wait for training to complete

## Step 5: Explore Your Data

Once training is complete:

- Points are colored by cluster
- Hover over points to see content
- Double-click a point to open and explore the content
- Use the search to find semantically similar items
- Clusters represent related content themes

## Step 6: Test Spatial Search

1. Click the **Search** icon (magnifying glass) in the header
2. Enter a query (e.g., "golf swing assessment")
3. Adjust settings:
   - **Radius**: 250 (UMAP units)
   - **Max Results**: 100
4. View results - semantically similar content is highlighted

## Using Spatial in Workflows

Now you can use the **PostgresFetch** node in your workflows:

```handlebars
Context:
{{#each signal.postgresfetch1.output.results}}
  -
  {{this.content}}
{{/each}}

Question:
{{{signal.inputtrigger1.output.message}}}
```

## ✅ Challenge Complete

Your spatial index is ready for semantic search! Proceed to [Challenge 5: Components and Templates](./05-components-and-templates.md).
