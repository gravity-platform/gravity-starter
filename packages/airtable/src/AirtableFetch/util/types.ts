export interface AirtableFetchConfig {
  baseId: string;
  tableId: string;
  filterFormula: string;
  fields: string;
  maxRecords: number;
  sortField: string;
  sortDirection: string;
  view: string;
  dedupField?: string;
}

export interface AirtableFetchExecutorOutput {
  __outputs: {
    records: Record<string, any>[];
    totalCount: number;
  };
}
