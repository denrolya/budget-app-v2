import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Type as AccountType } from '@/types/account';
import { StatisticsConfig } from '@/types/statistics';
import { generateSlug } from '@/lib/url/generateSlug';
import TotalBalanceCard from '@/features/statistics/components/TotalBalanceCard';
import { StatisticsCard } from '@/features/statistics/components/StatisticsCard/Card';
import BalanceByAccountType from '@/features/statistics/components/BalanceByAccountType';

interface Props {
  configs: Record<string, StatisticsConfig[]>;
  groups: string[];
}

const StatisticsCardsSidebar: React.FC<Props> = ({ configs, groups }) => {
  const handleConfigChange = (newConfig: Partial<StatisticsConfig>) => {
    console.log(newConfig);
  };

  const renderStatisticsCards = (group: string) => (
    <>
      {configs[group].map((card: StatisticsConfig) => (
        <StatisticsCard
          config={card}
          key={`statistics-card-${group}-${generateSlug([card.title, card.type, card.statType])}`}
          onChange={handleConfigChange}
        />
      ))}
    </>
  );

  return (
    <div className="fixed right-0 z-50 group hidden lg:block">
      {/* Floating handle */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-muted px-1.5 py-2 rounded-l-md shadow cursor-pointer group-hover:opacity-0 transition-opacity duration-300">
        <div className="w-1.5 h-8 bg-primary rounded-full" />
      </div>

      {/* Container that clips the sidebar */}
      <div className="w-0 group-hover:w-[340px] transition-all duration-300 overflow-hidden">
        {/* Sidebar content */}
        <aside className="bg-background w-[340px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] backdrop-blur-xs h-[calc(100vh-2rem)] rounded-l-md">
          <ScrollArea className="h-full px-4">
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <BalanceByAccountType type={AccountType.Cash} />
                <BalanceByAccountType type={AccountType.Bank} />
                <TotalBalanceCard />
              </div>
              <Separator className="my-6" />
              {groups.map((group, index) => (
                <div key={group}>
                  {index > 0 && <Separator className="my-6" />}
                  <h3 className="text-lg font-semibold mb-4 capitalize text-primary">{group}</h3>
                  <div className="space-y-4">{renderStatisticsCards(group)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default StatisticsCardsSidebar;
