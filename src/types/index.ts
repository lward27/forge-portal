export interface AuthMe {
  role: string
  tenant_id: string | null
  tenant_name: string | null
  key_name: string
  key_prefix: string
}

export interface Database {
  id: string
  tenant_id: string
  name: string
  pg_database: string
  status: string
  created_at: string
}

export interface ColumnDef {
  name: string
  type: string
  nullable: boolean
  primary_key: boolean
  unique: boolean
  default: string | null
  reference_table?: string | null
}

export interface TableDef {
  name: string
  display_field?: string | null
  database_id: string
  columns: ColumnDef[]
  created_at: string
}

export interface RowData {
  [key: string]: unknown
}

export interface RowListResponse {
  rows: RowData[]
  total: number
  limit: number
  offset: number
}

export const TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  integer: 'Number',
  biginteger: 'Big Number',
  decimal: 'Decimal',
  boolean: 'Yes / No',
  date: 'Date',
  timestamp: 'Date & Time',
  json: 'JSON',
  serial: 'Auto ID',
  reference: 'Reference',
}

export const FIELD_TYPES = [
  'text', 'integer', 'decimal', 'boolean', 'date', 'timestamp', 'json', 'reference',
]

// View & Form configs
export interface ViewColumnConfig {
  field: string
  visible: boolean
  width: number | null
}

export interface ViewConfig {
  columns: ViewColumnConfig[]
  default_sort: { field: string; direction: 'asc' | 'desc' }
  page_size: number
}

export interface ViewDef {
  id: string
  table_name: string
  name: string
  is_default: boolean
  config: ViewConfig
}

export interface FormFieldConfig {
  field: string
  visible: boolean
}

export interface FormSectionConfig {
  title: string
  fields: FormFieldConfig[]
}

export interface FormRelatedConfig {
  table: string
  reference_column: string
  visible: boolean
  collapsed: boolean
}

export interface FormConfig {
  sections: FormSectionConfig[]
  related_tables: FormRelatedConfig[]
}

export interface FormDef {
  id: string
  table_name: string
  name: string
  is_default: boolean
  config: FormConfig
}
