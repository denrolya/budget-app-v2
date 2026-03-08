import { Archive, ArchiveRestore, Edit, Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom';

import { confirm } from '@/lib/confirmation';
import MoneyValue from '@/components/common/MoneyValue';
import PageWithSidebar from '@/components/layout/PageWithSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormType, useForm } from '@/contexts/Form';
import { CURRENCIES } from '@/constants/currency';
import { useBaseCurrency } from '@/features/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useActiveAccounts } from '@/hooks/financeData';

import { useList as useAccountsQuery, useMutations } from '../api';
import AccountDetails from '../components/Details';
import AccountsSunburstChart, { type HoveredSunburstNode } from '../components/AccountsSunburstChart';
import SidebarListing from '../components/SidebarListing';
import Account from '../models/Account';
import { UpdateAccountDTO } from '../types';

// ─── Type display labels ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  cash: 'Cash',
  internet: 'Online',
  basic: 'Other',
};

// ─── Page shell ───────────────────────────────────────────────────────────────

const ManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const accountMatch = useMatch('/accounts/:accountId');
  const selectedAccountId = accountMatch?.params?.accountId ?? null;
  const showSidebar = !isMobile || !selectedAccountId;

  return (
    // contentScrollable=false so each route controls its own overflow
    <PageWithSidebar contentScrollable={false}>
      {showSidebar && (
        <PageWithSidebar.Sidebar ariaLabel="Accounts sidebar">
          <SidebarListing
            selectedId={selectedAccountId}
            onClear={() => navigate('/accounts')}
            onSelect={(acc: Account) => navigate(`/accounts/${acc.id}`)}
          />
        </PageWithSidebar.Sidebar>
      )}

      <PageWithSidebar.Content className="min-h-0 h-full">
        <Routes>
          <Route index element={<AccountsIndex />} />
          <Route element={<AccountDetailsRoute />} path=":accountId" />
          <Route element={<Navigate replace to="/accounts" />} path="*" />
        </Routes>
      </PageWithSidebar.Content>
    </PageWithSidebar>
  );
};

// ─── Index (no account selected) ─────────────────────────────────────────────

type CurrencyGroup = {
  currency: string;
  symbol: string;
  color: string;
  total: number; // converted to base currency
  percentage: number;
  accounts: Account[];
};

type TypeGroup = {
  type: string;
  total: number;
  percentage: number;
};

