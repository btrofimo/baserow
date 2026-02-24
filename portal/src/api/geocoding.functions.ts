import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { searchAddress } from '../lib/geocoding.server'

const geocodeInput = z.object({
  query: z.string().min(3).max(200),
})

export const geocodeAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => geocodeInput.parse(data))
  .handler(async ({ data }) => {
    return searchAddress(data.query)
  })
