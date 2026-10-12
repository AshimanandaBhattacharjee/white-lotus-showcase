import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-2 py-1.5 text-sm sm:px-3 transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'
  }`

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-pond text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <img src="/favicon.svg" alt="" className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="whitespace-nowrap font-display text-lg tracking-wide sm:text-xl">
              White Lotus<span className="hidden sm:inline"> Residences</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink to="/" end className={navClass}>
              Residences
            </NavLink>
            <NavLink to="/admin" className={navClass}>
              Sales desk
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-reed">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-stone sm:px-6">
          White Lotus Group, Bengaluru. Internal sales tool.
        </p>
      </footer>
    </div>
  )
}
