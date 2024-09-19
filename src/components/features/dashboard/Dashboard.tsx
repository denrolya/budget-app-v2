import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import FinancialCard from '@/components/features/statistics/FinancialCard';


export const Dashboard = () => (
  <section className="p-6">
    <div className="w-full mb-6">
      <MoneyFlow />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 justify-items-center mb-6">
      <FinancialCard />
      <FinancialCard />
      <FinancialCard />
      <FinancialCard />
      <FinancialCard />
      <FinancialCard />
    </div>
  </section>
);
