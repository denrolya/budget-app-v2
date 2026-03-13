import { ArrowLeftRight, Command } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import MoneyValue from '@/components/common/MoneyValue';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCurrencyConverter } from '@/contexts/CurrencyConverter';
import { useHotkeys } from '@/contexts/Hotkeys';
import { useBaseCurrency } from '@/features/auth';
import { useTotalBalance } from '@/hooks/financeData';
import { cn } from '@/lib/utils';

import AccountsTicker from './AccountsTicker';
import CurrencySelector from './CurrencySelector';
import LogoutButton from './LogoutButton';
import StatusClock from './StatusClock';
import ThemeToggle from './ThemeToggle';

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

const Statusline: React.FC<Props> = ({ className }) => {
  const navigate = useNavigate();
  const baseCurrency = useBaseCurrency();
  const total = useTotalBalance();
  const { open: openCurrencyConverter } = useCurrencyConverter();
  const { openHotkeysDialog } = useHotkeys();

  return (
    <footer
      className={cn(
        'h-10 shrink-0 flex items-center border-t gap-0 overflow-hidden',
        'animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out',
        className,
      )}
    >
      {/* ── A: Total balance ─── */}
      <button
        type="button"
        onClick={() => navigate('/accounts')}
        className="flex-none px-3 flex items-center gap-2 h-full hover:bg-muted/50 transition-colors duration-100 cursor-pointer border-r border-border/60"
        title="All accounts"
      >
        <span className="font-mono text-2xs uppercase tracking-widest text-muted-foreground select-none">TOT</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground select-none">
          <MoneyValue
            amount={total}
            currency={baseCurrency as any}
            showSign={false}
            showValuesTooltip={false}
            useColors={false}
          />
        </span>
      </button>

      {/* ── B: Accounts ticker ─── */}
      <div className="flex-1 min-w-0 h-full flex items-center px-2 border-r border-border/60 overflow-hidden">
        <AccountsTicker />
      </div>

      {/* ── C: Right cluster ─── */}
      <div className="flex-none flex items-center h-full">

        {/* Commands */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Command palette"
              onClick={openHotkeysDialog}
              className="h-full px-2.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l border-r border-border/60"
            >
              <Command className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono text-xs">
            ⇧⇧ Commands
          </TooltipContent>
        </Tooltip>

        {/* Currency converter */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Currency converter"
              onClick={openCurrencyConverter}
              className="h-full px-2.5 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-r border-border/60"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono text-xs">
            ⇧C Currency converter
          </TooltipContent>
        </Tooltip>

        {/* Base currency */}
        <div className="h-full px-0.5 flex items-center border-r border-border/60">
          <CurrencySelector />
        </div>

        {/* Theme */}
        <ThemeToggle />

        {/* Logout */}
        <div className="h-full flex items-center border-l border-border/60">
          <LogoutButton />
        </div>

        {/* Clock — always rightmost */}
        <div className="h-full px-3 flex items-center border-l border-border/60">
          <StatusClock />
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Statusline);
