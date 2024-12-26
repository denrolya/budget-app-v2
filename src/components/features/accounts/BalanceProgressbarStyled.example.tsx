'use client';

import { ArrowUpIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Account {
  name: string;
  balance: number;
  color: string;
}

interface AccountBalanceProps {
  percentageChange: number;
  accounts: Account[];
}

export default function AccountBalance({
                                         percentageChange,
                                         accounts = [
                                           { name: 'Checking', balance: 5000, color: '#22c55e' },
                                           { name: 'Savings', balance: 12000, color: '#f97316' },
                                           { name: 'Investment', balance: 4374.20, color: '#6366f1' },
                                         ],
                                       }: AccountBalanceProps) {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Your wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold tracking-tight">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(totalBalance)}
          </span>
          <div className="text-sm text-emerald-500 flex items-center">
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            {percentageChange}% vs last month
          </div>
        </div>
        <div className="relative h-20">
          {accounts.map((account, index) => {
            const startPosition = accounts
              .slice(0, index)
              .reduce((sum, acc) => sum + (acc.balance / totalBalance) * 100, 0);

            const sectionWidth = (account.balance / totalBalance) * 100;
            const numberOfBars = 80;
            const barHeight = 20; // Fixed height for all regular bars
            const firstBarHeight = 40; // Higher first bar

            return (
              <div
                key={account.name}
                className="absolute bottom-0 flex gap-[2px]"
                style={{
                  left: `${startPosition}%`,
                  width: `${sectionWidth}%`,
                }}
              >
                {Array.from({ length: numberOfBars }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: account.color,
                      opacity: i === 0 ? 0.9 : 0.7,
                      height: i === 0 ? `${firstBarHeight}px` : `${barHeight}px`,
                      width: `calc(${100 / numberOfBars}% - 2px)`,
                      boxShadow: `0 0 5px ${account.color}`,
                      transition: 'height 0.3s ease',
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

