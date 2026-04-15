export interface AirtableExistsConfig {
  baseId: string;
  tableId: string;
  field: string;
  value: string;
}

export interface AirtableExistsExecutorOutput {
  __outputs: {
    signal: { exists: boolean; recordId: string | null };
  };
}
