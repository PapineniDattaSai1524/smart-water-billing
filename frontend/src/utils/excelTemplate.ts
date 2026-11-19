import type ExcelJS from 'exceljs';
import type { Household } from '@/utils/types';

/**
 * Generates the "Water Usage Readings" Excel template using the Building
 * Owner's REAL households (as returned by GET /households/mine, which is
 * already scoped server-side to the authenticated admin's own buildings --
 * see HouseholdController#getMine / HouseholdService#getMine). This module
 * never invents, hardcodes, or demo-fills household data; every row here is
 * built directly from the `households` array the caller fetched from the API.
 */

const SHEET_NAME = 'Water Usage Readings';
const HEADERS = ['Household ID', 'Unit', 'Resident', 'Reading Date', 'Meter Reading (kL)', 'Remarks'] as const;
const COLUMN_WIDTHS = [18, 15, 28, 18, 22, 35];
const TITLE_ROW = 1;
const SUBTITLE_ROW = 2;
const HEADER_ROW = 4;

const BRAND_HEADER_FILL = 'FF0E7490'; // aqua-700 -- matches the app's dark-surface accent
const BRAND_TITLE_COLOR = 'FF132538'; // ocean-900
const BRAND_SUBTITLE_COLOR = 'FF3D6D93'; // ocean-500
const REFERENCE_FILL = 'FFEFF8FF'; // brand-50 -- light tint marking read-only reference columns
const REFERENCE_TEXT_COLOR = 'FF254361'; // ocean-700
const THIN_BORDER: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFDBE7F0' } };

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds the workbook (Water Usage Readings + Instructions sheets) from the
 * given real households and returns the raw .xlsx bytes ready to download.
 */
export async function buildWaterUsageTemplateWorkbook(households: Household[]): Promise<ExcelJS.Buffer> {
  // Lazy-loaded: exceljs is a large dependency, so it's only pulled into the
  // bundle the moment a Building Owner actually downloads or uploads a
  // template, not on every visit to the Water Usage page.
  const { default: ExcelJSLib } = await import('exceljs');
  const workbook = new ExcelJSLib.Workbook();
  workbook.creator = 'Smart Water Billing System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
  });
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  // ---- Title ----
  sheet.mergeCells(TITLE_ROW, 1, TITLE_ROW, HEADERS.length);
  const titleCell = sheet.getCell(TITLE_ROW, 1);
  titleCell.value = 'SMART WATER BILLING SYSTEM';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: BRAND_TITLE_COLOR } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(TITLE_ROW).height = 26;

  // ---- Subtitle ----
  sheet.mergeCells(SUBTITLE_ROW, 1, SUBTITLE_ROW, HEADERS.length);
  const subtitleCell = sheet.getCell(SUBTITLE_ROW, 1);
  subtitleCell.value = 'Water Usage Readings';
  subtitleCell.font = { name: 'Calibri', size: 12, italic: true, color: { argb: BRAND_SUBTITLE_COLOR } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(SUBTITLE_ROW).height = 20;

  // ---- Header row (bold, filled, centered, frozen, filterable) ----
  const headerRow = sheet.getRow(HEADER_ROW);
  HEADERS.forEach((label, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_HEADER_FILL } };
    cell.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
  });
  headerRow.height = 22;
  headerRow.commit();

  // ---- Data rows -- REAL household values only, reading fields left blank ----
  households.forEach((household, i) => {
    const rowNumber = HEADER_ROW + 1 + i;
    const row = sheet.getRow(rowNumber);

    row.getCell(1).value = household.id;
    row.getCell(2).value = household.unitNumber;
    row.getCell(3).value = household.residentName ?? 'Unassigned';
    row.getCell(4).value = null; // Reading Date -- user enters
    row.getCell(5).value = null; // Meter Reading (kL) -- user enters
    row.getCell(6).value = null; // Remarks -- user enters (optional)

    // Reference columns: tinted + centered to visually read as "do not edit".
    ([1, 2, 3] as const).forEach((c) => {
      const cell = row.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REFERENCE_FILL } };
      cell.font = { name: 'Calibri', size: 11, color: { argb: REFERENCE_TEXT_COLOR } };
      cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'left' : 'center' };
      cell.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
    });

    // Entry columns: plain white background so they read as editable.
    ([4, 5, 6] as const).forEach((c) => {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: c === 6 ? 'left' : 'center' };
      cell.border = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };
    });

    const dateCell = row.getCell(4);
    dateCell.numFmt = 'yyyy-mm-dd';
    dateCell.dataValidation = {
      type: 'date',
      operator: 'lessThanOrEqual',
      formulae: ['TODAY()'],
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid reading date',
      error: 'Reading date must be a valid date and cannot be in the future.',
      promptTitle: 'Reading Date',
      prompt: 'Format: YYYY-MM-DD. Cannot be a future date.',
    };

    const meterCell = row.getCell(5);
    meterCell.numFmt = '0.00';
    meterCell.dataValidation = {
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Invalid meter reading',
      error: 'Meter reading must be a number of 0 or greater (negative values are not allowed).',
      promptTitle: 'Meter Reading (kL)',
      prompt: 'Numeric value, decimals allowed. Zero is valid; negative values are not.',
    };

    row.commit();
  });

  const lastDataRow = households.length > 0 ? HEADER_ROW + households.length : HEADER_ROW;
  sheet.autoFilter = {
    from: { row: HEADER_ROW, column: 1 },
    to: { row: lastDataRow, column: HEADERS.length },
  };

  buildInstructionsSheet(workbook);

  return workbook.xlsx.writeBuffer();
}

function buildInstructionsSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Instructions');
  sheet.getColumn(1).width = 92;

  const lines: Array<{ text: string; style: 'title' | 'heading' | 'body' | 'blank' }> = [
    { text: 'WATER USAGE BULK UPLOAD', style: 'title' },
    { text: '', style: 'blank' },
    { text: '1. Review the pre-filled household information.', style: 'body' },
    { text: '2. Enter the reading date (format: YYYY-MM-DD).', style: 'body' },
    { text: '3. Enter the meter reading in kL.', style: 'body' },
    { text: '4. Add remarks if required.', style: 'body' },
    { text: '5. Save the completed Excel file.', style: 'body' },
    { text: '6. Upload it using Bulk Upload Water Readings.', style: 'body' },
    { text: '', style: 'blank' },
    { text: 'Important:', style: 'heading' },
    { text: '- Do not modify Household ID.', style: 'body' },
    { text: '- Use valid meter readings (0 or greater; negative values are rejected).', style: 'body' },
    { text: '- Use the YYYY-MM-DD date format for Reading Date.', style: 'body' },
    { text: '- Upload only records belonging to this building.', style: 'body' },
  ];

  lines.forEach(({ text, style }, i) => {
    const cell = sheet.getCell(i + 1, 1);
    cell.value = text;
    if (style === 'title') {
      cell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: BRAND_TITLE_COLOR } };
    } else if (style === 'heading') {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND_TITLE_COLOR } };
    } else {
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF254361' } };
    }
  });
}

/** Triggers a browser download for the given .xlsx bytes. */
export function downloadWorkbookBuffer(buffer: ExcelJS.Buffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads a filled-in "Water Usage Readings" .xlsx (as produced by
 * buildWaterUsageTemplateWorkbook, above) and converts it into a CSV File
 * with the exact header the existing backend parser expects
 * (household_id,reading_date,meter_reading_kl,remarks -- see
 * CsvUsageRowParser / WaterUsageLogService#uploadCsv). This lets the Bulk
 * Upload panel accept the Excel template directly without any backend
 * changes: the conversion happens entirely client-side, and the resulting
 * CSV goes through the same, unmodified /usage/upload-csv endpoint that
 * plain .csv uploads already use.
 */
export async function convertUsageWorkbookToCsvFile(file: File): Promise<File> {
  const { default: ExcelJSLib } = await import('exceljs');
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJSLib.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
  if (!sheet) {
    throw new Error('The Excel file does not contain any worksheet to read.');
  }

  let headerRowNumber = -1;
  sheet.eachRow((row) => {
    if (headerRowNumber !== -1) return;
    const values = (row.values as unknown[]).map((v) => String(v ?? '').trim().toLowerCase());
    if (values.includes('household id') && values.includes('meter reading (kl)')) {
      headerRowNumber = row.number;
    }
  });
  if (headerRowNumber === -1) {
    throw new Error('Could not find the "Household ID" / "Meter Reading (kL)" header row in this file. '
      + 'Please use the downloaded Water Usage Template without renaming its columns.');
  }

  const csvEscape = (value: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csvLines = ['household_id,reading_date,meter_reading_kl,remarks'];
  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const householdIdCell = row.getCell(1).value;
    if (householdIdCell === null || householdIdCell === undefined || householdIdCell === '') {
      continue; // skip blank rows
    }
    const readingDate = formatCellAsDateString(row.getCell(4).value);
    const meterReading = row.getCell(5).value;
    const remarks = row.getCell(6).value;

    if (!readingDate && (meterReading === null || meterReading === undefined || meterReading === '')) {
      continue; // household row untouched by the Building Owner -- nothing to import
    }

    csvLines.push([
      csvEscape(cellScalar(householdIdCell)),
      csvEscape(readingDate),
      csvEscape(cellScalar(meterReading)),
      csvEscape(cellScalar(remarks)),
    ].join(','));
  }

  const csvContent = csvLines.join('\n');
  const csvName = file.name.replace(/\.xlsx$/i, '.csv');
  return new File([csvContent], csvName, { type: 'text/csv' });
}

/** Unwraps ExcelJS's richer cell value shapes (formula results, hyperlinks) down to a scalar. */
function cellScalar(value: ExcelJS.CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isoDate(value);
  if (typeof value === 'object') {
    if ('result' in value && value.result !== undefined) return cellScalar(value.result as ExcelJS.CellValue);
    if ('text' in value && typeof value.text === 'string') return value.text;
  }
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}

function formatCellAsDateString(value: ExcelJS.CellValue): string {
  const scalar = cellScalar(value);
  if (scalar === null) return '';
  if (typeof scalar === 'number') return ''; // an unformatted serial with no reliable date -- leave for the row-level validation error
  return String(scalar).trim();
}
