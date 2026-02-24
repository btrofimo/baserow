import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { verifyCognitoToken } from '../lib/auth.server'
import {
  getAirtable,
  escapeFormulaValue,
  validateRecordId,
} from '../lib/airtable-helpers.server'

const listProjectsSchema = z.object({
  idToken: z.string().min(1),
  offset: z.string().optional(),
})

export const listProjects = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { idToken: string; offset?: string }) => data
  )
  .handler(async ({ data }) => {
    const validated = listProjectsSchema.parse(data)
    const user = await verifyCognitoToken(validated.idToken)
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_PROJECTS_TABLE!, {
      filterByFormula: `{Cognito User ID}="${escapeFormulaValue(user.sub)}"`,
      pageSize: 25,
      offset: validated.offset,
    })
  })

const getProjectSchema = z.object({
  idToken: z.string().min(1),
  recordId: z.string().min(1),
})

export const getProject = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { idToken: string; recordId: string }) => data
  )
  .handler(async ({ data }) => {
    const validated = getProjectSchema.parse(data)
    const safeRecordId = validateRecordId(validated.recordId)
    const user = await verifyCognitoToken(validated.idToken)
    const airtable = getAirtable()

    const result = await airtable.listRecords(
      process.env.AIRTABLE_PROJECTS_TABLE!,
      {
        filterByFormula: `AND(RECORD_ID()="${escapeFormulaValue(safeRecordId)}", {Cognito User ID}="${escapeFormulaValue(user.sub)}")`,
      }
    )

    if (result.records.length === 0) {
      throw new Error('Project not found')
    }

    return result.records[0]
  })

interface SubmitProjectInput {
  idToken: string
  fields: {
    street: string
    city: string
    state: string
    fileNo: string
    requestType: string[]
    priority: string
    notes?: string
    latitude?: number
    longitude?: number
  }
}

const submitProjectSchema = z.object({
  idToken: z.string().min(1),
  fields: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1).max(2),
    fileNo: z.string(),
    requestType: z.array(z.string()),
    priority: z.enum(['Low', 'Medium', 'High']),
    notes: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
})

export const submitProject = createServerFn({ method: 'POST' })
  .inputValidator((data: SubmitProjectInput) => data)
  .handler(async ({ data }) => {
    const validated = submitProjectSchema.parse(data)
    const user = await verifyCognitoToken(validated.idToken)
    const airtable = getAirtable()

    const fields: Record<string, string | number | boolean | string[] | null> = {
      Street: validated.fields.street,
      City: validated.fields.city,
      State: validated.fields.state,
      'File No': validated.fields.fileNo,
      'Request Type': validated.fields.requestType,
      Priority: validated.fields.priority,
      Notes: validated.fields.notes ?? '',
      Status: 'Submitted',
      'Cognito User ID': user.sub,
      'Submitted By': user.email,
    }

    if (validated.fields.latitude != null && validated.fields.longitude != null) {
      fields['Latitude'] = validated.fields.latitude
      fields['Longitude'] = validated.fields.longitude
    }

    return airtable.createRecord(
      process.env.AIRTABLE_PROJECTS_TABLE!,
      fields
    )
  })
