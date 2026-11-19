import { Building2 } from 'lucide-react';
import PlatformUsersTable from '@/components/platform/PlatformUsersTable';

export default function BuildingOwnerManagementPage() {
  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-ocean-900 dark:text-white">
          <Building2 size={20} /> Building Owner Management
        </h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">All Building Owner accounts across every community.</p>
      </div>
      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '60ms' }}>
        <PlatformUsersTable roleFilter="ADMIN" emptyLabel="No building owners yet" />
      </div>
    </div>
  );
}
