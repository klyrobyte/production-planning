import { 
  LayoutDashboard, 
  ClipboardList, 
  Factory, 
  ScrollText, 
  Settings, 
  Database,
  Users,
  Cpu,
  MonitorPlay
} from 'lucide-react';
import type { UserRole } from '../store/useAuthStore';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  externalUrl?: string;
}

// Global registry of all sidebar links and their role permissions
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: '3M Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super-admin', 'planner', 'leader'],
  },
  {
    id: 'board',
    label: 'Production Board',
    path: '/board',
    icon: MonitorPlay,
    allowedRoles: ['super-admin', 'planner', 'leader', 'production-board'],
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    icon: ClipboardList,
    allowedRoles: ['super-admin', 'planner'],
  },
  {
    id: 'production',
    label: 'Production Control',
    path: '/production',
    icon: Factory,
    allowedRoles: ['super-admin', 'planner', 'leader'],
  },
  {
    id: 'database',
    label: 'Database Manager',
    path: '/database',
    icon: Database,
    allowedRoles: ['super-admin', 'planner'],
  },
  {
    id: 'factories',
    label: 'Factory Management',
    path: '/factories',
    icon: Factory,
    allowedRoles: ['super-admin'],
  },
  {
    id: 'machines',
    label: 'Machine Management',
    path: '/machines',
    icon: Cpu,
    allowedRoles: ['super-admin'],
  },
  {
    id: 'users',
    label: 'User Management',
    path: '/users',
    icon: Users,
    allowedRoles: ['super-admin'],
  },
  {
    id: 'global-logs',
    label: 'Global Logs',
    path: '/global-logs',
    icon: ScrollText,
    allowedRoles: ['super-admin'],
  },
  {
    id: 'site-config',
    label: 'Site Configuration',
    path: '/site-config',
    icon: Settings,
    allowedRoles: ['super-admin'],
  },
];
