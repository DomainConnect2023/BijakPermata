import { ReportScreen } from '@/components/report-screen';
import { ReportSectionSwitcher } from '@/components/report-section-switcher';

const SWITCHER_OPTIONS = [
  {
    label: 'Daily Balance Report',
    route: '/daily/daily-balance-report',
    icon: 'wallet-outline' as const,
  },
  {
    label: 'Daily Stock Report',
    route: '/daily/daily-stock-report',
    icon: 'cube-outline' as const,
  },
];

export function DailyStockReportScreen() {
  return (
    <ReportScreen
      title="Daily Stock Report"
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
