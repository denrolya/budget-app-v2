import React, { useEffect, useRef, useState } from 'react';

import StatisticsCardsSidebar from '@/components/features/dashboard/StatisticsCardsSidebar';
import BalanceByAccountType from '@/components/features/statistics/BalanceByAccountType';
import CategoriesDoughnut from '@/components/features/statistics/CategoriesDoughnut/Card';
import AccountsDoughnut from '@/components/features/statistics/AccountsDoughnut/Card';
import CategoriesTimeline from '@/components/features/statistics/CategoriesTimeline/Card';
import MoneyFlow from '@/components/features/statistics/MoneyFlow/Card';
import StatisticsCard from '@/components/features/statistics/StatisticsCard/Card';
import TotalBalanceCard from '@/components/features/statistics/TotalBalanceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
              <TabsTrigger className="capitalize" key={group} value={group}>
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
            <TabsContent key={group} value={group}>
              <div className="flex flex-wrap gap-4">
                {configs[group].map((card) => (
                  <StatisticsCard
                    key={`statistics-card-${group}-${generateSlug([card.title, card.type, card.statType])}`}
                    config={card}
                    onChange={handleConfigChange}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-12">
          {/* Left Doughnut (Accounts) */}
          <AccountsDoughnut className="order-3 xl:order-1 xl:col-span-3 3xl:col-span-2 aspect-square" />

          {/* Center Chart (Money Flow) */}
          <MoneyFlow className="order-2 xl:order-2 xl:col-span-6 3xl:col-span-8 xl:col-start-4 3xl:col-start-3 min-h-[360px] md:min-h-[420px] 2xl:min-h-[480px]" />

          {/* Right Doughnut (Categories) */}
          <CategoriesDoughnut className="order-1 xl:order-3 xl:col-span-3 3xl:col-span-2 aspect-square" />

          {/* Timeline below center */}
          <CategoriesTimeline className="order-4 xl:order-4 xl:col-span-6 3xl:col-span-8 xl:col-start-4 3xl:col-start-3 min-h-[320px]" />
        </div>
      </section>

      <div className="lg:hidden fixed bottom-[47px] md:bottom-0 left-0 w-full h-[180px] bg-gradient-to-b from-background/0 to-background">
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
                  transform: `scale(${1 - blurAmount / 20})`,
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
                  {item.type === 'balance' && <BalanceByAccountType type={item.accountType} />}
                  {item.type === 'total' && <TotalBalanceCard />}
                  {item.type === 'statistics' && <StatisticsCard config={item.card} onChange={handleConfigChange} />}
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
