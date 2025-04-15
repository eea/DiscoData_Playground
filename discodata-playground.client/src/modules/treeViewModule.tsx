import React from "react";
import { useEffect, useState } from "react";
import { fetchData } from "../services/discoDataApi";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import CustomTreeItem from "../custom/customTreeItem";
import {
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  LinearProgress
} from '@mui/material';
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import AbcIcon from "@mui/icons-material/Abc";
import Grid3x3Icon from "@mui/icons-material/Grid3x3";
import ListIcon from "@mui/icons-material/List";

interface Props {
  selectedTreeViewItem: string;
  onItemSelected: (item: { type: string; name: string; table?: string; schema?: string }) => void;
}

const MyTreeViewModule = ({ onItemSelected }: Props) => {
  const [dremioSchema, setDremioSchema] = useState<Record<string, any>[] | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<Record<string, any[]>>({});
  const [selectedTable, setSelectedTable] = useState<Record<string, any[]>>({});
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [origin, setOrigin] = useState<string>("discodata"); // Set default value to the first MenuItem
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    loadDremioSchema(origin); // Load schema when component mounts or origin changes
  }, [origin]);

  const loadDremioSchema = async (origin: string) => {
    try {
      setLoading(true);
      const result = await fetchData(`/getSchema/${origin}`); // Pass origin to the endpoint
      console.log("Schema data:", result);
      setDremioSchema(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleOriginChange = (event: SelectChangeEvent) => {
    setOrigin(event.target.value);
  };

  // Function to load tables dynamically when a schema is clicked
  const handleSchemaClick = async (tableSchema: string, index: number) => {
    if (!selectedSchema[tableSchema]) {
      try {
        const result = await fetchData(`/getTable/${tableSchema}`);
        console.log("Tables for", tableSchema, result);
        setSelectedSchema((prev) => ({ ...prev, [tableSchema]: result }));
        setExpandedItems((prev) => [...prev, `schema-${tableSchema}-${index}`]);
      } catch (error) {
        console.error(`Error fetching tables for ${tableSchema}`, error);
      }
    }

    // Notify the parent component
    onItemSelected({ type: "schema", name: tableSchema });
  };

  // Function to load columns dynamically when a table is clicked
  const handleTableClick = async (tableSchema: string, tableName: string, tableIndex: number) => {
    const tableKey = `${tableSchema}-${tableName}`;
    if (!selectedTable[tableKey]) {
      try {
        const result = await fetchData(`/getColumn/${tableSchema}/${tableName}`);
        setSelectedTable((prev) => ({ ...prev, [tableKey]: result }));
        setExpandedItems((prev) => [...prev, `table-${tableSchema}-${tableName}-${tableIndex}`]);
      } catch (error) {
        console.error(`Error fetching columns for ${tableName}`, error);
      }
    }

    // Notify the parent component
    onItemSelected({ type: "table", name: tableName, schema: tableSchema });
  };

  const handleColumnClick = (tableSchema: string, tableName: string, columnName: string) => {
    // Notify the parent component
    onItemSelected({ type: "column", name: columnName, schema: tableSchema, table: tableName });

    // Expand the column node if needed
    setExpandedItems((prev) => [...prev, `column-${tableSchema}-${tableName}-${columnName}`]);
  };

  const handleExpandedItemsChange = (event: React.SyntheticEvent, itemIds: string[]) => {
    setExpandedItems(itemIds);
  };

  return (
    <div>
      {/* Select to pick the origine from dremio */}
      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small-label">Origin</InputLabel>
        <Select labelId="demo-select-small-label" id="demo-select-small" value={origin} label="Origin" onChange={handleOriginChange}>
          <MenuItem value={"discodata"}>discodata</MenuItem>
          <MenuItem value={"datasets"}>SDI(statistcal data)</MenuItem>
        </Select>
      </FormControl>

      <div className="min-h-3 p-1">{loading && (<LinearProgress className="m-1" color="success" />)}</div>

      <SimpleTreeView
        onExpandedItemsChange={handleExpandedItemsChange} expandedItems={expandedItems}>
        {/* Render Schemas */}
        {dremioSchema ? (
          dremioSchema.map((schema, index) => {
            const schemaKey = schema.TABLE_SCHEMA;
            return (
              <CustomTreeItem
                key={index}
                itemId={`schema-${schemaKey}-${index}`}
                label={schema.schemaName}
                labelIcon={ListIcon}
                onClick={() => handleSchemaClick(schemaKey, index)}
              >
                {/* Render Tables */}
                {selectedSchema[schemaKey]?.map((table, tableIndex) => {
                  const tableKey = `${schemaKey}-${table.TABLE_NAME}`;
                  return (
                    <CustomTreeItem
                      key={tableIndex}
                      itemId={`table-${schemaKey}-${table.TABLE_NAME}-${tableIndex}`}
                      label={table.TABLE_NAME}
                      labelIcon={AutoAwesomeMotionIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableClick(schemaKey, table.TABLE_NAME, tableIndex);
                      }}
                    >
                      {/* Render Columns */}
                      {selectedTable[tableKey]?.map((column, colIndex) => {
                        let ColumnIcon = Grid3x3Icon; // Default icon

                        switch (column.DATA_TYPE) {
                          case "CHARACTER VARYING":
                            ColumnIcon = AbcIcon;
                            break;
                          case "INTEGER":
                          case "BIGINT":
                            ColumnIcon = Grid3x3Icon;
                            break;
                          default:
                            ColumnIcon = Grid3x3Icon;
                        }

                        return (
                          <CustomTreeItem
                            key={colIndex}
                            itemId={`column-${schemaKey}-${table.TABLE_NAME}-${column.COLUMN_NAME}`}
                            label={column.COLUMN_NAME} // Display column name
                            labelIcon={ColumnIcon} // Set dynamically
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColumnClick(schemaKey, table.TABLE_NAME, column.COLUMN_NAME);
                            }}
                          />
                        );
                      })}
                    </CustomTreeItem>
                  );
                })}
              </CustomTreeItem>
            );
          })
        ) : (
          <TreeItem itemId="loading" label="" />
        )}
      </SimpleTreeView>
    </div>
  );
};

export default MyTreeViewModule;
