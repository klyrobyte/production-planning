import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { NAVIGATION_ITEMS } from '../../constants/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Render the side navigation panel filtering pages dynamically based on active user role
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const activePortal = useAuthStore((state) => state.activePortal);
  const logoutDevice = useAuthStore((state) => state.logoutDevice);
  const colorSecondary = useThemeStore((state) => state.colorSecondary);
  const systemTitle = useThemeStore((state) => state.systemTitle);
  const systemLogo = useThemeStore((state) => state.systemLogo);

  // Filter navigation items by active role permissions
  const visibleNavItems = NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(activePortal)
  );

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        style={{
          backgroundColor: colorSecondary,
        }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
              <img src={systemLogo || '/logo.png'} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-black uppercase tracking-tight">{systemTitle}</p>
              <p className="text-[9px] font-medium text-white/80 uppercase tracking-widest mt-0.5">Planning Board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/10 lg:hidden cursor-pointer"
            title="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Nav Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          <div className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Main Menu</div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-md border border-white/10 backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Portal Info & Logout footer */}
        <div className="border-t border-white/10 bg-black/5 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-inner">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black leading-tight uppercase tracking-wider">{activePortal}</p>
              <p className="text-[9px] font-medium text-white/60 mt-0.5">Sugity Creatives</p>
            </div>
          </div>

          <button
            onClick={() => {
              logoutDevice();
              onClose();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-[10px] font-black uppercase tracking-widest transition hover:bg-white/20 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout Device
          </button>
        </div>
      </aside>
    </>
  );
}
