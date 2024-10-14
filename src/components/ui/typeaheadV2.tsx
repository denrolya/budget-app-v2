import cn from 'classnames';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Option {
  [key: string]: any;
}

interface TypeaheadV2Props {
  multiple?: boolean;
  options: Option[];
  valueField: string;
  labelField: string;
  groupBy?: string;
  renderElement: (element: any, valueField?: string, labelField?: string) => React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  value: number | number[] | string | string[] | null;
  onChange: (value: number | number[] | string | string[] | null) => void;
  className?: string;
}

export const TypeaheadV2 = forwardRef<HTMLInputElement, TypeaheadV2Props>(({
                                                                             multiple = false,
                                                                             options,
                                                                             valueField,
                                                                             labelField,
                                                                             groupBy,
                                                                             renderElement,
                                                                             placeholder = 'Select options...',
                                                                             emptyMessage = 'No options found.',
                                                                             value,
                                                                             onChange,
                                                                             className,
                                                                           }, ref) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const groupedOptions = useMemo(() => {
    if (!groupBy) {
      return [{ label: '', options: options }];
    }

    const groups = options.reduce((acc, option) => {
      const groupLabel = option[groupBy] || '';
      if (!acc[groupLabel]) {
        acc[groupLabel] = [];
      }
      acc[groupLabel].push(option);
      return acc;
    }, {} as Record<string, Option[]>);

    return Object.entries(groups).map(([label, groupOptions]) => ({
      label,
      options: groupOptions,
    }));
  }, [options, groupBy]);

  const filteredOptions = useMemo(() => {
    return groupedOptions.map(group => ({
      ...group,
      options: group.options.filter(option =>
        option[labelField].toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedValues.includes(option[valueField])
      ),
    })).filter(group => group.options.length > 0);
  }, [groupedOptions, inputValue, labelField, selectedValues, valueField]);

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
    setHighlightedIndex(-1);
  }, [multiple, onChange, selectedValues, valueField]);

  const handleRemove = useCallback((optionValue: string | number) => {
    if (multiple) {
      const newValue = selectedValues.filter(v => v !== optionValue);
      onChange(newValue);
    } else {
      onChange(null);
    }
    setInputValue('');
  }, [multiple, onChange, selectedValues]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const flatFilteredOptions = filteredOptions.flatMap(group => group.options);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < flatFilteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : flatFilteredOptions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex !== -1) {
      e.preventDefault();
      handleSelect(flatFilteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
      const newValue = selectedValues.slice(0, -1);
      onChange(multiple ? newValue : null);
    }
  }, [inputValue, multiple, onChange, selectedValues, filteredOptions, highlightedIndex, handleSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (open && highlightedIndex !== -1) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHighlightedIndex(-1);
    if (!open) {
      setOpen(true);
    }
  };

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      <div
        className="flex items-center flex-wrap gap-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1 pr-4">
          {selectedOptions.map((option) => (
            <Badge key={option[valueField]} variant="secondary" className="text-sm">
              <span className="truncate max-w-[100px]">{option[labelField]}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(option[valueField]);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={selectedOptions.length === 0 ? placeholder : ''}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[50px]"
          />
        </div>
        <Button
          tabIndex={-1}
          type="button"
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent absolute right-3"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
      {open && (
        <div className="absolute z-50 w-full left-0 mt-1 bg-popover border border-input rounded-md shadow-md overflow-hidden">
          <ScrollArea className="max-h-[300px] overflow-y-auto">
            <div className="p-1">
              {filteredOptions.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">{emptyMessage}</div>
              )}
              {filteredOptions.map((group, groupIndex) => (
                <div key={group.label || groupIndex}>
                  {groupBy && group.label && (
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground capitalize">{group.label}</div>
                  )}
                  {group.options.map((option, index) => {
                    const flatIndex = filteredOptions.slice(0, groupIndex).reduce((acc, g) => acc + g.options.length, 0) + index;
                    return (
                      <div
                        key={option[valueField]}
                        ref={el => optionRefs.current[flatIndex] = el}
                        className={cn('flex items-center px-2 py-1.5 text-sm cursor-pointer', {
                          'bg-accent text-accent-foreground': highlightedIndex === flatIndex,
                          'text-popover-foreground hover:bg-accent hover:text-accent-foreground': highlightedIndex !== flatIndex,
                        })}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(flatIndex)}
                      >
                        <Check className={cn('mr-2 h-4 w-4', {
                          'opacity-0': !selectedValues.includes(option[valueField]),
                          'opacity-100': selectedValues.includes(option[valueField]),
                        })} />
                        {renderElement(option, valueField, labelField)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
});

TypeaheadV2.displayName = 'TypeaheadV2';

export default TypeaheadV2;
