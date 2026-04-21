import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExportRow {
  [key: string]: any
}

/**
 * Экспорт массива данных в Excel (.xlsx) файл
 * Совместим с: Excel, Google Sheets, LibreOffice Calc
 */
export function exportToExcel(
  data: ExportRow[],
  filename: string,
  sheetName = 'Результаты'
): void {
  if (!data.length) {
    console.warn('Нет данных для экспорта')
    return
  }

  // Создаём workbook
  const wb = XLSX.utils.book_new()

  // Преобразуем данные в worksheet
  const ws = XLSX.utils.json_to_sheet(data)

  // Настройка ширины колонок
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length)) + 2,
  }))
  ws['!cols'] = colWidths

  // Добавляем worksheet в workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Генерируем файл и скачиваем
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  
  // Гарантируем расширение .xlsx
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  saveAs(blob, safeFilename)
}

/**
 * Экспорт нескольких таблиц в один файл (несколько листов)
 */
export function exportMultiSheetExcel(
  sheets: { name: string; data: ExportRow[] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    if (!sheet.data.length) return
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    const colWidths = Object.keys(sheet.data[0]).map(key => ({
      wch: Math.max(key.length, ...sheet.data.map(row => String(row[key] ?? '').length)) + 2,
    }))
    ws['!cols'] = colWidths
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  saveAs(blob, safeFilename)
}
