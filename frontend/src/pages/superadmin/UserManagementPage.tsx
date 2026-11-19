import { Users } from 'lucide-react';
import PlatformUsersTable from '@/components/platform/PlatformUsersTable';

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-h1">
          <Users size={22} /> User Management
        </h1>
        <p className="text-body mt-0.5">Manage users, accounts, access and status across the platform.</p>
      </div>
      <PlatformUsersTable emptyLabel="No users yet" />
    </div>
  );
}
