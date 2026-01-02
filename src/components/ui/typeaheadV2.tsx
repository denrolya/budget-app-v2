import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import cn from 'classnames';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface TypeaheadV2Props<T, V extends string | number>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  multiple?: boolean;

  options: T[];

  /** Key names on T (kept as strings for API stability) */
  valueField: keyof T & string;
  labelField: keyof T & string;
  groupBy?: keyof T & string;

  /** Custom option renderer (you own the layout) */
  renderElement: (element: T, valueField: keyof T & string, labelField: keyof T & string) => React.ReactNode;

  emptyMessage?: string;

  value: V | V[] | null | undefined;
  onChange: (value: V | V[] | null) => void;

  filterFn?: (option: T, inputValue: string) => boolean;

  /**
   * When true, we don't render the leading checkmark column at all.
   * Use this when you typically exclude already selected options.
   */
  hideCheckmarkColumn?: boolean;
}

const HIDE_DROPDOWN_TIMEOUT = 150;

type Group<T> = { label: string; options: T[] };

const normalizeSelected = <V extends string | number>(value: V | V[] | null | undefined, multiple: boolean): V[] => {
  if (value == null) return [];
  if (multiple) return Array.isArray(value) ? value : [value];
  return Array.isArray(value) ? (value[0] != null ? [value[0]] : []) : [value];
};

const getKey = <T, >(obj: T, field: keyof T & string): string => String((obj as any)[field]);
const getLabel = <T, >(obj: T, field: keyof T & string): string => String((obj as any)[field]);

