import { ReportScreen } from '@/components/report-screen';
import { ReportSectionSwitcher } from '@/components/report-section-switcher';

const SWITCHER_OPTIONS = [
  {
    label: 'Sales Detail Report',
    route: '/sales/sales-detail-report',
    icon: 'document-text-outline' as const,
  },
  {
    label: 'Sale Cancel Report',
    route: '/sales/sale-cancel-report',
    icon: 'close-circle-outline' as const,
  },
];

export function SaleCancelReportScreen() {
  return (
    <ReportScreen
      title="Sale Cancel Report"
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
