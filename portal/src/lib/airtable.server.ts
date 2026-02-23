const AIRTABLE_API_URL = 'https://api.airtable.com/v0'

interface AirtableConfig {
  pat: string
  baseId: string
}

interface ListOptions {
  filterByFormula?: string
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  pageSize?: number
  offset?: string
  fields?: string[]
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
  createdTime?: string
}

interface ListResponse {
  records: AirtableRecord[]
  offset?: string
}

function buildListUrl(
  baseId: string,
  table: string,
  options: ListOptions = {}
): string {
  const params = new URLSearchParams()

  if (options.filterByFormula) {
    params.set('filterByFormula', options.filterByFormula)
  }

  if (options.sort) {
    options.sort.forEach((s, i) => {
      params.set(`sort[${i}][field]`, s.field)
      params.set(`sort[${i}][direction]`, s.direction)
    })
  }

  if (options.pageSize) {
    params.set('pageSize', String(options.pageSize))
  }

  if (options.offset) {
    params.set('offset', options.offset)
  }

  if (options.fields) {
    options.fields.forEach((f) => params.append('fields[]', f))
  }

  const query = params.toString()
  return `${AIRTABLE_API_URL}/${baseId}/${table}${query ? `?${query}` : ''}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = (body as { error?: { message?: string } })?.error?.message ?? 'Unknown error'
    throw new Error(`Airtable API error (${response.status}): ${message}`)
  }
  return response.json() as Promise<T>
}

export function createAirtableClient(config: AirtableConfig) {
  const headers = {
    Authorization: `Bearer ${config.pat}`,
    'Content-Type': 'application/json',
  }

  return {
    async listRecords(
      table: string,
      options: ListOptions = {}
    ): Promise<ListResponse> {
      const url = buildListUrl(config.baseId, table, options)
      const response = await fetch(url, { headers })
      return handleResponse<ListResponse>(response)
    },

    async createRecord(
      table: string,
      fields: Record<string, unknown>
    ): Promise<AirtableRecord> {
      const url = `${AIRTABLE_API_URL}/${config.baseId}/${table}`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: [{ fields }] }),
      })
      const data = await handleResponse<{ records: AirtableRecord[] }>(response)
      return data.records[0]
    },

    async updateRecord(
      table: string,
      recordId: string,
      fields: Record<string, unknown>
    ): Promise<AirtableRecord> {
      const url = `${AIRTABLE_API_URL}/${config.baseId}/${table}`
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ records: [{ id: recordId, fields }] }),
      })
      const data = await handleResponse<{ records: AirtableRecord[] }>(response)
      return data.records[0]
    },
  }
}
