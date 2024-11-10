import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import debounce from 'lodash/debounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

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

  const debouncedPageChange = useCallback(
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
        value={perPage.toString()}
        onValueChange={(value) => onPerPageChange(parseInt(value, 10))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[100px]" aria-label="Items per page">
          <SelectValue placeholder="Per page" />
        </SelectTrigger>
        <SelectContent>
          {[10, 20, 30, 40, 50].map((value) => (
            <SelectItem key={value} value={value.toString()}>
              {value} items
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">
        {startItem}-{endItem} of {totalItems} items
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Input
          type="number"
          min={1}
          max={totalPages}
          value={inputPage}
          onChange={handlePageInput}
          className="w-14 text-center"
          aria-label="Go to page"
          disabled={isLoading}
        />

        <span className="text-muted-foreground whitespace-nowrap">
          of {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

Pagination.displayName = 'Pagination';

export default Pagination;
