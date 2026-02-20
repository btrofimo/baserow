/**
 * Creates TanStack Table column definitions for the portal project table.
 *
 * @param {Object} fieldMap - Maps semantic keys to Baserow field IDs
 *   e.g. { street: 101, city_state_zip: 102, ... }
 * @returns {import('@tanstack/vue-table').ColumnDef[]}
 */
export function createProjectColumns(fieldMap) {
  const textAccessor = (key) => (row) => {
    const fieldId = fieldMap[key]
    if (!fieldId) return ''
    return row[`field_${fieldId}`] || ''
  }

  const selectAccessor = (key) => (row) => {
    const fieldId = fieldMap[key]
    if (!fieldId) return ''
    const val = row[`field_${fieldId}`]
    if (!val) return ''
    return typeof val === 'object' ? val.value : val
  }

  const multiSelectAccessor = (key) => (row) => {
    const fieldId = fieldMap[key]
    if (!fieldId) return ''
    const val = row[`field_${fieldId}`]
    if (!val || !Array.isArray(val)) return ''
    return val.map((v) => (typeof v === 'object' ? v.value : v)).join(', ')
  }

  return [
    {
      id: 'street',
      header: 'Street',
      accessorFn: textAccessor('street'),
      meta: { icon: 'iconoir-text' },
    },
    {
      id: 'city_state_zip',
      header: 'City, State Zip',
      accessorFn: textAccessor('city_state_zip'),
      meta: { icon: 'iconoir-text' },
    },
    {
      id: 'file_no',
      header: 'File No.',
      accessorFn: textAccessor('file_no'),
      meta: { icon: 'iconoir-hashtag' },
    },
    {
      id: 'project_status',
      header: 'Project Status',
      accessorFn: selectAccessor('project_status'),
      meta: { icon: 'iconoir-circle', cellType: 'status' },
    },
    {
      id: 'priority',
      header: 'Priority',
      accessorFn: selectAccessor('priority'),
      meta: { icon: 'iconoir-circle', cellType: 'priority' },
    },
    {
      id: 'request',
      header: 'Request',
      accessorFn: multiSelectAccessor('request'),
      meta: { icon: 'iconoir-circle', cellType: 'request' },
    },
  ]
}
