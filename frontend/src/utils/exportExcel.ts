import * as XLSX from "xlsx";

export interface ExcelSheet {
  name: string;
  rows: Record<string, unknown>[];
}

const sanitizeSheetName = (name: string) => name.replace(/[\\/*?:[\]]/g, " ").slice(0, 31);

export function downloadExcel(filename: string, sheets: ExcelSheet[]) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{}]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheet.name) || "Sheet1");
  });

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
