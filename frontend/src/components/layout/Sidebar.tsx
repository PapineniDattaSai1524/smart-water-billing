import { NavLink } from 'react-router-dom';
import { Fragment, type ComponentType } from 'react';
import {
  LayoutDashboard, Building2, Home, Users, Gauge, Droplets, UserCircle, ClipboardList,
  UserCog, Bell, Receipt, ShieldCheck, ScrollText, History, Wallet, CreditCard,
  TrendingUp, FileBarChart, Activity, Megaphone, Settings, UserCog2, BellRing, CalendarClock,
  Truck, ChevronsLeft, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}
interface NavGroup {
  label: string;
  roles: Array<'SUPER_ADMIN' | 'ADMIN' | 'RESIDENT'>;
  items: NavItem[];
}

// Grouped per role, matching the spec's information architecture. Every route here
// matches an existing route in App.tsx 1:1 -- nothing added, nothing removed, just organized.
const navGroups: NavGroup[] = [
  {
    label: 'Overview', roles: ['SUPER_ADMIN', 'ADMIN', 'RESIDENT'],
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  // ---- Super Admin ----
  {
    label: 'Platform', roles: ['SUPER_ADMIN'],
    items: [
      { to: '/registration-requests', label: 'Registration Requests', icon: ClipboardList },
      { to: '/communities', label: 'Community Management', icon: ShieldCheck },
      { to: '/building-owners', label: 'Building Owner Management', icon: Building2 },
      { to: '/platform-users', label: 'User Management', icon: UserCog },
      { to: '/role-management', label: 'Role Management', icon: UserCog2 },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
  {
    label: 'Analytics & Reports', roles: ['SUPER_ADMIN'],
    items: [
      { to: '/platform-analytics', label: 'Platform Analytics', icon: TrendingUp },
      { to: '/platform-revenue', label: 'Revenue Analytics', icon: Wallet },
      { to: '/platform-water-analytics', label: 'Water Analytics', icon: Droplets },
      { to: '/platform-reports', label: 'Reports', icon: FileBarChart },
      { to: '/system-health', label: 'System Health', icon: Activity },
    ],
  },
  {
    label: 'System', roles: ['SUPER_ADMIN'],
    items: [
      { to: '/global-notifications', label: 'Global Notifications', icon: Megaphone },
      { to: '/platform-settings', label: 'Settings', icon: Settings },
    ],
  },
  // ---- Building Owner / Admin ----
  {
    label: 'Community', roles: ['ADMIN'],
    items: [
      { to: '/apartments', label: 'Apartment Management', icon: Building2 },
      { to: '/households', label: 'Households', icon: Home },
      { to: '/residents', label: 'Residents', icon: Users },
      { to: '/user-management', label: 'Resident Accounts', icon: UserCog },
      { to: '/owner-notifications', label: 'Notifications', icon: Megaphone },
    ],
  },
  {
    label: 'Water', roles: ['ADMIN'],
    items: [
      { to: '/meters', label: 'Meter Configuration', icon: Gauge },
      { to: '/usage', label: 'Water Usage', icon: Droplets },
      { to: '/water-purchases', label: 'Water Purchases', icon: Truck },
      { to: '/water-analytics', label: 'Water Analytics', icon: Droplets },
      { to: '/alerts', label: 'Water Usage Alerts', icon: BellRing },
    ],
  },
  {
    label: 'Billing', roles: ['ADMIN'],
    items: [
      { to: '/billing', label: 'Billing', icon: Receipt },
      { to: '/billing-cycles', label: 'Billing Cycles', icon: CalendarClock },
      { to: '/payment-collection', label: 'Payment Collection', icon: Wallet },
      { to: '/revenue-dashboard', label: 'Revenue Dashboard', icon: TrendingUp },
    ],
  },
  {
    label: 'Reports', roles: ['ADMIN'],
    items: [{ to: '/admin-reports', label: 'Reports', icon: FileBarChart }],
  },
  {
    label: 'System', roles: ['ADMIN'],
    items: [{ to: '/admin-settings', label: 'Settings', icon: Settings }],
  },
  // ---- Resident ----
  {
    label: 'My Water', roles: ['RESIDENT'],
    items: [
      { to: '/my-household', label: 'My Household', icon: Home },
      { to: '/usage-history', label: 'Water Usage', icon: History },
    ],
  },
  {
    label: 'Billing', roles: ['RESIDENT'],
    items: [
      { to: '/my-bills', label: 'Bills', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  // ---- Shared, all roles ----
  {
    label: 'System', roles: ['SUPER_ADMIN', 'ADMIN', 'RESIDENT'],
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'My Profile', icon: UserCircle },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const groups = navGroups.filter((g) => !user || g.roles.includes(user.role));

  const content = (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto p-3">
      {groups.map((group, idx) => (
        <Fragment key={group.label + idx}>
          {!collapsed && <p className="sidebar-group-label first:pt-1">{group.label}</p>}
          {collapsed && idx > 0 && <div className="my-2 border-t border-ocean-100 dark:border-ocean-800" />}
          {group.items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                clsx('sidebar-link group', collapsed && 'justify-center px-2', isActive && 'sidebar-link-active')
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ocean-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-ocean-700">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </Fragment>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop rail: collapsible, always visible at md+ */}
      <aside
        className={clsx(
          'relative hidden shrink-0 border-r border-ocean-100 bg-white transition-all duration-200 dark:border-ocean-800 dark:bg-ocean-900 md:flex md:flex-col',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {content}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-ocean-200 bg-white text-ocean-500 shadow-sm transition-transform hover:text-aqua-600 dark:border-ocean-700 dark:bg-ocean-800 dark:text-ocean-400"
        >
          <ChevronsLeft size={14} className={clsx('transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ocean-950/50 backdrop-blur-sm animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-ocean-100 bg-white shadow-glass-lg animate-slide-in-right dark:border-ocean-800 dark:bg-ocean-900">
            <div className="flex items-center justify-between border-b border-ocean-100 p-3 dark:border-ocean-800">
              <span className="text-h3">Navigation</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800"
              >
                <X size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
