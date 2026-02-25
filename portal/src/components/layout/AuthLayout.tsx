import { TCRLogo } from './TCRLogo'

const AERIAL_IMAGES = [
  '/aerials/aerial-1.svg',
  '/aerials/aerial-2.svg',
  '/aerials/aerial-3.svg',
]

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const randomImage =
    AERIAL_IMAGES[Math.floor(Math.random() * AERIAL_IMAGES.length)]

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full flex-col justify-between bg-bg-secondary px-8 py-10 lg:w-[45%]">
        <div>
          <TCRLogo />
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} TCR CG, PLLC
        </p>
      </div>

      {/* Right panel — aerial photo */}
      <div
        className="hidden bg-cover bg-center lg:block lg:w-[55%]"
        style={{ backgroundImage: `url(${randomImage})` }}
      />
    </div>
  )
}
