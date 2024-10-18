import React, { useMemo, useState, useCallback } from 'react';
import cn from 'classnames';
import { ChevronRight, ChevronLeft, Home, Search, Folder, FolderClosed, FolderOpenDot } from 'lucide-react';
import moment from 'moment';
import { sortBy, filter, includes, toLower, debounce } from 'lodash';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import CategoryDetails from '@/components/features/categories/Details';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import { useScreenSize } from '@/hooks/useScreenSize';
import Category from '@/models/Category';

export const CategoryManagementPage: React.FC = () => {
  const expenseCategories = useExpenseCategoriesTree();
  const incomeCategories = useIncomeCategoriesTree();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const isDesktop = useScreenSize();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  const sortCategories = (categories: Category[]): Category[] =>
    sortBy(categories, 'name');

  const filterCategories = (categories: Category[], searchTerm: string): Category[] => {
    const filtered = filter(categories, (category) => {
      if (includes(toLower(category.name), toLower(searchTerm))) {
        return true;
      }
      if (category.children) {
        const filteredChildren = filterCategories(category.children, searchTerm);
        if (filteredChildren.length > 0) {
          category.children = filteredChildren;
          return true;
        }
      }
      return false;
    });

    return sortCategories(filtered);
  };

  const expandParents = useCallback((categories: Category[], searchTerm: string) => {
    categories.forEach(category => {
      if (includes(toLower(category.name), toLower(searchTerm))) {
        setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
      }
      if (category.children) {
        expandParents(category.children, searchTerm);
      }
    });
  }, []);

  const debouncedSearch = debounce((term: string) => {
      setSearchTerm(term);
      expandParents([...incomeCategories, ...expenseCategories], term);
    }, 300);

  const filteredIncomeCategories = useMemo(() => filterCategories(incomeCategories, searchTerm), [incomeCategories, searchTerm]);
  const filteredExpenseCategories = useMemo(() => filterCategories(expenseCategories, searchTerm), [expenseCategories, searchTerm]);

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-info">{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const CategoryTree: React.FC<{
    categories: Category[],
    expandedCategories: Record<string, boolean>,
    setExpandedCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  }> = ({ categories, expandedCategories, setExpandedCategories }) => {

    const handleCategoryClick = (category: Category) => {
      setSelectedCategory(category);
      if (category.children && category.children.length > 0) {
        setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }));
      }
    };

    const handleStepInto = (e: React.MouseEvent, category: Category) => {
      e.stopPropagation();
      if (category.children && category.children.length > 0) {
        setCurrentPath(prev => [...prev, category]);
        setSelectedCategory(category);
      }
    };

    const sortedCategories = useMemo(() => sortCategories(categories), [categories]);

    return (
      <>
        {sortedCategories.map((category) => (
          <React.Fragment key={category.id}>
            <div
              className={cn('border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
                'bg-accent text-accent-foreground': selectedCategory?.id === category.id,
              })}
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-stretch">
                <div className="flex-grow flex items-center gap-2 py-2 px-4">
                  {category.children?.length > 0 ? (
                    expandedCategories[category.id] ? (
                      <FolderOpenDot className="w-4 h-4" />
                    ) : (
                      <FolderClosed className="w-4 h-4" />
                    )
                  ) : (
                    <Folder className="w-4 h-4" />
                  )}
                  <div>
                    <span className="text-sm">{highlightSearchTerm(category.name)}</span>
                    <div className="text-xs text-muted-foreground">
                      <RelativeDatetimeDisplay date={moment(category.updatedAt)} />
                    </div>
                  </div>
                </div>
                {category.children && category.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-auto flex items-center justify-center"
                    onClick={(e) => handleStepInto(e, category)}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span className="sr-only">Step into {category.name}</span>
                  </Button>
                )}
              </div>
            </div>
            {category.children && expandedCategories[category.id] && (
              <div className="pl-4">
                <CategoryTree
                  categories={category.children}
                  expandedCategories={expandedCategories}
                  setExpandedCategories={setExpandedCategories}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  const CategoryList: React.FC = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Categories</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories"
            className="pl-8"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="p-2 border-b">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPath([]);
                setSearchTerm('');
                setSelectedCategory(null);
                setExpandedCategories({});
              }}
            >
              <Home className="w-4 h-4 mr-1" />
              Root
            </Button>
            {currentPath.map((category, index) => (
              <React.Fragment key={category.id}>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentPath(prev => prev.slice(0, index + 1));
                    setSelectedCategory(category);
                  }}
                >
                  {category.name}
                </Button>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as 'income' | 'expense');
          setCurrentPath([]);
          setSelectedCategory(null);
        }}
        className="w-full flex flex-col flex-grow"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="flex-grow overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <CategoryTree
                categories={currentPath.length > 0 ? currentPath[currentPath.length - 1].children || [] : filteredIncomeCategories}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
              />
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="expense" className="flex-grow overflow-hidden m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              <CategoryTree
                categories={currentPath.length > 0 ? currentPath[currentPath.length - 1].children || [] : filteredExpenseCategories}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  let content;

  if (!isDesktop) {
    if (selectedCategory) {
      content = (
        <>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              setSelectedCategory(null);
              setCurrentPath(prev => prev.slice(0, -1));
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
          <CategoryDetails
            category={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            allCategories={[...incomeCategories, ...expenseCategories]}
          />
        </>
      );
    } else {
      content = <CategoryList />;
    }
  } else {
    content = (
      <div className="flex h-full">
        <div className="w-80 border-r bg-background">
          <CategoryList />
        </div>
        <div className="flex-1 p-4">
          {selectedCategory ? (
            <CategoryDetails
              category={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              allCategories={[...incomeCategories, ...expenseCategories]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a category to view details
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0">
      {content}
    </div>
  );
};

export default CategoryManagementPage;
