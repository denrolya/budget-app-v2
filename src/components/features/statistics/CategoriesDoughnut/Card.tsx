import React, { useMemo, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ChevronRightIcon, CreditCard } from 'lucide-react';
import moment from 'moment';

import { MoneyValue } from '@/components/common/MoneyValue';
import ConfigurationMenu from '@/components/features/statistics/CategoriesDoughnut/ConfigurationMenu';
import TransactionsDrawer from '@/components/features/statistics/CategoriesDoughnut/TransactionsDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useCategoryTreeStatistics } from '@/hooks/statistics/useCategoryTreeStatistics';
import { Type as TransactionType } from '@/types/transaction';

interface ProcessedCategory {
  id: number
  name: string
  value: number
  children?: ProcessedCategory[]
}

export const CategoriesDoughnutCard: React.FC<React.ComponentPropsWithoutRef<'div'>> = ({ className }) => {
  const [currentCategory, setCurrentCategory] = useState<ProcessedCategory | null>(null);
  const [categoryStack, setCategoryStack] = useState<ProcessedCategory[]>([]);
  const [type, setType] = useState<TransactionType>(TransactionType.Expense);
  const [timeframe, setTimeframe] = useState({
    after: moment().startOf('month'),
    before: moment().endOf('month'),
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProcessedCategory | null>(null);

  const { data: currentData } = useCategoryTreeStatistics({
    type,
    after: timeframe.after,
    before: timeframe.before,
  });

  // useEffect()

  const processData = (data: any[]): ProcessedCategory[] =>
    data?.map((category) => ({
      id: category.id,
      name: category.name,
      value: category.total,
      children: category.children ? processData(category.children) : undefined,
    })) || [];

  const { rootCategories, totalCurrent } = useMemo(() => {
    const rootCategories = processData(currentData);
    const totalCurrent = rootCategories.reduce((sum, cat) => sum + cat.value, 0);
    return { rootCategories, totalCurrent };
  }, [currentData]);

  const currentCategories = currentCategory ? currentCategory.children || [] : rootCategories;

  const chartData = useMemo(() => {
    if (currentCategory) {
      const directSpending = currentCategory.value - (currentCategory.children?.reduce((sum, child) => sum + child.value, 0) || 0);
      const directSpendingCategory = directSpending > 0 ? [{
        id: currentCategory.id,
        name: `${currentCategory.name} (Direct)`,
        value: directSpending,
      }] : [];
      return [...directSpendingCategory, ...currentCategories];
    }
    return currentCategories;
  }, [currentCategory, currentCategories]);

  const handleCategoryStep = (category: ProcessedCategory) => {
    if (category.children && category.children.length > 0) {
      setCategoryStack((prevStack) => [...prevStack, currentCategory || {
        id: 0,
        name: 'Root',
        value: totalCurrent,
        children: rootCategories,
      }]);
      setCurrentCategory(category);
    }
  };

  const handleCategoryClick = (category: ProcessedCategory) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentCategory(null);
      setCategoryStack([]);
    } else {
      const newStack = categoryStack.slice(0, index);
      setCurrentCategory(newStack[newStack.length - 1]);
      setCategoryStack(newStack.slice(0, -1));
    }
  };

  const breadcrumbs = [
    { id: 0, name: 'All Categories' },
    ...categoryStack.slice(1),
    currentCategory,
  ].filter(Boolean);

  return (
    <>
      <Card className={`w-full transition-all duration-300 ease-in-out hover:shadow-md dark:hover:shadow-primary/25 ${className}`}>
        <CardHeader className="p-4 space-y-0.2 pb-0">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium">
              {type === TransactionType.Expense ? 'Expenses' : 'Income'}
            </CardTitle>
            <ConfigurationMenu
              type={type}
              setType={setType}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
            />
          </div>
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => handleBreadcrumbClick(index)}>
                        {item.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-48 mb-4">
            <ResponsivePie
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.6}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              enableArcLinkLabels={false}
              enableArcLabels={false}
              tooltip={({ datum: { id, data, value } }) => (
                <div className="bg-popover text-popover-foreground p-2 rounded shadow-md text-xs">
                  <strong>{data.name}</strong>
                  <div><MoneyValue className="font-mono" useColors={false} amount={value} /></div>
                  <div>{((value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(1)}%</div>
                </div>
              )}
              onClick={(node) => handleCategoryStep(node.data as ProcessedCategory)}
            />
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {chartData.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="truncate flex-1">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm whitespace-nowrap">
                      <MoneyValue className="font-medium" useColors={false} amount={category.value} />
                      <span className="ml-1 text-xs text-muted-foreground">{((category.value / (currentCategory ? currentCategory.value : totalCurrent)) * 100).toFixed(1)}%</span>
                    </span>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCategoryClick(category)}
                        className="h-6 w-6"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span className="sr-only">View transactions</span>
                      </Button>
                      {category.children && category.children.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCategoryStep(category)}
                          className="h-6 w-6"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                          <span className="sr-only">View subcategories</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">
              <MoneyValue
                className="font-mono"
                useColors={false}
                amount={currentCategory ? currentCategory.value : totalCurrent}
              />
            </span>
          </div>
        </CardFooter>
      </Card>

      <TransactionsDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        selectedCategory={selectedCategory}
        timeframe={timeframe}
      />
    </>
  );
};

export default CategoriesDoughnutCard;

