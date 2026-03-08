import React, { useEffect, useRef, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cardConfigs } from '@/constants/dashboard-config';
import { Type as AccountType } from '@/features/accounts';
import StatisticsCardsSidebar from '@/features/dashboard/components/StatisticsCardsSidebar';
import {
  BalanceByAccountType,
  CategoriesTimelineCard as CategoriesTimeline,
  DistributionDonutCard as DistributionDonut,
  MoneyFlowCard as MoneyFlow,
  StatisticsCard,
  TotalBalanceCard,
} from '@/features/statistics';
import { generateSlug } from '@/lib/url/generateSlug';
import { StatisticsConfig } from '@/types/statistics';

const DashboardPage: React.FC = () => {
  const [configs] = useState(cardConfigs as Record<string, (typeof cardConfigs)[keyof typeof cardConfigs]>);
  const groups = Object.keys(configs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleConfigChange = (newConfig: Partial<StatisticsConfig>) => {
    console.log(newConfig);
  };

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
    ...groups.flatMap((group) => configs[group].map((card) => ({ type: 'statistics', group, card }))),
  ];

  return (
    <>
      <section className="h-full w-full overflow-auto pb-[187px] lg:p-4">
        <h2 className="tracking-tight text-2xl font-bold mb-4 hidden md:block">Dashboard</h2>

        <Tabs defaultValue="overview" className="hidden lg:block mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {groups.map((group) => (
              <TabsTrigger value={group} className="capitalize" key={group}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview">
            <div className="flex flex-wrap gap-4">
              <TotalBalanceCard />
              <StatisticsCard config={configs.global[0]} onChange={handleConfigChange} />
              <StatisticsCard config={configs.annual[0]} onChange={handleConfigChange} />
              <StatisticsCard config={configs.annual[1]} onChange={handleConfigChange} />
              <StatisticsCard config={configs.categorySpecific[3]} onChange={handleConfigChange} />
            </div>
          </TabsContent>
          {groups.map((group) => (
            <TabsContent value={group} key={group}>
              <div className="flex flex-wrap gap-4">
                {configs[group].map((card) => (
                  <StatisticsCard
                    config={card}
                    key={`statistics-card-${group}-${generateSlug([card.title, card.type, card.statType])}`}
                    onChange={handleConfigChange}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-12 xl:items-stretch">
          <MoneyFlow className="xl:col-span-8 3xl:col-span-10 xl:col-start-5 xl:row-start-1 h-full min-h-[360px] md:min-h-[420px] 2xl:min-h-[480px]" />
          <CategoriesTimeline className="xl:col-span-8 3xl:col-span-10 xl:col-start-5 xl:row-start-2 h-full min-h-[320px]" />
          <DistributionDonut className="xl:col-span-4 3xl:col-span-2 xl:row-span-2 h-full min-h-[720px]" />
        </div>
      </section>

      <div className="lg:hidden fixed bottom-[47px] md:bottom-0 left-0 w-full h-[180px] bg-gradient-to-b from-background/0 to-background">
        <div
          aria-label="Scrollable card container"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="flex overflow-x-auto snap-x snap-mandatory h-full py-4 px-6"
          ref={scrollRef}
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
                style={{
                  transform: `scale(${1 - blurAmount / 20})`,
                  transition: 'transform 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out',
                }}
                className="snap-center shrink-0"
                key={index}
              >
                <div
                  style={{
                    filter: `blur(${blurAmount}px)`,
                    opacity: opacityAmount,
                    transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
                  }}
                >
                  {item.type === 'balance' && 'accountType' in item && item.accountType != null && (
                    <BalanceByAccountType type={item.accountType} />
                  )}
                  {item.type === 'total' && <TotalBalanceCard />}
                  {item.type === 'statistics' && 'card' in item && (
                    <StatisticsCard config={item.card} onChange={handleConfigChange} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <StatisticsCardsSidebar configs={configs} groups={groups} />
    </>
  );
};

export default DashboardPage;
