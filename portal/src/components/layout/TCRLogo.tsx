interface TCRLogoProps {
  collapsed?: boolean
}

export function TCRLogo({ collapsed = false }: TCRLogoProps) {
  if (collapsed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange">
        <span className="text-lg font-bold text-white">T</span>
      </div>
    )
  }

  return (
    <svg viewBox="0 0 80 32" className="h-8" fill="none">
      <text
        x="0"
        y="26"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill="#dc4b1a"
      >
        TCR
      </text>
    </svg>
  )
}
