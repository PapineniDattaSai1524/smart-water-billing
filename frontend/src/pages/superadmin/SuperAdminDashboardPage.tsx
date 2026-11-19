import { Link } from 'react-router-dom';
import {
  AlertTriangle, Building2, CheckCircle2, Clock, Droplets, ShieldCheck, Users, XCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSuperAdminDashboard } from '@/hooks/useRegistrationRequests';
import { KpiCardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatIndianNumber } from '@/utils/format';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError, refetch } = useSuperAdminDashboard();

  // Each card links to the page that actually manages that data -- previously every
  // card pointed at /registration-requests regardless of what it showed.
  const cards = [
    {
      label: 'Pending Registration Requests', value: stats?.pendingRequests, icon: Clock,
      to: '/registration-requests', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    },
    {
      label: 'Approved Communities', value: stats?.approvedCommunities, icon: CheckCircle2,
      to: '/communities', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    },
    {
      label: 'Rejected Requests', value: stats?.rejectedRequests, icon: XCircle,
      to: '/registration-requests', color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
    },
    {
      label: 'Total Communities', value: stats?.totalCommunities, icon: Building2,
      to: '/communities', color: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    },
    {
      label: 'Total Apartment Administrators', value: stats?.totalAdministrators, icon: ShieldCheck,
      to: '/building-owners', color: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300',
    },
    {
      label: 'Total Residents', value: stats?.totalResidents, icon: Users,
      to: '/platform-users', color: 'bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300',
    },
    {
      label: 'Total Water Usage Records', value: stats?.totalWaterUsageRecords, icon: Droplets,
      to: '/platform-water-analytics', color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
        <p className="text-body">Platform-wide overview across all onboarded communities.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load platform statistics"
          description="Something went wrong while retrieving platform statistics."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, to, color }, i) => (
            <Link
              key={label}
              to={to}
              className="kpi-card motion-safe:animate-slide-up"
              style={{ animationDelay: `${i * 40}ms` }}
              aria-label={`${label}: ${value ?? 'no data'}. View details.`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">{label}</p>
                <p className="break-words text-lg font-semibold leading-snug text-ocean-900 dark:text-white">
                  {value != null ? formatIndianNumber(value) : '—'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card motion-safe:animate-slide-up p-6" style={{ animationDelay: '260ms' }}>
        <h2 className="text-h3 mb-2">Getting started</h2>
        <p className="text-body">
          Review pending registration requests to onboard new communities. Approving a request
          automatically creates the community, its first apartment, and an active administrator account.
        </p>
        <Link to="/registration-requests" className="btn-primary mt-4 inline-flex">Review Registration Requests</Link>
      </div>
    </div>
  );
}
