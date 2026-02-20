<template>
  <div class="portal-table-wrapper">
    <table class="portal-table">
      <thead class="portal-table__head">
        <tr
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <th
            v-for="header in headerGroup.headers"
            :key="header.id"
            :style="{ width: `${header.getSize()}px` }"
            :class="{
              'portal-table__head--sortable': header.column.getCanSort(),
            }"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <i
              v-if="header.column.columnDef.meta?.icon"
              :class="header.column.columnDef.meta.icon"
              style="font-size: 10px; margin-right: 4px"
            ></i>
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
            <span
              v-if="header.column.getIsSorted()"
              class="portal-table__sort-icon"
            >
              <i
                :class="
                  header.column.getIsSorted() === 'asc'
                    ? 'iconoir-sort-up'
                    : 'iconoir-sort-down'
                "
              ></i>
            </span>

            <div
              v-if="header.column.getCanResize()"
              class="portal-table__resizer"
              :class="{
                'portal-table__resizer--active': header.column.getIsResizing(),
              }"
              @mousedown="header.getResizeHandler()($event)"
              @touchstart="header.getResizeHandler()($event)"
            ></div>
          </th>
        </tr>
      </thead>

      <tbody class="portal-table__body">
        <tr v-for="row in table.getRowModel().rows" :key="row.id">
          <td v-for="cell in row.getVisibleCells()" :key="cell.id">
            <template v-if="cell.column.columnDef.meta?.cellType === 'status'">
              <ProjectStatusBadge
                v-if="cell.getValue()"
                :status="cell.getValue()"
              />
            </template>
            <template
              v-else-if="cell.column.columnDef.meta?.cellType === 'priority'"
            >
              <PriorityBadge
                v-if="cell.getValue()"
                :priority="cell.getValue()"
              />
            </template>
            <template
              v-else-if="cell.column.columnDef.meta?.cellType === 'request'"
            >
              <div class="portal-table__badges">
                <RequestTypeBadge
                  v-for="reqType in getMultiSelectValues(
                    row.original,
                    'request'
                  )"
                  :key="reqType"
                  :type="reqType"
                />
              </div>
            </template>
            <template v-else>
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="table.getPageCount() > 1" class="portal-table__pagination">
      <button
        class="portal-table__page-btn"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        <i class="iconoir-nav-arrow-left"></i>
        {{ i18n.t('portal.previousPage') }}
      </button>
      <span class="portal-table__page-info">
        {{ i18n.t('portal.pageOf', {
          current: table.getState().pagination.pageIndex + 1,
          total: table.getPageCount(),
        }) }}
      </span>
      <button
        class="portal-table__page-btn"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        {{ i18n.t('portal.nextPage') }}
        <i class="iconoir-nav-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  useVueTable,
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/vue-table'

import ProjectStatusBadge from '@baserow/modules/core/components/portal/badges/ProjectStatusBadge'
import PriorityBadge from '@baserow/modules/core/components/portal/badges/PriorityBadge'
import RequestTypeBadge from '@baserow/modules/core/components/portal/badges/RequestTypeBadge'
import { createProjectColumns } from '@baserow/modules/core/components/portal/useProjectColumns'

const i18n = useI18n()

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  fieldMap: {
    type: Object,
    default: () => ({}),
  },
})

const sorting = ref([])
const pagination = ref({ pageIndex: 0, pageSize: 25 })

const columns = computed(() => createProjectColumns(props.fieldMap))

const table = useVueTable({
  get data() {
    return props.rows
  },
  get columns() {
    return columns.value
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  columnResizeMode: 'onChange',
  state: {
    get sorting() {
      return sorting.value
    },
    get pagination() {
      return pagination.value
    },
  },
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onPaginationChange: (updater) => {
    pagination.value =
      typeof updater === 'function' ? updater(pagination.value) : updater
  },
})

function getMultiSelectValues(row, fieldKey) {
  const fieldId = props.fieldMap[fieldKey]
  if (!fieldId) return []
  const val = row[`field_${fieldId}`]
  if (!val || !Array.isArray(val)) return []
  return val.map((v) => (typeof v === 'object' ? v.value : v))
}
</script>
