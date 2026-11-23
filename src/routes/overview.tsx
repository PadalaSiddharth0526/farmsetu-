import { createFileRoute } from '@tanstack/react-router';
import { PublicOverview } from '@/components/public-overview';

export const Route = createFileRoute('/overview')({
  component: OverviewPage,
  head: () => ({ meta: [{ title: 'Marketplace Overview — FarmSetu' }] }),
});

function OverviewPage() {
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <PublicOverview />
  </main>;
}
