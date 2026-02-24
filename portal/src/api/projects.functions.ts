import { createServerFn } from '@tanstack/react-start'
import { createAirtableClient } from '../lib/airtable.server'
import { verifyCognitoToken } from '../lib/auth.server'

function getAirtable() {
  return createAirtableClient({
    pat: process.env.AIRTABLE_PAT!,
    baseId: process.env.AIRTABLE_BASE_ID!,
  })
}

export const listProjects = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; offset?: string }) => data)
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_PROJECTS_TABLE!, {
      filterByFormula: `{Cognito User ID}="${user.sub}"`,
      pageSize: 25,
      offset: data.offset,
    })
  })

export const getProject = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; recordId: string }) => data)
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    const result = await airtable.listRecords(
      process.env.AIRTABLE_PROJECTS_TABLE!,
      {
        filterByFormula: `AND(RECORD_ID()="${data.recordId}", {Cognito User ID}="${user.sub}")`,
      }
    )

    if (result.records.length === 0) {
      throw new Error('Project not found')
    }

    return result.records[0]
  })

export const submitProject = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      idToken: string
      fields: {
        street: string
        city: string
        state: string
        fileNo: string
        requestType: string[]
        priority: string
        notes?: string
      }
    }) => data
  )
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.createRecord(process.env.AIRTABLE_PROJECTS_TABLE!, {
      Street: data.fields.street,
      City: data.fields.city,
      State: data.fields.state,
      'File No': data.fields.fileNo,
      'Request Type': data.fields.requestType,
      Priority: data.fields.priority,
      Notes: data.fields.notes ?? '',
      Status: 'Submitted',
      'Cognito User ID': user.sub,
      'Submitted By': user.email,
    })
  })
