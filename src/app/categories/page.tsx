import moment from 'moment';
import cn from 'classnames';
import { Search, ChevronRight, FolderTree } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { useScreenSize } from '@/hooks/useScreenSize';
import RelativeDatetimeDisplay from '@/components/common/RelativeDatetimeDisplay';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import CategoryDetails from '@/components/features/categories/Details';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

// Mock data for categories
const initialCategories: Category[] = [
  {
    id: '1',
    name: 'Income',
    type: 'income',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    children: [
      { id: '1-1', name: 'Salary', type: 'income', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
      { id: '1-2', name: 'Investments', type: 'income', createdAt: '2023-01-03', updatedAt: '2023-01-03' },
    ],
  },
  {
    id: '2',
    name: 'Expenses',
    type: 'expense',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    children: [
      { id: '2-1', name: 'Housing', type: 'expense', createdAt: '2023-01-02', updatedAt: '2023-01-02' },
      { id: '2-2', name: 'Food', type: 'expense', createdAt: '2023-01-03', updatedAt: '2023-01-03' },
    ],
  },
];

export const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const isDesktop = useScreenSize();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const selectedCategoryRef = useRef<HTMLDivElement>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleCategorySelect = useCallback((category: Category) => {
    setSelectedCategory(category);
    setTimeout(() => {
      selectedCategoryRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 0);
  }, []);

  const sortCategories = (categories: Category[]): Category[] => categories.sort((a, b) => {
      if (a.type === 'income' && b.type === 'expense') return -1;
      if (a.type === 'expense' && b.type === 'income') return 1;
      return a.name.localeCompare(b.name);
    });

  const filterCategories = (categories: Category[], searchTerm: string): Category[] => {
    const filtered = categories.reduce((acc: Category[], category) => {
      if (category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        const filteredCategory = { ...category };
        if (category.children) {
          filteredCategory.children = filterCategories(category.children, searchTerm);
        }
        acc.push(filteredCategory);
      } else if (category.children) {
        const filteredChildren = filterCategories(category.children, searchTerm);
        if (filteredChildren.length > 0) {
          acc.push({ ...category, children: filteredChildren });
        }
      }
      return acc;
    }, []);

    return sortCategories(filtered);
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  const onDragEnd = (result: DropResult) => {
    // Implement drag and drop logic here
    console.log(result);
  };

  const CategoryTree: React.FC<{ categories: Category[], level?: number, expandedCategories: Record<string, boolean>, setExpandedCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>> }> = ({ categories, level = 0, expandedCategories, setExpandedCategories }) => {

    const toggleExpand = (categoryId: string) => {
      setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`level-${level}`}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {categories.map((category, index) => (
                <React.Fragment key={category.id}>
                  <Draggable draggableId={category.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn('p-4 border-b cursor-pointer hover:bg-accent hover:text-accent-foreground', {
                          'bg-accent text-accent-foreground': selectedCategory?.id === category.id,
                        })}
                        onClick={() => handleCategorySelect(category)}
                        style={{ paddingLeft: `${level * 16 + 16}px`, ...provided.draggableProps.style }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {category.children && (
                              <ChevronRight
                                className={cn('w-4 h-4 transition-transform', {
                                  'transform rotate-90': expandedCategories[category.id],
                                })}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(category.id);
                                }}
                              />
                            )}
                            <FolderTree className="w-4 h-4" />
                            <span>{category.name}</span>
                          </div>
                          <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                            {category.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last updated: <RelativeDatetimeDisplay date={moment(category.updatedAt)} />
                        </div>
                      </div>
                    )}
                  </Draggable>
                  {category.children && expandedCategories[category.id] && (
                    <CategoryTree
                      categories={sortCategories(category.children)}
                      level={level + 1}
                      expandedCategories={expandedCategories}
                      setExpandedCategories={setExpandedCategories}
                    />
                  )}
                </React.Fragment>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <CategoryTree categories={filteredCategories} expandedCategories={expandedCategories} setExpandedCategories={setExpandedCategories} />
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-screen md:h-[calc(100vh-2rem)] overflow-hidden pb-16 md:pb-0">
      {isDesktop && (
        <div className="w-80 border-r bg-background">
          <CategoryList />
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {!isDesktop ? (
          selectedCategory ? <CategoryDetails category={selectedCategory} setSelectedCategory={setSelectedCategory} allCategories={categories} /> : <CategoryList />
        ) : (
          selectedCategory ? <CategoryDetails category={selectedCategory} setSelectedCategory={setSelectedCategory} allCategories={categories} /> :
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a category to view details
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagementPage;
