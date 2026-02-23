import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { StatusBadge } from './StatusBadge'
import { PriorityBadge } from './PriorityBadge'

interface Project {
  id: string
  fields: Record<string, unknown>
}

const columns: ColumnDef<Project>[] = [
  {
    id: 'fileNo',
    header: 'File No',
    accessorFn: (row) => row.fields['File No'] ?? '',
  },
  {
    id: 'street',
    header: 'Street',
    accessorFn: (row) => row.fields['Street'] ?? '',
  },
  {
    id: 'city',
    header: 'City',
    accessorFn: (row) => row.fields['City'] ?? '',
  },
  {
    id: 'state',
    header: 'State',
    accessorFn: (row) => row.fields['State'] ?? '',
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.fields['Status'] ?? '',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    id: 'priority',
    header: 'Priority',
    accessorFn: (row) => row.fields['Priority'] ?? '',
    cell: ({ getValue }) => <PriorityBadge priority={getValue() as string} />,
  },
  {
    id: 'requestType',
    header: 'Request Type',
    accessorFn: (row) => {
      const val = row.fields['Request Type']
      return Array.isArray(val) ? val.join(', ') : ''
    },
  },
]

interface ProjectsTableProps {
  data: Project[]
}

export function ProjectsTable({ data }: ProjectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' \u2191',
                        desc: ' \u2193',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  navigate({
                    to: '/projects/$projectId',
                    params: { projectId: row.original.id },
                  })
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t">
        <span className="text-sm text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
