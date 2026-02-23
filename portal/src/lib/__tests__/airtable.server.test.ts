import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAirtableClient } from '../airtable.server'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AirtableClient', () => {
  const client = createAirtableClient({
    pat: 'pat_test',
    baseId: 'appTEST',
  })

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listRecords', () => {
    it('fetches records from a table with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { id: 'rec1', fields: { Name: 'Project A' } },
          ],
        }),
      })

      const result = await client.listRecords('Projects')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer pat_test',
          }),
        })
      )
      expect(result.records).toHaveLength(1)
      expect(result.records[0].fields.Name).toBe('Project A')
    })

    it('applies filterByFormula when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      })

      await client.listRecords('Projects', {
        filterByFormula: '{Status}="Active"',
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('filterByFormula')
      expect(calledUrl).toContain(encodeURIComponent('{Status}="Active"'))
    })

    it('applies sort parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      })

      await client.listRecords('Projects', {
        sort: [{ field: 'Status', direction: 'asc' as const }],
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('sort%5B0%5D%5Bfield%5D=Status')
      expect(calledUrl).toContain('sort%5B0%5D%5Bdirection%5D=asc')
    })

    it('applies pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [], offset: 'next123' }),
      })

      await client.listRecords('Projects', {
        pageSize: 25,
        offset: 'prev123',
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('pageSize=25')
      expect(calledUrl).toContain('offset=prev123')
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: { message: 'Invalid formula' } }),
      })

      await expect(client.listRecords('Projects')).rejects.toThrow(
        'Airtable API error (422)'
      )
    })
  })

  describe('createRecord', () => {
    it('creates a record with provided fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 'recNew', fields: { Name: 'New Project' } }],
        }),
      })

      const result = await client.createRecord('Projects', {
        Name: 'New Project',
        Status: 'Submitted',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            records: [{ fields: { Name: 'New Project', Status: 'Submitted' } }],
          }),
        })
      )
      expect(result.id).toBe('recNew')
    })
  })

  describe('updateRecord', () => {
    it('updates a record with partial fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 'rec1', fields: { Status: 'Approved' } }],
        }),
      })

      const result = await client.updateRecord('Projects', 'rec1', {
        Status: 'Approved',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v0/appTEST/Projects'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            records: [{ id: 'rec1', fields: { Status: 'Approved' } }],
          }),
        })
      )
      expect(result.fields.Status).toBe('Approved')
    })
  })
})
