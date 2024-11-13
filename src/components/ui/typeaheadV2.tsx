// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import cn from 'classnames';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

export interface TypeaheadV2Props<T, V extends string | number> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  multiple?: boolean;
  options: T[];
  valueField: string;
  labelField: string;
  groupBy?: string;
  renderElement: (element: T, valueField?: keyof T, labelField?: keyof T) => React.ReactNode;
  emptyMessage?: string;
  value: V | V[] | null | undefined;
  onChange: (value: V | V[] | null) => void;
}

export const TypeaheadV2 = <T, V extends string | number>({
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
                                                            ...inputProps
                                                          }: TypeaheadV2Props<T, V>,
                                                          ref: React.Ref<HTMLInputElement>,
) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // @ts-ignore
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
  }));

  // @ts-ignore
  const selectedValues = useMemo<V[]>(() => {
    if (multiple) {
      return Array.isArray(value) ? value : (value != null ? [value] : []);
    } else {
      return value != null ? [value] : [];
    }
  }, [multiple, value]);

  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option[valueField] as V));
  }, [options, selectedValues, valueField]);

  const groupedOptions = useMemo(() => {
    if (!groupBy) {
      return [{ label: '', options: options }];
    }

    const groups = options.reduce((acc, option) => {
      const groupLabel = option[groupBy] || '';
      if (!acc[groupLabel as string]) {
        acc[groupLabel as string] = [];
      }
      acc[groupLabel as string].push(option);
      return acc;
    }, {} as Record<string, T[]>);

    return Object.entries(groups).map(([label, groupOptions]) => ({
      label,
      options: groupOptions,
    }));
  }, [options, groupBy]);

  const filteredOptions = useMemo(() => {
    return groupedOptions.map(group => ({
      ...group,
      options: group.options.filter(option =>
        String(option[labelField]).toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedValues.includes(option[valueField] as V),
      ),
    })).filter(group => group.options.length > 0);
  }, [groupedOptions, inputValue, labelField, selectedValues, valueField]);

  const handleSelect = useCallback((option: T) => {
    const optionValue = option[valueField] as V;
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

  const handleRemove = useCallback((optionValue: V) => {
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
      onChange(multiple ? newValue : (newValue[0] || null));
    }

    inputProps.onKeyDown?.(e);
  }, [inputValue, multiple, onChange, selectedValues, filteredOptions, highlightedIndex, handleSelect, inputProps]);

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
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          inputProps.disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => {
          if (!inputProps.disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <ScrollArea>
          <div className="flex-1 flex items-center gap-1 min-w-0">
            {selectedOptions.map((option) => (
              <Badge
                variant="outline"
                className="whitespace-nowrap text-xs shadow-md py-0 px-1 bg-background"
                key={option[valueField] as React.Key}>
                <span className="truncate max-w-[100px]">{String(option[labelField])}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option[valueField] as V);
                  }}
                  disabled={inputProps.disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            <input
              {...inputProps}
              autoComplete="off"
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                setOpen(true);
                inputProps.onFocus?.(e);
              }}
              placeholder={selectedOptions.length === 0 ? placeholder : ''}
              className={cn('flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[50px]', { 'w-0 p-0': !multiple && selectedOptions.length > 0 })}
            />
          </div>
          <ScrollBar orientation="horizontal" className="h-0.5" />
        </ScrollArea>
        <Button
          tabIndex={-1}
          type="button"
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent ml-auto"
          onClick={(e) => {
            e.stopPropagation();
            if (!inputProps.disabled) {
              setOpen(!open);
            }
          }}
          disabled={inputProps.disabled}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </div>
      {open && !inputProps.disabled && (
        <div
          className="absolute z-50 w-full left-0 mt-1 bg-popover border border-input rounded-md shadow-md overflow-hidden"
          ref={dropdownRef}>
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
                        key={option[valueField] as React.Key}
                        ref={el => optionRefs.current[flatIndex] = el}
                        className={cn('flex items-center px-2 py-1.5 text-sm cursor-pointer', {
                          'bg-accent text-accent-foreground': highlightedIndex === flatIndex,
                          'text-popover-foreground hover:bg-accent hover:text-accent-foreground': highlightedIndex !== flatIndex,
                        })}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(flatIndex)}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', {
                            'opacity-0': !selectedValues.includes(option[valueField] as V),
                            'opacity-100': selectedValues.includes(option[valueField] as V),
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
};

TypeaheadV2.displayName = 'TypeaheadV2';

export default forwardRef(<T, V extends string | number>(props: TypeaheadV2Props<T, V>, ref: React.Ref<HTMLInputElement>) => TypeaheadV2<T, V>(props, ref));
