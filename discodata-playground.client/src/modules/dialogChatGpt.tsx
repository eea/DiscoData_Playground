import { useEffect, useState } from "react";
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

interface Props {
  open: boolean;
  handleClose: () => void;
}

interface SchemaItem {
  schemaName: string;
  TABLE_SCHEMA: string;
}

interface TableItem {
  TABLE_NAME: string;
}

const DialogChatGpt = ({ open, handleClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [dremioSchema, setDremioSchema] = useState<SchemaItem[] | null>(null);
  const [dremioTable, setDremioTable] = useState<TableItem[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const origin = "discodata";

  useEffect(() => {
    const loadDremioSchema = async () => {
      try {
        setLoading(true);
        const result = await fetchData(`/getSchema/${origin}`);
        setDremioSchema(result);
      } catch (error) {
        console.error("Error fetching schemas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDremioSchema();
  }, [origin]);

  const handleSchemaChangeWrapper = async (e: any) => {
    await handleSchemaSelected(e as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleSchemaSelected = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { options } = event.target;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedSchemas(selected);
    setSelectedTables([]); // reset tables

    try {
      setLoading(true);
      const allTables: TableItem[] = [];

      for (const schemaName of selected) {
        const matchedSchema = dremioSchema?.find((s) => s.schemaName === schemaName);
        if (!matchedSchema) continue;

        const result: TableItem[] = await fetchData(`/getTable/${matchedSchema.TABLE_SCHEMA}`);
        allTables.push(...result);
      }

      const uniqueTables = Array.from(new Set(allTables.map((t) => t.TABLE_NAME))).map((name) => ({
        TABLE_NAME: name,
      }));

      setDremioTable(uniqueTables);
    } catch (error) {
      console.error("Error fetching tables for schemas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChangeWrapper = (e: any) => {
    handleTableChange(e as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleTableChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { options } = event.target;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedTables(selected);
  };


  const handleSendAIContext = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Selected Tables:", selectedTables);
    handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
      <form onSubmit={handleSendAIContext}>
        <DialogTitle>
          Add AI Chatbot Context
          {loading && (
            <div className="min-h-3 p-1">
              <LinearProgress className="m-1" color="success" />
            </div>
          )}
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
                label="Schema"
                value={selectedSchemas}
                onChange={handleSchemaChangeWrapper}
                inputProps={{
                  id: "select-schema-native",
                  style: { height: 150 } // this controls the height of the select box
                }}
              >
                {dremioSchema?.map((schema, index) => (
                  <option
                    key={`${schema.TABLE_SCHEMA}-${index}`}
                    value={schema.schemaName}
                  >
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
                label="Tables"
                value={selectedTables}
                onChange={handleTableChangeWrapper}
                inputProps={{
                  id: "select-table-native",
                  style: { height: 150 }
                }}
              >
                {dremioTable.map((table) => (
                  <option
                    key={table.TABLE_NAME}
                    value={table.TABLE_NAME}
                  >
                    {table.TABLE_NAME}
                  </option>
                ))}
              </Select>
            </FormControl>

          </Box>
        </DialogContent>


        <Divider />
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button onClick={handleClose} color="error">
            Delete
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DialogChatGpt;
