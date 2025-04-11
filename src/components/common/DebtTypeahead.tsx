// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import cn from 'classnames';
import { ReactNode } from 'react';

import MoneyValue from '@/components/common/MoneyValue';
import TypeaheadV2, { TypeaheadV2Props } from '@/components/ui/typeaheadV2';
import { useDebts } from '@/contexts/FinanceData';
import Debt from '@/models/Debt';

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
          className={cn('font-medium', 'text-xs', 'text-mono', {
            'text-destructive': el.balance < 0,
            'text-success': el.balance > 0,
            'text-muted-foreground': el.balance === 0,
          })}
          amount={el.balance}
          currency={el.currency}
        />
        {el.archivedAt && <p className="text-xs text-muted-foreground">Archived</p>}
      </div>
    </>
  );

  return (
    <TypeaheadV2<Debt, string>
      valueField="id"
      labelField="debtor"
      groupBy="type"
      placeholder={multiple ? 'Select debts...' : 'Select debt...'}
      multiple={multiple}
      options={debts}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
};

DebtTypeahead.displayName = 'DebtTypeahead';

export default DebtTypeahead;
