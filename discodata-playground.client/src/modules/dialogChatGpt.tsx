
// This is the popup window that is used to select the context for the AI 

import { useState, useRef } from "react";
import {
  Box,
  InputLabel,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  LinearProgress,
} from "@mui/material";
import { fetchData } from "../services/discoDataApi";
import { SchemaItem, TableItem, ColumnItem, ChatBoxContext } from "../interfaces/dremioInterfaces";

interface Props {
  open: boolean;
  handleClose: () => void;
  handleAddContext: (context: ChatBoxContext[]) => void;
  dremioSchema: SchemaItem[] | null;
}

const getSelectedValues = (event: React.ChangeEvent<HTMLSelectElement>): string[] => {
  return Array.from(event.target.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
};

const DialogChatGpt = ({ open, handleClose, dremioSchema, handleAddContext }: Props) => {
  const [loading, setLoading] = useState(false);
  const [dremioTable, setDremioTable] = useState<TableItem[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const contextInfoJsonRef = useRef<
    {
      schemaName: string;
      tables: {
        tableName: string;
        columns: ColumnItem[];
      }[];
    }[]
  >([]);

  const handleSchemaChangeWrapper = async (e: any) => {
    await handleSchemaSelected(e as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleSchemaSelected = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    const selected = getSelectedValues(event);
    setSelectedSchemas(selected);
    setSelectedTables([]);
    contextInfoJsonRef.current = [];
    const allTables: TableItem[] = [];

    for (const schemaName of selected) {
      const matchedSchema = dremioSchema?.find((s) => s.schemaName === schemaName);
      if (!matchedSchema) continue;

      try {
        const result: TableItem[] = await fetchData(`/getTable/${matchedSchema.schema}`);
        const enriched = result.map((item) => ({
          ...item,
          schemaName: matchedSchema.schema,
        }));
        allTables.push(...enriched);
      } catch (error) {
        console.error(`Failed to fetch tables for ${schemaName}:`, error);
      }
    }

    setDremioTable(allTables);
    setLoading(false);
  };

  const handleTableChangeWrapper = (e: any) => {
    handleTableChange(e as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleTableChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = getSelectedValues(event);
    setSelectedTables(selected);

    const schemaTableMap: Record<string, { tableName: string; columns: ColumnItem[] }[]> = {};

    for (const tableName of selected) {
      const matchedTable = dremioTable.find((t) => t.tableName === tableName);
      if (!matchedTable) continue;

      try {
        const columns: ColumnItem[] = await fetchData(`/getColumn/${matchedTable.schemaName}/${tableName}`);

        if (!schemaTableMap[matchedTable.schemaName]) {
          schemaTableMap[matchedTable.schemaName] = [];
        }

        schemaTableMap[matchedTable.schemaName].push({
          tableName,
          columns,
        });
      } catch (error) {
        console.error(`Failed to fetch columns for ${tableName}:`, error);
      }
    }

    contextInfoJsonRef.current = Object.entries(schemaTableMap).map(([schemaName, tables]) => ({
      schemaName,
      tables,
    }));

    console.log(contextInfoJsonRef);
  };

  const handleSendAIContext = (event: React.FormEvent) => {
    event.preventDefault();
    //send the sjon to app and then the app send it to chatGptDialog
    handleAddContext(contextInfoJsonRef.current);
    handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <form onSubmit={handleSendAIContext}>
        <DialogTitle className="flex items-center justify-between">
          Add AI Chatbot Context
          {loading && <LinearProgress className="ml-4 w-32" color="success" />}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Schema Selector */}
            <FormControl fullWidth sx={{ minHeight: 200 }}>
              <InputLabel shrink htmlFor="select-schema-native">Schema</InputLabel>
              <Select
                multiple
                native
                value={selectedSchemas}
                onChange={handleSchemaChangeWrapper}
                inputProps={{
                  id: "select-schema-native",
                  style: { height: 150 },
                }}
              >
                {dremioSchema?.map((schema, index) => (
                  <option key={`${schema.schema}-${index}`} value={schema.schemaName}>
                    {schema.schemaName}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Table Selector */}
            <FormControl fullWidth disabled={selectedSchemas.length === 0} sx={{ minHeight: 200 }}>
              <InputLabel shrink htmlFor="select-table-native">Tables</InputLabel>
              <Select
                multiple
                native
                value={selectedTables}
                onChange={handleTableChangeWrapper}
                inputProps={{
                  id: "select-table-native",
                  style: { height: 150 },
                }}
              >
                {dremioTable.map((table) => (
                  <option key={table.tableName} value={table.tableName}>
                    {table.tableName}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" color="primary" variant="contained">
            Add context
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DialogChatGpt;
