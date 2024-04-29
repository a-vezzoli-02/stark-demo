export type TableSchema = {
  version: number;
  properties: TableProperties;
};

export type TableProperties = {
  name: string;
  tableName?: string;
  columns: TableColumn[];
};

export type TableColumn = {
  name: string;
  columName?: string;
  type: string;
  columnType?: string;
  isPrimary?: boolean;
  isAutoIncrement?: boolean;
  isNullable?: boolean;
  relation?: string;
};
