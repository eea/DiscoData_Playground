"use client"; // Ensure it runs on client-side
import React from "react";
import { useEffect, useState } from "react";
import { postData } from "./services/discoDataApi";
import { fetchData } from "./services/discoDataApi";
import TreeViewModule from "./modules/treeViewModule";
import ListViewModule from "./modules/listViewModule";
import DialogView from "./modules/dialogView";
import ChatGptViewModule from "./modules/chatGptViewModule";
import { DataGrid } from '@mui/x-data-grid';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { LinearProgress, IconButton, Tooltip } from '@mui/material';
import DialogChatGpt from './modules/dialogChatGpt'

export default function App() {
    const [height, setHeight] = useState(700); // Initial height of the result area
    const [isDragging, setIsDragging] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ type: string; name: string; schema?: string } | null>(null);
    const [userCatalog, setUserCatalog] = useState<any>(null);
    const [query, setQuery] = useState<string>(``);
    const [debouncedQuery, setDebouncedQuery] = useState<string>("");
    const [suggestedTable, setSuggestedTable] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false); // Loading state for button
    const [queryResult, setQueryResult] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isChatContextDialogOpen, setIsChatContextDialogOpen] = React.useState(true);
    const [isEditMode, setEditMode] = React.useState(false);
    const [selectedView, setSelectedView] = useState({ name: "", query: "", version: "", id: "", description: "" });
    const [showRightColumn, setShowRightColumn] = useState(false);

    const handleDialogClose = () => setIsDialogOpen(false);
    const handleChatContextDialog = () => setIsChatContextDialogOpen(false); 
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // State to keep track of selected columns

    ////////////////////////////////////////////////
    // Functions to handlecall to chatGPT assistant
    ////////////////////////////////////////////////
    const handleOpenDialogAI = () => {
        setShowRightColumn(prev => !prev);
    };

    const handlePastGPTCode = (item: {codeText: string}) =>{
        setQuery(item.codeText);
    }

    ////////////////////////////////////////////////
    // Functions to handle tree item selection
    ////////////////////////////////////////////////
    const handleTreeItemSelected = (item: { type: string; name: string; table?: string; schema?: string }) => {
        if (item.type === "table")
            setQuery(`SELECT * FROM "${item.schema}"."${item.name}" LIMIT 200`);
        if (item.type === "column") {
            setSelectedColumns((prevColumns: any) => {
                // Check if the new column belongs to a different table
                const isDifferentTable = prevColumns.length > 0 && prevColumns[0].table !== item.table;
                // If it's a different table, reset the selected columns
                const newColumns = isDifferentTable ? [item] : [...prevColumns, item];
                const columnsString = newColumns.map((col) => `"${col.name}"`).join(", ");
                setQuery(`SELECT ${columnsString} FROM "${item.schema}"."${item.table}" LIMIT 200`);
                return newColumns;
            });
        }
        setSelectedItem(item);
    };

    ////////////////////////////////////////////////
    // Functions to handle run a query
    ////////////////////////////////////////////////
    async function handleRunQuery() {
        if (!query.trim()) {
            return;
        }

        // const escapedQuery = escapeQuery(cleanedQuery);
        //const payload = JSON.stringify({ query: query });

        const payload = { query: query };
        setIsRunning(true); // Show loading state on button
        try {
            const response = await fetch("/testQuery", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Failed to validate query: ${response.statusText}`);
            }
            const result = await response.json();
            if (Array.isArray(result)) {
                setQueryResult(result);
            } else {
                console.warn("Unexpected API response:", result);
                setQueryResult([]);
            }
        } catch (error) {
            console.error("Error validating query:", error);
        } finally {
            setIsRunning(false); // Reset button state after API call
        }
    }

    ////////////////////////////////////////////////
    // Functions to handle list view / create view
    ////////////////////////////////////////////////
    useEffect(() => {
        const loadUserCatalog = async () => {
            try {
                const result = await fetchData(`/getCatalog/dubos`);
                setUserCatalog(result);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        loadUserCatalog(); // Call the function directly
    }, []);

    const handleViewItemQuerySelected = (view: { query: string }) => {
        setQuery(view.query);
    }

    const handleEditView = (view: any) => {
        setSelectedView(view);
        setIsDialogOpen(true);
        setEditMode(true);
    };

    const handleCreateView = (view: any) => {
        setEditMode(true);
        setSelectedView(view);
        setIsDialogOpen(true);
    };

    const handleSaveView = async (myView: any) => {
        // Find the original view before editing
        const originalView = userCatalog.find((view: any) => view.id === myView.id);

        // 🛑 If the original view is not found, we have a new view to save
        if (!originalView) {
            try {
                myView.userAdded = "dubos"; // Add userAdded field
                const createdView = await postData(`/createView`, myView); // ✅ Remove trailing slash

                // 🔄 Update the local state directly without fetching
                setUserCatalog((prevCatalog: any) => [createdView, ...prevCatalog]);

            } catch (error) {
                console.error("Error creating view:", error);
            } finally {
                setIsDialogOpen(false);
                return;
            }
        }

        // 🛑 Check if anything changed before updating
        if (JSON.stringify(originalView) === JSON.stringify(myView)) {
            console.log("No changes detected, closing popup without update.");
            setIsDialogOpen(false);
            return;
        }

        try {
            await postData(`/updateView/${myView.id}`, myView); // ✅ Update backend

            // 🔄 Update the local state directly without fetching
            setUserCatalog((prevCatalog: any) =>
                prevCatalog.map((view: any) => (view.id === myView.id ? myView : view))
            );
        } catch (error) {
            console.error("Error updating view:", error);
        } finally {
            setIsDialogOpen(false); // Close the popup
        }
    };


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300); // Adjust delay as needed
        return () => clearTimeout(handler);
    }, [query]);

    // Log query after debounce delay
    useEffect(() => {
        const tableName = extractTableName(debouncedQuery);
        if (tableName) {
            const fetchData = async () => {
                const result = await postData(`/generateAiResponse/`, { "input_text": tableName });
                if (result) {
                    setSuggestedTable(result.output);
                }
                else {
                    setSuggestedTable(null);
                }
            };
            fetchData();
        }
    }, [debouncedQuery]);

    const extractTableName = (sqlQuery: any) => {
        const match = sqlQuery.match(/from\s+([`"'\[\]]?[\w]+[`"'\[\]]?)/i);
        return match ? match[1] : null;
    };

    const columns = queryResult.length > 0 ?
        Object.keys(queryResult[0]).map((key) => ({
            field: key,
            headerName: key.toUpperCase(),
            flex: 1,
        })) : [];

    ////////////////////////////////////////////////
    // Functions to handle resizing playground area
    ////////////////////////////////////////////////
    const handleMouseDown = () => {
        console.log("Mouse down");
        setIsDragging(true);
    };

    const handleMouseMove = (e: any) => {

        if (!isDragging) return;
        console.log("Mouse dragging");
        // Calculate the new height based on mouse position
        const newHeight = e.clientY - 150; // Adjust to account for the navbar height
        if (newHeight > 50 && newHeight < window.innerHeight - 200) { // Restrict the resizing range
            console.log(newHeight);
            setHeight(newHeight);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            className="flex flex-col h-screen"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Navbar */}
            <nav className="bg-green-600 text-white p-4 flex items-center text-lg font-bold">
                <img src="/EEALogo.png" alt="Logo" className="h-8 w-auto mr-2" />
                <span>DiscoData Playground</span>
            </nav>

            {/* Main Content */}
            <div className="flex flex-1 h-[calc(100%-65px)]">
                {/* Left Sidebar */}
                <div className="w-1/4 flex flex-col gap-4 p-4 text-black overflow-y-auto h-full">

                    <div className="bg-gray-100 flex-2 rounded-lg shadow-md overflow-y-auto max-h-[calc(80vh-10rem)]">
                        <h1 className="text-lg font-bold text-gray-800 border-b  border-gray-300 pb-2 mb-3 p-4">
                            Data Lakehouse
                        </h1>
                        <TreeViewModule selectedTreeViewItem={selectedItem?.name || ""} onItemSelected={handleTreeItemSelected} />
                    </div>


                    {/* My Queries Section */}
                    <div className="bg-gray-100 flex-1 p-4 rounded-lg shadow-md">
                        <h1 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-3 bg-gray-100">
                            Views
                        </h1>
                        <ListViewModule userCatalog={userCatalog} onQuerySelected={handleViewItemQuerySelected} onViewSelected={handleEditView} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="w-3/4 flex flex-col gap-4 p-4 text-black overflow-y-auto h-full">
                    <div className="bg-gray-100 flex-1 p-4 rounded-lg shadow-md h-full flex flex-col">
                        <h1 className="text-lg font-bold text-gray-800 border-b  border-gray-300 pb-2 mb-3">
                            Playground
                        </h1>

                        {/* Query Result Section */}
                        <div
                            className="overflow-y-auto p-2 shadow-md mr-2 ml-2 bg-white rounded-lg flex-shrink-0" style={{ height: `${height}px` }}>
                            {queryResult.length > 0 ? (
                                <DataGrid
                                    rowHeight={25}
                                    rows={queryResult.map((row, index) => ({ id: index, ...row }))} // Add unique id
                                    columns={columns}
                                    columnBufferPx={100}
                                    sx={{
                                        "& .MuiDataGrid-columnHeaders": {
                                            fontWeight: "bold", // Bold column headers
                                            fontSize: "15px", // Optional: Increase font size
                                            backgroundColor: "#d4d8cf", // Optional: Light gray background for better visibility
                                        },
                                    }}
                                />
                            ) : (
                                <p className="text-gray-500 text-center">Run a query to see results.</p>
                            )}
                        </div>

                        {/* Splitter Bar */}
                        <div onMouseDown={handleMouseDown} className="cursor-row-resize bg-gray-400 h-2 hover:bg-gray-400 mx-auto my-2 flex items-center justify-center rounded-full" style={{ width: "60px" }} >
                            <span className="text-gray-500"></span>
                        </div>

                        {/* TextArea at the Bottom */}
                        <div className="mt-auto mr-2 ml-2 bg-white rounded-lg p-2 shadow-md"
                            style={{ height: `calc(100% - ${height + 70}px)` }} // Adjust for splitter height and padding
                        >  {isRunning && (<LinearProgress className="m-1" color="success" />)}

                            <div className="flex flex-row h-full w-full gap-2">
                                {/* Left side: Textarea and buttons */}
                                <div className={`flex-3 flex flex-col`}>

                                    <textarea style={{ height: `100%`, width: "100%", resize: "none", outline: "none" }} className="bg-white"
                                        id="outlined-multiline-flexible"
                                        placeholder="Enter your query..."
                                        value={query}
                                        spellCheck={false}
                                        onChange={(e) => setQuery(e.target.value)}>
                                    </textarea>

                                    <div className="flex justify-end mt-2" style={{ gap: '3px' }}>
                                        <IconButton onClick={handleRunQuery} color="success" size="small" aria-label="run" disabled={!query.trim() || isRunning}>
                                            <Tooltip title="Execute"><PlayCircleOutlineIcon /></Tooltip> 
                                        </IconButton>
                                        <IconButton onClick={() => handleCreateView({ query })} disabled={!query.trim() || isRunning} color="success" size="small" aria-label="create">
                                            <Tooltip title="Create View"><PostAddIcon /></Tooltip> 
                                        </IconButton>
                                        <IconButton onClick={() => handleOpenDialogAI()} disabled={isRunning} color="warning" size="small" aria-label="AI">
                                            <Tooltip title="Open AI assistant"><AutoAwesomeIcon /></Tooltip> 
                                        </IconButton>
                                    </div>
                                </div>

                                {/* Right side: Appears when AI is toggled */}
                                {showRightColumn && (
                                    <div className="flex-3 overflow-y-auto" style={{ maxHeight: '80vh' }} >
                                        <ChatGptViewModule onPasteGPTCode={handlePastGPTCode} />
                                    </div>
                                )}

                            </div> </div>
                        {/* Popup dialog to Edit/Save/Delete a View */}
                        <DialogView
                            open={isDialogOpen}
                            editMode={isEditMode}
                            handleClose={handleDialogClose}
                            handleSave={handleSaveView}  // ✅ Pass handleSave to the popup
                            selectedView={selectedView}
                        />
                        <DialogChatGpt 
                            open={isChatContextDialogOpen} handleClose={handleChatContextDialog} />
                    </div>
                </div>
            </div>
        </div>
    );
}