import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  DialogContentText,
  Button,
  Divider,
} from "@mui/material";

interface View {
  _id?: string;
  id: string;
  name: string;
  description: string;
  version: string;
  query: string;
}

interface Props {
  open: boolean;
  editMode: boolean;
  handleClose: () => void;
  handleSave: (updatedView: any) => void;
  handleDelete: (deletedView: View) => void;
  selectedView: {
    _id?: string;
    id: string;
    name: string;
    description: string;
    version: string;
    query: string;
  };
}

const DialogView = ({ open, editMode, handleClose, handleSave, handleDelete, selectedView }: Props) => {
  const [isEditMode, setIsEditMode] = useState(editMode);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formValues, setFormValues] = useState(selectedView);

  useEffect(() => {
    if (editMode) {
      setIsEditMode(editMode);
    }

    if (selectedView) {
      const cleanedQuery = selectedView.query
        ?.replace(/[\r\n]+/g, ' ')  // Remove line breaks
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();                    // Trim ends

      setFormValues({
        ...selectedView,
        query: cleanedQuery ?? '', // Use sanitized query or empty string
      });
    }
  }, [selectedView, editMode]);


  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditMode = (event: React.MouseEvent) => {
    event.preventDefault(); // ✅ Prevent form submission
    setIsEditMode(true);
  };

  const handleDeleteView = async () => {
    if (!isEditMode) return;

    setIsUpdating(true);
    try {
      setIsEditMode(false);
      handleDelete(selectedView);
      handleClose();
    } catch (error) {
      console.error("Error deleting View:", error);
      alert("Failed to delete the view. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle form submission (update & close)
  const handleSaveView = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isEditMode) return;

    setIsUpdating(true);
    // If not in edit mode, don't trigger a save
    try {
      setIsEditMode(false);
      handleSave(formValues); // Update the parent state
      handleClose(); // Close modal
    } catch (error) {
      console.error("Error updating query:", error);
      alert("Failed to update query. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSaveView}>
        <DialogTitle>
          {formValues?.id ? (isEditMode ? "Edit View" : `View: ${formValues?.name || "N/A"}`) : "Create View"}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {isEditMode ? (
            <>
              <TextField
                fullWidth
                margin="dense"
                label="Name"
                name="name"
                required
                value={formValues?.name || ""}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="ID"
                name="id"
                disabled
                value={formValues?.id || ""}
                InputProps={{
                  readOnly: true,
                }}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Description"
                name="description"
                required
                value={formValues?.description || ""}
                onChange={handleChange}
                multiline
              />
              <TextField
                fullWidth
                margin="dense"
                label="Version"
                name="version"
                required
                value={formValues?.version || ""}
                onChange={handleChange}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Query"
                name="query"
                required
                value={formValues?.query || ""}
                onChange={handleChange}
                multiline
              />
            </>
          ) : (
            <>
              <DialogContentText><b>ID: </b> {formValues?.id || "N/A"}</DialogContentText>
              <DialogContentText><b>Name: </b> {formValues?.name || "N/A"}</DialogContentText>
              <DialogContentText><b>Description: </b> {formValues?.description || "N/A"}</DialogContentText>
              <DialogContentText><b>Version: </b> {formValues?.version || "N/A"}</DialogContentText>
              <DialogContentText><b>Query: </b> {formValues?.query || "N/A"}</DialogContentText>
            </>
          )}
        </DialogContent>
        <Divider />
        <DialogActions
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div>
            <Button onClick={handleDeleteView} color="error">
              Delete
            </Button>
          </div>
          <div>
            <Button onClick={handleClose}>Cancel</Button>

            {isEditMode || !formValues?.id ? (
              <Button type="submit" color="primary">
                {formValues?.id ? "Update" : "Save"}
              </Button>
            ) : (
              <Button type="button" onClick={handleEditMode} color="primary">
                Edit
              </Button>
            )}
          </div>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DialogView;
