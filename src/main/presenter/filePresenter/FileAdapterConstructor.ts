import { CsvFileAdapter } from './CsvFileAdapter'
import { ExcelFileAdapter } from './ExcelFileAdapter'
import { ImageFileAdapter } from './ImageFileAdapter'
import { PdfFileAdapter } from './PdfFileAdapter'
import { TextFileAdapter } from './TextFileAdapter'
import { DocFileAdapter } from './DocFileAdapter'
import { PptFileAdapter } from './PptFileAdapter'
import { CodeFileAdapter } from './CodeFileAdapter'
import { AudioFileAdapter } from './AudioFileAdapter'
import { UnsupportFileAdapter } from './UnsupportFileAdapter'

export type FileAdapterConstructor = new (
  filePath: string,
  maxFileSize: number
) =>
  | CsvFileAdapter
  | TextFileAdapter
  | ExcelFileAdapter
  | ImageFileAdapter
  | PdfFileAdapter
  | DocFileAdapter
  | PptFileAdapter
  | CodeFileAdapter
  | AudioFileAdapter
  | UnsupportFileAdapter
