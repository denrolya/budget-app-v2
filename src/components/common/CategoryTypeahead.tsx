import React from 'react';

import TypeaheadV2 from '@/components/ui/typeaheadV2';
import { useCategories } from '@/contexts/FinanceData';

interface CategoryTypeaheadProps {
  multiple?: boolean;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  className?: string;
}

export const CategoryTypeahead: React.FC<CategoryTypeaheadProps> = ({
  multiple = false,
  value,
  onChange,
  className,
}) => {
  const categories = useCategories();

  const renderElement = (el, vf, lf) => (
    <span>
      {el[lf]} {el.parent && <div className="text-xs text-secondary">({el.parent.name})</div>}
    </span>
  );

  return (
    <TypeaheadV2
      valueField="id"
      labelField="name"
      multiple={multiple}
      options={categories}
      renderElement={renderElement}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
};

export default CategoryTypeahead;
