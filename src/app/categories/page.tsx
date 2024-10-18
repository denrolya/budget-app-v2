import cn from 'classnames';
import { debounce, filter, includes, sortBy, toLower } from 'lodash';
import { ChevronRight, Folder, FolderClosed, FolderOpenDot, Home, Info, Search } from 'lucide-react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import CategoryDetails from '@/components/features/categories/Details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenseCategoriesTree, useIncomeCategoriesTree } from '@/contexts/FinanceData';
import { useScreenSize } from '@/hooks/useScreenSize';
import Category from '@/models/Category';
import { Type as TransactionType } from '@/models/Transaction';

export const CategoryManagementPage: React.FC = () => {
  const expenseCategories = useExpenseCategoriesTree();
  const incomeCategories = useIncomeCategoriesTree();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentPath, setCurrentPath] = useState<Category[]>([]);
  const isDesktop = useScreenSize();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.Expense);
  const [showDetails, setShowDetails] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const expandParents = useCallback((categories: Category[], searchTerm: string, parentPath: string[] = []) => {
    categories.forEach(category => {
      const currentPath = [...parentPath, category.id];
      if (includes(toLower(category.name), toLower(searchTerm))) {
        setExpandedCategories(prev => {
          const newExpanded = { ...prev };
          currentPath.forEach(id => {
            newExpanded[id] = true;
          });
          return newExpanded;
        });
      }
      if (category.children) {
        expandParents(category.children, searchTerm, currentPath);
      }
    });
  }, []);

  const debouncedSearch = debounce((term: string) => {
    setSearchTerm(term);
    expandParents([...incomeCategories, ...expenseCategories], term);
  }, 1000);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = searchTerm;
    }
  }, [searchTerm]);

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
          ),
        )}
      </>
    );
  };

  const CategoryTree: React.FC<{
    categories: Category[],
    expandedCategories: Record<string, boolean>,
    setExpandedCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    depth?: number
  }> = ({ categories, expandedCategories, setExpandedCategories, depth = 0 }) => {

    const handleCategoryClick = (category: Category) => {
      if (isDesktop) {
        setSelectedCategory(category);
      }
      if (category.children && category.children.length > 0) {
        setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }));
      }
    };

    const handleInfoClick = (e: React.MouseEvent, category: Category) => {
      e.stopPropagation();
      setSelectedCategory(category);
      setShowDetails(true);
    };

    const sortedCategories = useMemo(() => sortCategories(categories), [categories]);

    return (
      <>
        {sortedCategories.map((category) => (
          <React.Fragment key={category.id}>
            <div
              className={cn(
                'border-b cursor-pointer hover:bg-accent hover:text-accent-foreground',
                {
                  'bg-accent text-accent-foreground': isDesktop && selectedCategory?.id === category.id,
                },
              )}
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-stretch">
                <div className="flex-grow flex items-center gap-2 py-2 px-4">
                  <div className="flex items-center" style={{ width: `${depth * 20}px` }}>
                    {Array.from({ length: depth }).map((_, index) => (
                      <div key={index} className="w-5 h-5" />
                    ))}
                    {depth > 0 && (
                      <div className="w-5 h-5 border-l-2 border-b-2 border-muted-foreground rounded-bl-lg" />
                    )}
                  </div>
                  {category.children?.length > 0 ? (
                    expandedCategories[category.id] ? (
                      <FolderOpenDot className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <FolderClosed className="w-4 h-4 flex-shrink-0" />
                    )
                  ) : (
                    <Folder className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="text-sm">{highlightSearchTerm(category.name)}</span>
                    <div className="text-xs text-muted-foreground">
                      <RelativeDatetimeDisplay date={moment(category.updatedAt)} />
                    </div>
                  </div>
                </div>
                {!isDesktop && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 h-auto flex items-center justify-center"
                    onClick={(e) => handleInfoClick(e, category)}
                  >
                    <Info className="w-4 h-4" />
                    <span className="sr-only">View details for {category.name}</span>
                  </Button>
                )}
              </div>
            </div>
            {category.children && expandedCategories[category.id] && (
              <CategoryTree
                categories={category.children}
                expandedCategories={expandedCategories}
                setExpandedCategories={setExpandedCategories}
                depth={depth + 1}
              />
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
            onChange={handleSearchChange}
            ref={searchInputRef}
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
          setActiveTab(value as TransactionType);
          setCurrentPath([]);
          setSelectedCategory(null);
        }}
        className="flex flex-col flex-grow overflow-hidden"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
        </TabsList>
        <TabsContent className="flex-grow overflow-hidden m-0 p-0" value={TransactionType.Income}>
          <ScrollArea className="h-full">
            <CategoryTree
              categories={currentPath.length > 0 ? currentPath[currentPath.length - 1].children || [] : filteredIncomeCategories}
              expandedCategories={expandedCategories}
              setExpandedCategories={setExpandedCategories}
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent className="flex-grow overflow-hidden m-0 p-0" value={TransactionType.Expense}>
          <ScrollArea className="h-full">
            <CategoryTree
              categories={currentPath.length > 0 ? currentPath[currentPath.length - 1].children || [] : filteredExpenseCategories}
              expandedCategories={expandedCategories}
              setExpandedCategories={setExpandedCategories}
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  let content;

  if (!isDesktop) {
    if (showDetails && selectedCategory) {
      content = (
        <CategoryDetails
          category={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          allCategories={[...incomeCategories, ...expenseCategories]}
        />
      );
    } else {
      content = <CategoryList />;
    }
  } else {
    content = (
      <div className="flex h-full">
        <div className="w-80 border-r bg-background overflow-hidden flex flex-col">
          <CategoryList />
        </div>
        <div className="flex-1 p-4 overflow-auto">
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
