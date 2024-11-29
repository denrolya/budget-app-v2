import React, { useEffect, useRef, useState } from 'react';

import BalanceByAccountType from '@/components/features/statistics/BalanceByAccountType';
import CategoriesDoughnut from '@/components/features/statistics/CategoriesDoughnut/Card';
import CategoriesTimeline from '@/components/features/statistics/CategoriesTimeline/Card';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import TotalBalanceCard from '@/components/features/statistics/TotalBalanceCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cardConfigs } from '@/constants/dashboard-config';
import { Type as AccountType } from '@/types/account';
import { StatisticsConfig } from '@/types/statistics';
import { generateSlug } from '@/utils/generateSlug';

const DashboardPage: React.FC = () => {
  const [configs] = useState(cardConfigs);
  const groups = Object.keys(configs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleConfigChange = (newConfig: Partial<StatisticsConfig>) => {
    console.log(newConfig);
  };

  const renderStatisticsCards = (group: string) => (
    <>
      {configs[group].map((card: StatisticsConfig) => (
        <StatisticsCard
          key={`statistics-card-${group}-${generateSlug([card.title, card.type, card.statType])}`}
          config={card}
          onChange={handleConfigChange}
        />
      ))}
    </>
  );

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollPosition(scrollRef.current.scrollLeft);
      }
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  const allCards = [
    { type: 'balance', accountType: AccountType.Cash },
    { type: 'balance', accountType: AccountType.Bank },
    { type: 'total' },
    ...groups.flatMap(group =>
      configs[group].map(card => ({ type: 'statistics', group, card })),
    ),
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] overflow-hidden bg-background">
      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 pb-[187px] lg:pb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="w-full lg:w-2/3">
            <MoneyFlow />
          </div>
          <div className="w-full lg:w-1/3">
            <CategoriesDoughnut className="h-full" />
          </div>
        </div>

        <CategoriesTimeline />
      </main>

      {/* Mobile view: Bottom-fixed horizontal scroll above the menu bar */}
      <div className="lg:hidden fixed bottom-[47px] left-0 w-full h-[180px] bg-gradient-to-b from-background/0 to-background">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory h-full py-4 px-6"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          aria-label="Scrollable card container"
        >
          {allCards.map((item, index) => {
            const cardWidth = 300;
            const cardCenter = index * cardWidth + cardWidth / 2;
            const distanceFromCenter = Math.abs(cardCenter - (scrollPosition + window.innerWidth / 2));
            const maxDistance = window.innerWidth / 2 + cardWidth / 2;
            const blurAmount = Math.min(distanceFromCenter / maxDistance, 1);
            const opacityAmount = 1 - (distanceFromCenter / maxDistance) * 0.2;

            return (
              <div
                key={index}
                className="snap-center shrink-0"
                style={{
                  transform: `scale(${1 - blurAmount / 20})`, // Slight scale effect
                  transition: 'transform 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    filter: `blur(${blurAmount}px)`,
                    opacity: opacityAmount,
                    transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
                  }}
                >
                  {item.type === 'balance' && (
                    <BalanceByAccountType type={item.accountType} />
                  )}
                  {item.type === 'total' && <TotalBalanceCard />}
                  {item.type === 'statistics' && (
                    <StatisticsCard
                      config={item.card}
                      onChange={handleConfigChange}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop view: Right sidebar with inset styling */}
      <aside className="hidden lg:block bg-muted/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] backdrop-blur-xs">
        <ScrollArea className="h-[calc(100vh-2rem)] px-4">
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
                <div className="space-y-4">
                  {renderStatisticsCards(group)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
};

export default DashboardPage;

