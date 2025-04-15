import React from "react";
import { useState } from "react";
import {
  Divider,
  List,
  ListItemText,
  ListItem,
  Tooltip
} from '@mui/material';
import LibraryBooksTwoToneIcon from '@mui/icons-material/LibraryBooksTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';


//We need the base url to create the full URL for the view
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface View {
  _id?: string;
  id: string;
  name: string;
  description: string;
  version: string;
  query: string;
}

interface Props {
  userCatalog: any[];
  onQuerySelected: (view: { query: string }) => void;
  onViewSelected: (view: View) => void;
}

const listViewModule = ({ userCatalog, onQuerySelected, onViewSelected }: Props) => {

  const [copiedViewId, setCopiedViewId] = useState<string | null>(null);
  const handleViewClick = (query: string) => {
    // Notify the parent component
    onQuerySelected({ query: query });
  };

  const handleEditView = (view: View) => {
    // Notify the parent component
    onViewSelected({
      name: view.name,
      id: view.id,
      _id: view._id,
      description: view.description,
      version: view.version,
      query: view.query,
    });
  };

  const handleCopyToClipboard = (view: View) => {
    const fullUrl = `${API_BASE_URL}/api/view/${view.id}`;
    setCopiedViewId(view.id); // Update the view object to indicate it has been copied
    navigator.clipboard.writeText(fullUrl).then(() => {
      setTimeout(() => {
        setCopiedViewId(null);
      }, 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  return (
    <div>
      <List
        sx={{
          width: '100%',
          maxHeight: 300, // Adjust the height as needed
          overflowY: 'auto', // Enable vertical scrolling on overflow
          bgcolor: 'bg-gray-100',
          marginTop: 0,
        }}
        className="bg-gray-100 pd-0"
        dense={true}
      >
        {userCatalog &&
          userCatalog.map((view: any, index: number) => (
            <React.Fragment key={view._id || index}>
              <ListItem alignItems="flex-start" className="pd-0" style={{ cursor: "pointer" }} onDoubleClick={() => handleViewClick(view.query)}>
                {/* <ListItemIcon className="m-0 p-0" style={{ color: "green", margin: "0px", padding: "0px" }} >
                  <LibraryBooksTwoToneIcon onClick={() => handleEditView(view)} />
                </ListItemIcon> */}
                <Tooltip title="Edit view">
                  <LibraryBooksTwoToneIcon onClick={() => handleEditView(view)} className="mr-2" />
                </Tooltip>

                <ListItemText className="m-0 p-0" style={{ color: "green", margin: "0px", padding: "0px" }}
                  primary={<> <strong>{view.name}</strong></>}
                  secondary={
                    <>
                      <strong>Version:</strong> {view.version}
                      <br />
                      <strong>Id:</strong> {view.id}
                      <Tooltip title="Copy query path to clipboard">
                        {copiedViewId === view.id ? (
                          <CheckIcon style={{ color: "gray", margin: "0px", padding: "0px" }} fontSize="small" />
                        ) : (
                          <ContentCopyIcon style={{ color: "gray", margin: "0px", padding: "0px" }} fontSize="small" onClick={() => handleCopyToClipboard(view)} />
                        )}
                      </Tooltip>
                      <br />
                      <strong>Description:</strong> {view.description}
                    </>
                  }
                />
              </ListItem>
              {index < userCatalog.length - 1 && <Divider />} {/* Add Divider except after the last item */}
            </React.Fragment>
          ))}
      </List>
    </div>
  );
};

export default listViewModule;