const AccountsIndex: React.FC = () => {
  const accounts = useActiveAccounts();
  const baseCurrency = useBaseCurrency();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<HoveredSunburstNode | null>(null);

  // Stable callback — prevents AccountsSunburstChart from re-rendering on hover
  const handleHoverChange = useCallback((node: HoveredSunburstNode | null) => {
    setHovered(node);
  }, []);

  // ── Aggregation ────────────────────────────────────────────────────────────
  const { walletTotal, currencyGroups, typeGroups } = useMemo(() => {
    const grouped = new Map<string, Account[]>();
    const typeMap = new Map<string, number>();

    for (const acc of accounts) {
      // currency buckets
      const bucket = grouped.get(acc.currency) ?? [];
      bucket.push(acc);
      grouped.set(acc.currency, bucket);

      // type buckets (converted value)
      const converted = Math.abs(acc.convertedValues?.[baseCurrency] ?? 0);
      typeMap.set(acc.type, (typeMap.get(acc.type) ?? 0) + converted);
    }

    const total = accounts.reduce((sum, acc) => sum + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);

    const groups: CurrencyGroup[] = [];
    for (const [currency, accs] of grouped) {
      const currencyTotal = accs.reduce((sum, acc) => sum + Math.abs(acc.convertedValues?.[baseCurrency] ?? 0), 0);
      const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES];

      const color =
        typeof window !== 'undefined'
          ? getComputedStyle(document.documentElement).getPropertyValue(`--account-bank-${currency}`).trim() || '#888'
          : '#888';

      // Sort accounts within each currency group by converted value descending
      const sortedAccs = accs
        .slice()
        .sort(
          (a, b) =>
            Math.abs(b.convertedValues?.[baseCurrency] ?? b.balance) -
            Math.abs(a.convertedValues?.[baseCurrency] ?? a.balance),
        );

      groups.push({
        currency,
        symbol: currencyInfo?.symbol ?? currency,
        color,
        total: currencyTotal,
        percentage: total > 0 ? (currencyTotal / total) * 100 : 0,
        accounts: sortedAccs,
      });
    }
    groups.sort((a, b) => b.total - a.total);

    const types: TypeGroup[] = Array.from(typeMap.entries())
      .map(([type, value]) => ({
        type,
        total: value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { walletTotal: total, currencyGroups: groups, typeGroups: types };
  }, [accounts, baseCurrency]);

  // ── Centre overlay: what to show ───────────────────────────────────────────
  const centerInfo = useMemo(() => {
    if (!hovered) {
      return {
        label: 'Total balance',
        value: walletTotal,
        currency: baseCurrency,
        sub: `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`,
        color: null as string | null,
      };
    }

    const node = hovered.data;
    const isAccount = node.rawBalance !== undefined;

    if (isAccount) {
      return {
        label: node.name,
        value: Math.abs(node.rawBalance ?? 0),
        currency: node.currency ?? baseCurrency,
        sub:
          node.convertedValue != null && node.currency !== baseCurrency
            ? `≈ ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: baseCurrency,
                maximumFractionDigits: 0,
              }).format(Math.abs(node.convertedValue))}`
            : `${hovered.percentage.toFixed(1)}% of wallet`,
        color: hovered.color,
      };
    }

    // Currency ring node
    const currencyCode = node.currency ?? String(hovered.id);
    const currencyInfo = CURRENCIES[currencyCode as keyof typeof CURRENCIES];
    return {
      label: currencyInfo ? `${currencyInfo.symbol} ${currencyCode}` : String(hovered.id),
      value: hovered.value,
      currency: baseCurrency,
      sub: `${hovered.percentage.toFixed(1)}% of wallet`,
      color: hovered.color,
    };
  }, [hovered, walletTotal, baseCurrency, accounts.length]);

  const formatCenter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: centerInfo.currency,
    maximumFractionDigits: centerInfo.currency === 'BTC' || centerInfo.currency === 'ETH' ? 6 : 0,
  });

  return (
    <div className="flex h-full flex-col bg-muted overflow-hidden">
      {/* Main card — fills all available space */}
      <div className="flex-1 min-h-0 p-4 animate-in fade-in slide-in-from-bottom-4 duration-[350ms] ease-out">
        <Card className="h-full overflow-hidden flex flex-col">
          {/* ── Stats strip ──────────────────────────────────────────── */}
          <div className="flex-none border-b px-5 py-2.5 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{accounts.length}</span> account
              {accounts.length !== 1 ? 's' : ''}
            </span>
            <div aria-hidden className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{currencyGroups.length}</span> currenc
              {currencyGroups.length !== 1 ? 'ies' : 'y'}
            </span>
            {currencyGroups[0] && (
              <>
                <div aria-hidden className="h-3.5 w-px bg-border" />
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    aria-hidden
                    style={{ backgroundColor: currencyGroups[0].color }}
                    className="inline-block h-1.5 w-1.5 rounded-full flex-none"
                  />
                  {currencyGroups[0].currency} leads at{' '}
                  <span className="font-semibold text-foreground">{currencyGroups[0].percentage.toFixed(0)}%</span>
                </span>
              </>
            )}
          </div>

          {/* ── Chart + right panel ───────────────────────────────────── */}
          <CardContent className="flex-1 min-h-0 p-0 flex overflow-hidden">
            {/* Sunburst + centre overlay */}
            <div className="flex-1 min-h-0 relative">
              <AccountsSunburstChart onHoverChange={handleHoverChange} />

              {/* Centre overlay — CSS transition to avoid remount glitches */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center text-center px-8 py-5 rounded-full bg-background/80 backdrop-blur-sm max-w-[240px] transition-all duration-100">
                  {centerInfo.color && (
                    <span
                      aria-hidden
                      style={{ backgroundColor: centerInfo.color }}
                      className="inline-block h-2.5 w-2.5 rounded-full mb-2 flex-none"
                    />
                  )}
                  <p className="text-xs text-muted-foreground leading-tight mb-1.5 truncate w-full">
                    {centerInfo.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground leading-tight tabular-nums">
                    {formatCenter.format(centerInfo.value)}
                  </p>
                  {centerInfo.sub && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{centerInfo.sub}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div aria-hidden className="flex-none w-px bg-border self-stretch my-3" />

            {/* Right panel: currency legend + type breakdown */}
            <div className="w-64 shrink-0 flex flex-col min-h-0 overflow-hidden">
              {/* Currency groups — scrollable */}
              <ScrollArea className="flex-1">
                <div className="space-y-5 p-4 pb-3">
                  {currencyGroups.map((group, groupIdx) => (
                    <div
                      style={{ animationDelay: `${100 + groupIdx * 70}ms` }}
                      className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out [animation-fill-mode:both]"
                      key={group.currency}
                    >
                      {/* Currency header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden
                            style={{ backgroundColor: group.color }}
                            className="h-2.5 w-2.5 rounded-sm flex-none"
                          />
                          <span className="text-sm font-semibold text-foreground">
                            {group.symbol} {group.currency}
                          </span>
                        </div>
                        <div className="text-right text-xs tabular-nums">
                          <span className="font-semibold text-foreground">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: baseCurrency,
                              maximumFractionDigits: 0,
                            }).format(group.total)}
                          </span>
                          <span className="text-muted-foreground ml-1">{group.percentage.toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Account rows — sorted by value, clickable */}
                      <div className="space-y-0.5 pl-[18px]">
                        {group.accounts.map((acc) => (
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-xs text-muted-foreground gap-2 hover:text-foreground hover:bg-muted rounded px-1.5 py-1 transition-colors cursor-pointer text-left"
                            key={acc.id}
                            onClick={() => navigate(`/accounts/${acc.id}`)}
                          >
                            <span className="truncate">{acc.name}</span>
                            <MoneyValue
                              amount={acc.balance}
                              currency={acc.currency as any}
                              useColors={false}
                              values={{}}
                              className="text-xs tabular-nums shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Type distribution — fixed at bottom */}
              {typeGroups.length > 0 && (
                <div
                  style={{ animationDelay: '300ms' }}
                  className="flex-none border-t p-4 space-y-2.5 animate-in fade-in duration-300 ease-out [animation-fill-mode:both]"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    By account type
                  </p>
                  {typeGroups.map(({ type, percentage }) => (
                    <div className="space-y-1" key={type}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{TYPE_LABELS[type] ?? type}</span>
                        <span className="font-medium text-foreground tabular-nums">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ─── Account details ──────────────────────────────────────────────────────────

const AccountDetailsRoute: React.FC = () => {
  const { openForm } = useForm();
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const { data } = useAccountsQuery();
  const { update, archive, isArchiving } = useMutations();

  const account = useMemo(() => {
    if (!accountId) return null;
    return data?.find((a) => String(a.id) === accountId) ?? null;
  }, [data, accountId]);

  const onAccountUpdate = async (account: Account, diff: UpdateAccountDTO) => {
    await update({ id: account.id, diff });
  };

  const onToggleArchive = async () => {
    if (!account) return;

    const nextArchivedAt = account.isArchived() ? null : new Date().toISOString();
    const isConfirmed = await confirm({
      title: `${account.isArchived() ? 'Unarchive' : 'Archive'} account?`,
      description: `Are you sure you want to ${account.isArchived() ? 'unarchive' : 'archive'} the account "${account.name}"?`,
      confirmText: account.isArchived() ? 'Unarchive' : 'Archive',
      cancelText: 'Cancel',
    });

    if (!isConfirmed) return;

    await archive({ id: account.id, archivedAt: nextArchivedAt });
  };

  if (!accountId) return <Navigate replace to="/accounts" />;
  if (!data) return null;
  if (!account) return <Navigate replace to="/accounts" />;

  return (
    // Details route manages its own scroll
    <div className="h-full flex flex-col min-h-0">
      <PageWithSidebar.Header title="Account Details" onBack={() => navigate('/accounts')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Add Transaction"
              size="icon"
              variant="outline"
              onClick={() => openForm(FormType.Transaction, { account })}
            >
              <span className="sr-only">Add Transaction</span>
              <Plus aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add new account transaction</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={account.isArchived() ? 'Unarchive' : 'Archive'}
              disabled={isArchiving}
              size="icon"
              variant="outline"
              onClick={onToggleArchive}
            >
              <span className="sr-only">{account.isArchived() ? 'Unarchive account' : 'Archive account'}</span>
              {account.isArchived() ? (
                <ArchiveRestore aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Archive aria-hidden="true" className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{account.isArchived() ? 'Unarchive account' : 'Archive account'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button aria-label="Edit" size="icon" variant="outline" onClick={() => openForm(FormType.Account, account)}>
              <span className="sr-only">Edit account details</span>
              <Edit aria-hidden="true" className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit account details</TooltipContent>
        </Tooltip>
      </PageWithSidebar.Header>

      {/* Details content scrolls independently */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          <AccountDetails account={account} onAccountUpdate={onAccountUpdate} />
        </div>
      </div>
    </div>
  );
};

export default ManagementPage;
