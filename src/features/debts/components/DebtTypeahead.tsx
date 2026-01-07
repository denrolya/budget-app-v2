import cn from 'classnames';
import { ReactNode } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import Debt from '@/features/debts/models/Debt';
import { useDebts } from '@/hooks/financeData';

type DebtTypeaheadProps = Omit<
  TypeaheadV2Props<Debt, string>,
  'options' | 'valueField' | 'labelField' | 'groupBy' | 'renderElement'
> & {
  className?: string;
};

const DebtTypeahead: React.FC<DebtTypeaheadProps> = ({ multiple = false, value, onChange, className, ...props }) => {
  const debts = useDebts();

  const renderElement = (el: Debt, _valueField?: keyof Debt, labelField?: keyof Debt): ReactNode => (
    <>
      <div className="flex-1">
        <p className="text-sm font-medium">{String(el[labelField])}</p>
      </div>
      <div className="text-right">
        <MoneyValue
          showSign
          amount={el.balance}
          currency={el.currency}
          className={cn('font-medium', 'text-xs', 'text-mono', {
            'text-destructive': el.balance < 0,
            'text-success': el.balance > 0,
            'text-muted-foreground': el.balance === 0,
          })}
        />
        {el.archivedAt && <p className="text-xs text-muted-foreground">Archived</p>}
      </div>
    </>
  );

  return (
    <TypeaheadV2<Debt, string>
      groupBy="type"
      labelField="debtor"
      multiple={multiple}
      options={debts}
      placeholder={multiple ? 'Select debts...' : 'Select debt...'}
      renderElement={renderElement}
      value={value}
      valueField="id"
      className={className}
      onChange={onChange}
      {...props}
    />
  );
};

DebtTypeahead.displayName = 'DebtTypeahead';

export default DebtTypeahead;
