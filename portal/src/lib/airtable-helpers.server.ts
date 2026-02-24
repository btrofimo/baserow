import { createAirtableClient } from './airtable.server'

let client: ReturnType<typeof createAirtableClient> | null = null

export function getAirtable() {
  if (!client) {
    client = createAirtableClient({
      pat: process.env.AIRTABLE_PAT!,
      baseId: process.env.AIRTABLE_BASE_ID!,
    })
  }
  return client
}

/**
 * Escape a value for use inside an Airtable filterByFormula string.
 * Prevents formula injection by escaping backslashes and double quotes.
 */
export function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const AIRTABLE_RECORD_ID_PATTERN = /^rec[a-zA-Z0-9]{14}$/

/**
 * Validate that a string looks like an Airtable record ID.
 */
export function validateRecordId(id: string): string {
  if (!AIRTABLE_RECORD_ID_PATTERN.test(id)) {
    throw new Error('Invalid record ID format')
  }
  return id
}
