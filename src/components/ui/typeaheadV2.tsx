import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { forwardRef, useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type Option = Record<string, any>

interface TypeaheadV2Props {
  multiple?: boolean;
  options: Option[];
  valueField: string;
  labelField: string;
  renderElement: (element: Option, valueField: string, labelField: string) => React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  className?: string;
}

export const TypeaheadV2 = forwardRef<HTMLInputElement, TypeaheadV2Props>(({
                                                                             multiple = false,
                                                                             options,
                                                                             valueField,
                                                                             labelField,
                                                                             renderElement,
                                                                             placeholder = 'Select options...',
                                                                             emptyMessage = 'No options found.',
                                                                             value,
                                                                             onChange,
                                                                             className,
                                                                           }, ref) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedValues = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    } else {
      return value ? [value] : [];
    }
  }, [multiple, value]);

  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option[valueField]));
  }, [options, selectedValues, valueField]);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option[labelField].toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedValues.includes(option[valueField]),
    );
  }, [options, inputValue, labelField, selectedValues, valueField]);

  const handleSelect = useCallback((option: Option) => {
    const optionValue = option[valueField];
    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
    setInputValue('');
  }, [multiple, onChange, selectedValues, valueField]);

  const handleRemove = useCallback((optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.filter(v => v !== optionValue);
      onChange(newValue);
    } else {
      onChange(null);
    }
  }, [multiple, onChange, selectedValues]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
      const newValue = selectedValues.slice(0, -1);
      onChange(multiple ? newValue : newValue[0] || null);
    }
  }, [inputValue, multiple, onChange, selectedValues]);

  const renderSelectedItems = useCallback(() => {
    if (!multiple && selectedOptions.length === 1) {
      return <span className="text-sm truncate">{selectedOptions[0][labelField]}</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 items-center">
        {selectedOptions.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            <span className="truncate max-w-[100px]">{selectedOptions[0][labelField]}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(selectedOptions[0][valueField]);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        {selectedOptions.length > 1 && (
          <Badge variant="secondary" className="text-sm">
            +{selectedOptions.length - 1} more
          </Badge>
        )}
      </div>
    );
  }, [multiple, selectedOptions, labelField, valueField, handleRemove]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          <div className="flex-1 text-left">
            {selectedOptions.length > 0 ? renderSelectedItems() : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
            ref={ref}
          />
          <ScrollArea className="h-[300px]">
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              {selectedOptions.length > 0 && (
                <CommandGroup heading="Selected">
                  {selectedOptions.map((option) => (
                    <CommandItem
                      key={option[valueField]}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-100" />
                      {renderElement(option, valueField, labelField)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {(selectedOptions.length > 0 && filteredOptions.length > 0) && (
                <CommandSeparator />
              )}
              {filteredOptions.length > 0 && (
                <CommandGroup heading="Available">
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option[valueField]}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {renderElement(option, valueField, labelField)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

TypeaheadV2.displayName = 'TypeaheadV2';

export default TypeaheadV2;
