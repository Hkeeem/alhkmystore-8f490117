import { createFileRoute } from '@tanstack/react-router';
import AdminDealsManager from '../components/admin/AdminDealsManager';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div dir="rtl" className="p-4 max-w-6xl mx-auto">
      <AdminDealsManager />
    </div>
  );
}