function TypeaheadV2Inner<T, V extends string | number>(
  {
    multiple = false,
    options,
    valueField,
    labelField,
    groupBy,
    renderElement,
    placeholder = 'Select options…',
    emptyMessage = 'No options found.',
    value,
    onChange,
    className,
    filterFn,
    hideCheckmarkColumn = true,
    disabled,
    onKeyDown,
    onFocus,
    ...inputProps
  }: TypeaheadV2Props<T, V>,
  ref: React.Ref<HTMLInputElement>,
) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const listboxId = useId();

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const selectedValues = useMemo(() => normalizeSelected(value, multiple), [value, multiple]);

  const selectedOptions = useMemo(() => {
    if (selectedValues.length === 0) return [];
    const selectedSet = new Set(selectedValues.map(String));
    return options.filter((o) => selectedSet.has(getKey(o, valueField)));
  }, [options, selectedValues, valueField]);

  const groupedOptions: Group<T>[] = useMemo(() => {
    if (!groupBy) return [{ label: '', options }];

    const map = new Map<string, T[]>();
    for (const option of options) {
      const label = String((option as any)[groupBy] ?? '');
      const arr = map.get(label);
      if (arr) arr.push(option);
      else map.set(label, [option]);
    }
    return Array.from(map.entries()).map(([label, groupOptions]) => ({ label, options: groupOptions }));
  }, [options, groupBy]);

  const filteredGroups: Group<T>[] = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    const selectedSet = new Set(selectedValues.map(String));

    const matchesDefault = (option: T) => getLabel(option, labelField).toLowerCase().includes(q);

    return groupedOptions
      .map((group) => {
        const groupOptions = group.options.filter((option) => {
          const optionValue = getKey(option, valueField);
          if (selectedSet.has(optionValue)) return false;

          if (!q) return true;
          return filterFn ? filterFn(option, inputValue) : matchesDefault(option);
        });

        return { ...group, options: groupOptions };
      })
      .filter((g) => g.options.length > 0);
  }, [groupedOptions, inputValue, selectedValues, valueField, labelField, filterFn]);

  const flatFilteredOptions = useMemo(() => filteredGroups.flatMap((g) => g.options), [filteredGroups]);

  const closeDropdownSoon = useCallback(() => {
    window.setTimeout(() => setOpen(false), HIDE_DROPDOWN_TIMEOUT);
  }, []);

  const handleSelect = useCallback(
    (option: T) => {
      const optionValue = getKey(option, valueField) as unknown as V;

      if (multiple) {
        const exists = selectedValues.some((v) => String(v) === String(optionValue));
        const next = exists ? selectedValues.filter((v) => String(v) !== String(optionValue)) : [...selectedValues, optionValue];
        onChange(next);
      } else {
        onChange(optionValue);
        setOpen(false);
      }

      setInputValue('');
      setHighlightedIndex(-1);
    },
    [multiple, onChange, selectedValues, valueField],
  );

  const handleRemove = useCallback(
    (optionValue: V) => {
      if (multiple) {
        const next = selectedValues.filter((v) => String(v) !== String(optionValue));
        onChange(next);
      } else {
        onChange(null);
      }
      setInputValue('');
    },
    [multiple, onChange, selectedValues],
  );

  const handleKeyDownInternal = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) => (prev < flatFilteredOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : flatFilteredOptions.length - 1));
      } else if (e.key === 'Enter' && highlightedIndex !== -1) {
        e.preventDefault();
        const option = flatFilteredOptions[highlightedIndex];
        if (option) handleSelect(option);
      } else if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
        const next = selectedValues.slice(0, -1);
        onChange(multiple ? next : next[0] ?? null);
      }

      onKeyDown?.(e);
    },
    [
      flatFilteredOptions,
      highlightedIndex,
      handleSelect,
      inputValue,
      multiple,
      onChange,
      selectedValues,
      onKeyDown,
    ],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHighlightedIndex(-1);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Close if click is outside both the input wrapper AND the dropdown.
      const inputRoot = inputRef.current?.closest('[data-typeahead-root="true"]') as HTMLElement | null;
      if (inputRoot && inputRoot.contains(target)) return;

      if (dropdownRef.current && dropdownRef.current.contains(target)) return;

      setOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    if (open && highlightedIndex !== -1) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  const inputHasSelection = selectedOptions.length > 0;

  return (
    <div className={cn('relative w-full', className)} data-typeahead-root="true">
      <div
        className={cn(
          'flex items-center gap-1 px-3 py-2 rounded-md border border-input bg-background ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onMouseDown={(e) => {
          // Prevent input losing focus when clicking inside the container
          if (!disabled) e.preventDefault();
        }}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <ScrollArea className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            {selectedOptions.map((option) => {
              const k = getKey(option, valueField);
              const label = getLabel(option, labelField);

              return (
                <Badge
                  variant="outline"
                  className="whitespace-nowrap text-xs shadow-md py-0 px-1 bg-background"
                  key={k}
                >
                  <span className="truncate max-w-[100px]">{label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove((k as unknown) as V);
                    }}
                    disabled={disabled}
                    aria-label={`Remove ${label}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </Badge>
              );
            })}

            <input
              {...inputProps}
              ref={inputRef}
              autoComplete="off"
              disabled={disabled}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDownInternal}
              onFocus={(e) => {
                if (!disabled) setOpen(true);
                onFocus?.(e);
              }}
              onBlur={() => {
                if (!disabled) closeDropdownSoon();
              }}
              placeholder={!inputHasSelection ? placeholder : ''}
              className={cn(
                'flex-1 min-w-[50px] bg-transparent outline-none placeholder:text-muted-foreground',
                !multiple && inputHasSelection && 'w-0 p-0',
              )}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined}
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
            if (!disabled) setOpen((v) => !v);
          }}
          disabled={disabled}
          aria-label={open ? 'Close options' : 'Open options'}
        >
          <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden="true" />
        </Button>
      </div>

      {open && !disabled && (
        <div
          className="absolute z-50 w-full left-0 mt-1 bg-popover border border-input rounded-md shadow-md overflow-hidden"
          ref={dropdownRef}
        >
          <ScrollArea className="max-h-[300px] overflow-y-auto" tabIndex={-1}>
            <div className="p-1 min-w-0" role="listbox" id={listboxId} aria-label="Options">
              {filteredGroups.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground" role="status">
                  {emptyMessage}
                </div>
              )}

              {filteredGroups.map((group, groupIndex) => {
                const groupOffset = filteredGroups
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.options.length, 0);

                return (
                  <div key={group.label || groupIndex}>
                    {groupBy && group.label && (
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground capitalize">
                        {group.label}
                      </div>
                    )}

                    {group.options.map((option, index) => {
                      const flatIndex = groupOffset + index;
                      const optionKey = getKey(option, valueField);
                      const isHighlighted = highlightedIndex === flatIndex;

                      return (
                        <div
                          key={optionKey}
                          id={`${listboxId}-opt-${flatIndex}`}
                          ref={(el) => {
                            optionRefs.current[flatIndex] = el;
                          }}
                          role="option"
                          aria-selected={false}
                          className={cn(
                            'flex items-center px-2 py-1.5 text-sm cursor-pointer min-w-0',
                            isHighlighted
                              ? 'bg-accent text-accent-foreground'
                              : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
                          )}
                          onMouseEnter={() => setHighlightedIndex(flatIndex)}
                          onMouseDown={(e) => {
                            // Avoid blur before selection
                            e.preventDefault();
                          }}
                          onClick={() => handleSelect(option)}
                        >
                          {!hideCheckmarkColumn && (
                            <span className="mr-2 flex h-4 w-4 items-center justify-center shrink-0" aria-hidden="true">
                              {/* For this component, option list never contains already selected items.
                                  Keep Check only if you later allow selection toggling without exclusion. */}
                              <Check className="h-4 w-4 opacity-0" />
                            </span>
                          )}

                          {renderElement(option, valueField, labelField)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

TypeaheadV2Inner.displayName = 'TypeaheadV2';

const TypeaheadV2 = forwardRef(TypeaheadV2Inner) as unknown as <T, V extends string | number>(
  props: TypeaheadV2Props<T, V> & { ref?: React.Ref<HTMLInputElement> },
) => React.ReactElement;


export default TypeaheadV2;
export { TypeaheadV2 };
