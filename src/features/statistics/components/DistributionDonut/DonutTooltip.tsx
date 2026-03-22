import MoneyValue from '@/components/common/MoneyValue';

interface Props {
  label: string;
  value: number;
  percent: number;
  extra?: React.ReactNode;
}

const DonutTooltip: React.FC<Props> = ({ label, value, percent, extra }) => (
  <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm p-2 max-w-[240px]">
    <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground leading-none mb-1.5 truncate">
      {label}
    </p>
    <div className="flex items-baseline gap-2">
      <MoneyValue amount={value} useColors={false} className="font-mono text-sm font-semibold" />
      <span className="text-xs text-muted-foreground">
        {Number.isFinite(percent) ? `${percent.toFixed(0)}%` : '0%'}
      </span>
    </div>
    {extra && <div className="mt-1.5">{extra}</div>}
  </div>
);

export default DonutTooltip;
