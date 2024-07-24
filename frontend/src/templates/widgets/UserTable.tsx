/* eslint-disable react/no-unstable-nested-components */
// @ts-nocheck
import 'ag-grid-community/styles/ag-grid.css';

import { AgGridReact } from 'ag-grid-react';
import React, { useMemo } from 'react';

// import 'ag-grid-community/styles/ag-theme-alpine.css';
// import 'ag-grid-community/styles/ag-theme-alpine-dark.css';

const UserTable = () => {
  const  darkMode  = true;
  const rowData = useMemo(
    () => [
      {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'New York',
        age: 28,
        feedback: 'Great service!',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        location: 'Los Angeles',
        age: 34,
        feedback: 'Loved it!',
      },
      // Add more data entries as needed (15 in total)
      // ...
    ],
    []
  );

  const goToChat = (data: any) => {
    // Implement your chat navigation logic here
    console.log('Navigating to chat with:', data);
  };

  const columnDefs = useMemo(
    () => [
      { headerName: 'Name', field: 'name', sortable: true, filter: true },
      { headerName: 'Email', field: 'email', sortable: true, filter: true },
      {
        headerName: 'Location',
        field: 'location',
        sortable: true,
        filter: true,
      },
      { headerName: 'Age', field: 'age', sortable: true, filter: true },
      {
        headerName: 'Feedback',
        field: 'feedback',
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Action',
        field: 'action',
        cellRendererFramework: (params: any) => (
          <button
            type="button"
            className="rounded bg-blue-500 px-4 py-2 text-white"
            onClick={() => goToChat(params.data)}
          >
            Go to chat
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div
      className={`ag-theme-material ${
        darkMode ? 'ag-theme-material-dark' : ''
      }`}
      style={{ minHeight: 500, width: '100%' }}
    >
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{ resizable: true, flex: 1 }}
      />
    </div>
  );
};

export default UserTable;
