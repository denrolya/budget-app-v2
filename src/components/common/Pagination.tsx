import debounce from 'lodash/debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  isLoading: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  isLoading,
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const debouncedPageChange = useMemo(
    () =>
      debounce((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
          onPageChange(newPage);
        }
      }, 300),
    [onPageChange, totalPages],
  );

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputPage = e.target.value;
    setInputPage(newInputPage);
    const newPage = parseInt(newInputPage, 10);
    if (!isNaN(newPage)) {
      debouncedPageChange(newPage);
    }
  };

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 w-full text-sm">
      <Select
        disabled={isLoading}
        value={perPage.toString()}
        onValueChange={(value) => onPerPageChange(parseInt(value, 10))}
      >
        <SelectTrigger aria-label="Items per page" className="h-7 w-[7.5rem] text-xs">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          {[30, 50, 100, 500].map((value) => (
            <SelectItem value={value.toString()} key={value}>
              {value} items
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
        {startItem}–{endItem} of {totalItems} items
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          aria-label="Previous page"
          disabled={currentPage === 1 || isLoading}
          size="icon"
          variant="outline"
          className="h-7 w-7"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <Input
          aria-label="Go to page"
          disabled={isLoading}
          max={totalPages}
          min={1}
          type="number"
          value={inputPage}
          className="h-7 w-12 text-center text-xs"
          onChange={handlePageInput}
        />

        <span className="text-xs text-muted-foreground whitespace-nowrap">of {totalPages}</span>

        <Button
          aria-label="Next page"
          disabled={currentPage === totalPages || isLoading}
          size="icon"
          variant="outline"
          className="h-7 w-7"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

Pagination.displayName = 'Pagination';

export default Pagination;
