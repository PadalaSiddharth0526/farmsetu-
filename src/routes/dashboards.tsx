import { createFileRoute } from '@tanstack/react-router';
import { PublicDashboards } from '@/components/public-dashboards';

export const Route = createFileRoute('/dashboards')({
  component: DashboardsPage,
  head: () => ({ meta: [{ title: 'Dashboards — FarmSetu' }] }),
});

function DashboardsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PublicDashboards />
    </main>
  );
}
