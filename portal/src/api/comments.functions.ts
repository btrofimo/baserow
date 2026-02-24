import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { verifyCognitoToken } from '../lib/auth.server'
import {
  getAirtable,
  escapeFormulaValue,
  validateRecordId,
} from '../lib/airtable-helpers.server'

async function verifyProjectOwnership(
  idToken: string,
  projectRecordId: string
) {
  const user = await verifyCognitoToken(idToken)
  const safeRecordId = validateRecordId(projectRecordId)
  const airtable = getAirtable()

  const project = await airtable.listRecords(
    process.env.AIRTABLE_PROJECTS_TABLE!,
    {
      filterByFormula: `AND(RECORD_ID()="${escapeFormulaValue(safeRecordId)}", {Cognito User ID}="${escapeFormulaValue(user.sub)}")`,
    }
  )

  if (project.records.length === 0) {
    throw new Error('Project not found')
  }

  return { user, safeRecordId }
}

const listCommentsSchema = z.object({
  idToken: z.string().min(1),
  projectRecordId: z.string().min(1),
})

export const listComments = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { idToken: string; projectRecordId: string }) => data
  )
  .handler(async ({ data }) => {
    const validated = listCommentsSchema.parse(data)
    const { safeRecordId } = await verifyProjectOwnership(
      validated.idToken,
      validated.projectRecordId
    )
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_COMMENTS_TABLE!, {
      filterByFormula: `{Project Record ID}="${escapeFormulaValue(safeRecordId)}"`,
    })
  })

const addCommentSchema = z.object({
  idToken: z.string().min(1),
  projectRecordId: z.string().min(1),
  body: z.string().min(1).max(5000),
})

export const addComment = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { idToken: string; projectRecordId: string; body: string }) => data
  )
  .handler(async ({ data }) => {
    const validated = addCommentSchema.parse(data)
    const { user, safeRecordId } = await verifyProjectOwnership(
      validated.idToken,
      validated.projectRecordId
    )
    const airtable = getAirtable()

    return airtable.createRecord(process.env.AIRTABLE_COMMENTS_TABLE!, {
      Project: [safeRecordId],
      'Project Record ID': safeRecordId,
      Author: user.email,
      Body: validated.body,
    })
  })
