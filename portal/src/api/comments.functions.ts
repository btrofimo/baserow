import { createServerFn } from '@tanstack/react-start'
import { createAirtableClient } from '../lib/airtable.server'
import { verifyCognitoToken } from '../lib/auth.server'

function getAirtable() {
  return createAirtableClient({
    pat: process.env.AIRTABLE_PAT!,
    baseId: process.env.AIRTABLE_BASE_ID!,
  })
}

export const listComments = createServerFn({ method: 'POST' })
  .validator((data: { idToken: string; projectRecordId: string }) => data)
  .handler(async ({ data }) => {
    await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.listRecords(process.env.AIRTABLE_COMMENTS_TABLE!, {
      filterByFormula: `{Project}="${data.projectRecordId}"`,
      sort: [{ field: 'Created At', direction: 'asc' }],
    })
  })

export const addComment = createServerFn({ method: 'POST' })
  .validator(
    (data: { idToken: string; projectRecordId: string; body: string }) => data
  )
  .handler(async ({ data }) => {
    const user = await verifyCognitoToken(data.idToken)
    const airtable = getAirtable()

    return airtable.createRecord(process.env.AIRTABLE_COMMENTS_TABLE!, {
      Project: [data.projectRecordId],
      Author: user.email,
      Body: data.body,
    })
  })
