// /src/utils/export.ts
// import Papa from "papaparse";

// export const exportToCSV = <T>(data: T[], filename: string, columns?: string[]) => {
//   const processedData = columns 
//     ? data.map(item => 
//         columns.reduce((acc, col) => ({ ...acc, [col]: (item as any)[col] }), {})
//       )
//     : data;

//   const csv = Papa.unparse(processedData);
//   downloadFile(csv, `${filename}.csv`, "text/csv");
// };

export const exportToJSON = <T>(data: T[], filename: string) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
};

// export const exportToExcel = async <T>(data: T[], filename: string, columns?: string[]) => {
//   // This would require a library like xlsx or exceljs
//   // For now, we"ll export as CSV as a fallback
//   console.warn("Excel export not implemented, falling back to CSV");
//   exportToCSV(data, filename, columns);
// };

export const exportToPDF = async <T>(data: T[], filename: string) => {
  // This would require a library like jsPDF or Puppeteer
  console.warn("PDF export not implemented yet");
  console.log(data, filename);
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
