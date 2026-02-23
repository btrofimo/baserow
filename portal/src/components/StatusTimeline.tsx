const STATUS_ORDER = ['Submitted', 'In Review', 'Approved', 'Completed']

interface StatusTimelineProps {
  currentStatus: string
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-2">
      {STATUS_ORDER.map((status, index) => (
        <div key={status} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              index <= currentIndex ? 'bg-[#dc4b1a]' : 'bg-gray-300'
            }`}
          />
          <span
            className={`text-sm ${
              index <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            {status}
          </span>
          {index < STATUS_ORDER.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                index < currentIndex ? 'bg-[#dc4b1a]' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
