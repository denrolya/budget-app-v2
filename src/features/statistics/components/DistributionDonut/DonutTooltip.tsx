import MoneyValue from '@/components/common/MoneyValue';

interface Props {
  label: string;
  value: number;
  percent: number;
  extra?: React.ReactNode;
}

const DonutTooltip: React.FC<Props> = ({ label, value, percent, extra }) => (
  <div className="bg-popover text-popover-foreground p-2 rounded shadow-md max-w-[280px]">
    <div className="font-semibold leading-5 truncate">{label}</div>
    <div className="mt-1 flex items-baseline gap-2">
      <MoneyValue amount={value} useColors={false} />
      <span className="text-xs text-muted-foreground">
        {Number.isFinite(percent) ? `${percent.toFixed(0)}%` : '0%'}
      </span>
    </div>
    {extra ? <div className="mt-1">{extra}</div> : null}
  </div>
);

export default DonutTooltip;
