// You can name this file dremioInterfaces.ts (no JSX, so .tsx isn't necessary)

export interface SchemaItem {
      schema: string;
      schemaName: string;
    }
    
    export interface TableItem {
      schemaName: string;
      tableName: string;
    }
    
    export interface ColumnItem {
      COLUMN_NAME: string;
      COLUMN_SIZE: number;
      NUMERIC_PRECISION: number;
      IS_NULLABLE: string;
      DATA_TYPE: string;
    }
    