const TAG_STYLES: Record<string, string> = {
  'Engineering Report': 'bg-red-500/10 text-red-400 border-red-500/30',
  Estimate: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  'Weather Analysis': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Roof Report': 'bg-red-500/10 text-red-400 border-red-500/30',
  'Photo Report': 'bg-green-500/10 text-green-400 border-green-500/30',
  'Thermal Mapping': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Moisture Mapping': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Bid: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  'General Document': 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  Survey: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  Inspection: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Measurements: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
}

interface RequestTypeTagsProps {
  types: string[]
}

export function RequestTypeTags({ types }: RequestTypeTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => {
        const style =
          TAG_STYLES[type] ?? 'bg-gray-500/10 text-gray-300 border-gray-500/30'
        return (
          <span
            key={type}
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}
          >
            {type}
          </span>
        )
      })}
    </div>
  )
}
