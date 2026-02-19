<template>
  <div class="portal-table-wrapper">
    <table class="portal-table">
      <thead class="portal-table__head">
        <tr>
          <th>
            <i class="iconoir-text" style="font-size: 10px; margin-right: 4px;"></i>
            Street
            <span class="portal-table__sort-icon"><i class="iconoir-sort-up"></i></span>
          </th>
          <th>
            <i class="iconoir-text" style="font-size: 10px; margin-right: 4px;"></i>
            City, State Zip
          </th>
          <th>
            <i class="iconoir-hashtag" style="font-size: 10px; margin-right: 4px;"></i>
            File No.
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Project Status
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Priority
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Request
          </th>
        </tr>
      </thead>
      <tbody class="portal-table__body">
        <tr v-for="row in rows" :key="row.id">
          <td>{{ getFieldValue(row, 'street') }}</td>
          <td>{{ getFieldValue(row, 'city_state_zip') }}</td>
          <td>{{ getFieldValue(row, 'file_no') }}</td>
          <td>
            <ProjectStatusBadge
              v-if="getSelectValue(row, 'project_status')"
              :status="getSelectValue(row, 'project_status')"
            />
          </td>
          <td>
            <PriorityBadge
              v-if="getSelectValue(row, 'priority')"
              :priority="getSelectValue(row, 'priority')"
            />
          </td>
          <td>
            <div class="portal-table__badges">
              <RequestTypeBadge
                v-for="reqType in getMultiSelectValues(row, 'request')"
                :key="reqType"
                :type="reqType"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ProjectStatusBadge from '@baserow/modules/core/components/portal/badges/ProjectStatusBadge'
import PriorityBadge from '@baserow/modules/core/components/portal/badges/PriorityBadge'
import RequestTypeBadge from '@baserow/modules/core/components/portal/badges/RequestTypeBadge'

export default {
  name: 'ProjectTable',
  components: {
    ProjectStatusBadge,
    PriorityBadge,
    RequestTypeBadge,
  },
  props: {
    rows: {
      type: Array,
      default: () => [],
    },
    fieldMap: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    getFieldValue(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return ''
      return row[`field_${fieldId}`] || ''
    },
    getSelectValue(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return ''
      const val = row[`field_${fieldId}`]
      if (!val) return ''
      return typeof val === 'object' ? val.value : val
    },
    getMultiSelectValues(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return []
      const val = row[`field_${fieldId}`]
      if (!val) return []
      if (Array.isArray(val)) {
        return val.map((v) => (typeof v === 'object' ? v.value : v))
      }
      return []
    },
  },
}
</script>
