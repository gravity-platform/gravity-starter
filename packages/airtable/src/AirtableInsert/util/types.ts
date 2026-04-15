export interface AirtableInsertConfig {
  baseId: string;
  tableId: string;
  records: any;
  dedupField: string;
}

export interface AirtableInsertExecutorOutput {
  __outputs: {
    inserted: number;
    skipped: number;
    total: number;
    errors: string[];
  };
}
