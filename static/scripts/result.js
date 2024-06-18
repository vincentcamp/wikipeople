function formatEducationInfo(params) {
    // Check if there are detailed education entries available
    if (params.value && Array.isArray(params.value) && params.value.length > 0) {
        return params.value.map(entry => `${entry.college} (${entry.degree})`).join(', ');
    }
    // Fallback to displaying the college name used in the query
    return params.data.collegeName || 'N/A';
}

function dateComparator(date1, date2) {
    const dateParse1 = Date.parse(date1);
    const dateParse2 = Date.parse(date2);
    return dateParse1 - dateParse2;
}

const columnDefs = [
    { field: "personLabel", headerName: "Name" },
    {
        field: "dateOfBirth",
        headerName: "Date of Birth",
        comparator: dateComparator,
    },
    { field: "education", headerName: "Education", cellRenderer: formatEducationInfo },
    { field: "description", headerName: "Description" },
    { field: "occupation", headerName: "Occupation" },
    {
        field: "wikipediaUrl", headerName: "Wikipedia Link", cellRenderer: function(params) {
            return params.value ? `<a href="${params.value}" target="_blank">Wikipedia</a>` : '';
        }
    },
];

const rowData = {{ person_info | tojson | safe }};

const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    pagination: true,
    paginationPageSize: 100,
    domLayout: 'autoHeight',
};


document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector('#peopleGrid');
    new agGrid.Grid(gridDiv, gridOptions);
});

function downloadCSV() {
    gridOptions.api.exportDataAsCsv();
}