import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'Tarifas Olva.xlsx');
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading Excel:', error);
    res.status(500).json({ error: 'Error reading Excel file' });
  }
}