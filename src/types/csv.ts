export interface NextivaUser {
  firstName: string
  lastName?: string
  email?: string
  extensionNumber?: string
  did?: string
  team?: string
  location?: string
  department?: string
  jobTitle?: string
}

export interface CSVImportResult {
  success: boolean
  data: NextivaUser[]
  errors: string[]
  warnings: string[]
}

export interface CSVValidationError {
  row: number
  field: string
  message: string
  value: any
}