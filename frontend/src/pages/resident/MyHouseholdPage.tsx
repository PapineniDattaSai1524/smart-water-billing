import { Building2, Home, Ruler, UserX, Users } from 'lucide-react';
import { useMyHousehold } from '@/hooks/useDashboardExtras';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { getApiErrorMessage } from '@/utils/apiError';

export default function MyHouseholdPage() {
  const { data: household, isLoading, isError, error } = useMyHousehold();

  if (isLoading) return <LoadingSpinner label="Loading your household..." />;

  if (isError || !household) {
    return (
      <EmptyState
        icon={UserX}
        title="Not linked to a household yet"
        description={getApiErrorMessage(
          error,
          'Your account isn\'t assigned to a household yet. Please contact your Building Owner administrator so they can add you.',
        )}
      />
    );
  }

  const facts = [
    { label: 'Apartment', value: household.apartmentName, icon: Building2 },
    { label: 'House Number', value: household.unitNumber, icon: Home },
    { label: 'Area', value: `${household.areaSqft} sq.ft`, icon: Ruler },
    { label: 'Occupants', value: household.occupancyCount, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">My Household</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Details about your apartment and unit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(({ label, value, icon: Icon }, i) => (
          <div
            key={label}
            className="card-interactive motion-safe:animate-slide-up flex items-center gap-4 p-5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">{label}</p>
              <p className="text-lg font-semibold text-ocean-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card motion-safe:animate-slide-up p-6 text-sm text-ocean-600 dark:text-ocean-300" style={{ animationDelay: '160ms' }}>
        <p>
          Water meter status: <span className="font-medium text-ocean-800 dark:text-ocean-100">{household.meterConfigured ? 'Configured' : 'Not yet configured'}</span>
        </p>
      </div>
    </div>
  );
}
