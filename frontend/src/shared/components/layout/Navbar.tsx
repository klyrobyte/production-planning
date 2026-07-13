import { Menu, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface NavbarProps {
  onToggleSidebar: () => void;
  title: string;
}

// Render the top application header with user details and mobile sidebar trigger
export default function Navbar({ onToggleSidebar, title }: NavbarProps) {
  const user = useAuthStore((state) => state.user);
  const activePortal = useAuthStore((state) => state.activePortal);
  const logoutDevice = useAuthStore((state) => state.logoutDevice);
  const colorNavbar = useThemeStore((state) => state.colorNavbar);
  const darkMode = useThemeStore((state) => state.darkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);

  return (
    <header 
      style={{ backgroundColor: colorNavbar }}
      className="flex h-16 w-full items-center justify-between px-6 text-white shadow-md transition-colors duration-300"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 transition hover:bg-white/10 lg:hidden cursor-pointer"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white lg:text-base">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-r border-white/20 pr-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-tight truncate max-w-[120px]">{user.name}</p>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
                Portal: {activePortal}
              </span>
            </div>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer border border-white/10"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-100" />}
        </button>

        <button
          onClick={logoutDevice}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer border border-white/10"
          title="Logout workstation"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
