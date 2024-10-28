// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useMemo } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';

import { Type as TransactionType } from '@/types/transaction';
import Category from '@/models/Category';

interface CategoriesSunburstProps {
  categories: Category[];
  type?: TransactionType;
}

const addValueToNodes = (node: Category): Category & { value: number } => {
  const newNode = { ...node, value: 1 };
  if (newNode.children && newNode.children.length > 0) {
    newNode.children = newNode.children.map(addValueToNodes);
  }
  return newNode;
};

export const CategoriesSunburst: React.FC<CategoriesSunburstProps> = ({ categories }) => {
  const filteredCategories = useMemo(() => categories.map(addValueToNodes), [categories]);

  const data = useMemo(() => ({
    name: 'Categories',
    children: filteredCategories,
  }), [filteredCategories]);

  return (
    <div className="h-[500px]">
      <ResponsiveSunburst
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        id="name"
        cornerRadius={10}
        borderWidth={10}
        borderColor={{ theme: 'background' }}
        colors={{ scheme: 'nivo' }}
        childColor={{
          from: 'color',
          modifiers: [['darker', 0.4]],
        }}
        enableArcLabels={true}
        arcLabelsRadiusOffset={0.55}
        arcLabelsSkipAngle={20}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 1.4]],
        }}
        motionConfig="wobbly"
        data={data}
        arcLabel={d => `${d.id} (${d.value})`}
      />
    </div>
  );
};

export default CategoriesSunburst;
