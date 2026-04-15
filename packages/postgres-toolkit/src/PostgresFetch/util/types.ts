export interface PostgresFetchConfig {
  connectionString: string;
  tableName: string;
  columns?: string;
  filterColumn?: string;
  filterOperator?: string;
  filterValue?: string;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

export interface PostgresFetchOutput {
  success: boolean;
  rows: any[];
  rowCount: number;
  tableName: string;
}
