import React from "react";
import { useEffect, useState } from "react";
import { fetchData } from "../services/discoDataApi";
import {
  Divider,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  LinearProgress
} from '@mui/material';
import LibraryBooksTwoToneIcon from '@mui/icons-material/LibraryBooksTwoTone';

interface Props {
  onViewSelected: (view: {queryString: string}) => void;
}

const listViewModule = ({ onViewSelected }: Props) => {
  const [userCatalog, setUserCatalog] = useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = useState<string>("dubos");

  useEffect(() => {
    loadUserCatalog(user); // Load schema when component mounts or origin changes
  }, [user]);

  const loadUserCatalog = async (user: string) => {
    try {
      setLoading(true);
      const result = await fetchData(`/getCatalog/${user}`);
      setUserCatalog(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleViewClick = (query: string) => {
    // Notify the parent component
    onViewSelected({ queryString: query });
  };

  return (
    <div>
      {/* Select to pick the user we want to see the views */}
      {/* <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="demo-select-small-label">Origin</InputLabel>

      </FormControl> */}

      <div className="min-h-3 p-1">{loading && (<LinearProgress className="m-1" color="success" />)}</div>
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
              <ListItemIcon className="m-0 p-0" style={{color: "green", margin:"0px", padding:"0px"}} >
                  <LibraryBooksTwoToneIcon  />
                </ListItemIcon>
                <ListItemText  className="m-0 p-0" style={{color: "green", margin:"0px", padding:"0px"}}
                  primary={ <> <strong>{view.name}</strong></>}
                  secondary={
                    <>
                      <strong>Version:</strong> {view.version}
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
