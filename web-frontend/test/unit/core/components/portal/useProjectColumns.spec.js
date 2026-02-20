import { describe, it, expect } from 'vitest'
import { createProjectColumns } from '@baserow/modules/core/components/portal/useProjectColumns'

describe('createProjectColumns', () => {
  const fieldMap = {
    street: 101,
    city_state_zip: 102,
    file_no: 103,
    project_status: 104,
    priority: 105,
    request: 106,
  }

  it('returns 6 column definitions', () => {
    const columns = createProjectColumns(fieldMap)
    expect(columns).toHaveLength(6)
  })

  it('creates text accessor columns for street, city_state_zip, file_no', () => {
    const columns = createProjectColumns(fieldMap)
    const row = { field_101: '123 Main St', field_102: 'Austin, TX 78701', field_103: '2026-P086' }

    expect(columns[0].accessorFn(row)).toBe('123 Main St')
    expect(columns[1].accessorFn(row)).toBe('Austin, TX 78701')
    expect(columns[2].accessorFn(row)).toBe('2026-P086')
  })

  it('creates select accessor for project_status', () => {
    const columns = createProjectColumns(fieldMap)
    const row = { field_104: { id: 1, value: 'Submitted', color: 'green' } }
    expect(columns[3].accessorFn(row)).toBe('Submitted')
  })

  it('creates select accessor that handles string values', () => {
    const columns = createProjectColumns(fieldMap)
    const row = { field_105: 'High' }
    expect(columns[4].accessorFn(row)).toBe('High')
  })

  it('returns empty string for missing fields', () => {
    const columns = createProjectColumns({})
    const row = { field_999: 'something' }
    expect(columns[0].accessorFn(row)).toBe('')
  })

  it('creates multi-select accessor for request that returns joined string for sorting', () => {
    const columns = createProjectColumns(fieldMap)
    const row = { field_106: [{ value: 'Estimate' }, { value: 'Roof Report' }] }
    expect(columns[5].accessorFn(row)).toBe('Estimate, Roof Report')
  })

  it('each column has an id and header', () => {
    const columns = createProjectColumns(fieldMap)
    const ids = columns.map((c) => c.id)
    expect(ids).toEqual(['street', 'city_state_zip', 'file_no', 'project_status', 'priority', 'request'])
  })
})
