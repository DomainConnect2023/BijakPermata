import { ReportScreen } from '@/components/report-screen';
import { ReportSectionSwitcher } from '@/components/report-section-switcher';

const SWITCHER_OPTIONS = [
  {
    label: 'Purchase Detail Report',
    route: '/purchasing/purchase-detail-report',
    icon: 'document-text-outline' as const,
  },
  {
    label: 'Buy Cancel',
    route: '/purchasing/buy-cancel',
    icon: 'close-circle-outline' as const,
  },
];

export function BuyCancelScreen() {
  return (
    <ReportScreen
      title="Buy Cancel"
      topExtra={
        <ReportSectionSwitcher
          label="Report"
          options={SWITCHER_OPTIONS}
          activeIndex={1}
        />
      }
    />
  );
}
