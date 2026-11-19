import { ShieldCheck } from 'lucide-react';
import RoleAssignmentTable from '@/components/platform/RoleAssignmentTable';

export default function RoleManagementPage() {
  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-h1">
          <ShieldCheck size={22} /> Role Management
        </h1>
        <p className="text-body mt-0.5">Define access levels and permissions across the platform.</p>
      </div>
      <RoleAssignmentTable emptyLabel="No users yet" />
    </div>
  );
}
