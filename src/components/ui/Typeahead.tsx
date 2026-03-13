import { Check, ChevronDown, X } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const HIDE_DROPDOWN_TIMEOUT = 150;

const typeaheadRootClass = 'relative w-full';

const typeaheadControlClass = cn(
  'flex items-center gap-1 rounded-md border border-input bg-background ring-offset-background',
  'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
  'transition-colors aria-[invalid=true]:border-destructive',
  // h-9 (not min-h-9) so callers can override with h-7 etc via className
  'h-9 px-3 py-2 text-sm',
);

// text-sm removed — inherits from control div so callers can override via className
const typeaheadInputClass =
  'flex-1 bg-transparent outline-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground min-w-[50px]';

const typeaheadChipClass = 'whitespace-nowrap shadow-md bg-background text-xs py-0 px-1';

const chevronButtonClass = 'ml-auto p-0 hover:bg-transparent h-4 w-4';

type Group<T> = { label: string; options: T[] };

const normalizeSelected = <V extends string | number>(value: V | V[] | null | undefined, multiple: boolean): V[] => {
  if (value == null) return [];
  if (multiple) return Array.isArray(value) ? value : [value];
  return Array.isArray(value) ? (value[0] != null ? [value[0]] : []) : [value];
};

const readField = <T, K extends keyof T>(obj: T, key: K): T[K] => obj[key];

const asString = (v: unknown): string => String(v);

export interface TypeaheadProps<T, V extends string | number>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  multiple?: boolean;

  options: T[];

  /** Key names on T (kept as strings for API stability) */
  valueField: keyof T & string;
  labelField: keyof T & string;
  groupBy?: keyof T & string;

  /** Custom option renderer (you own the layout) */
  renderElement: (
    element: T,
    valueField: keyof T & string,
    labelField: keyof T & string,
    ctx: { isFiltered: boolean },
  ) => React.ReactNode;

  emptyMessage?: string;

  value: V | V[] | null | undefined;
  onChange: (value: V | V[] | null) => void;

  filterFn?: (option: T, inputValue: string) => boolean;

  /**
   * When true, we don't render the leading checkmark column at all.
   * Use this when you typically exclude already selected options.
   */
  hideCheckmarkColumn?: boolean;

  /** Extra classes applied to the dropdown panel. Use e.g. "min-w-full w-max" to let it grow beyond the trigger width. */
  dropdownClassName?: string;

  /** Custom renderer for the selected value shown in the closed trigger. Falls back to labelField text. */
  renderSelected?: (option: T) => React.ReactNode;
}

const TypeaheadInner = <T, V extends string | number>(
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
    dropdownClassName,
    renderSelected,
    disabled,
    onKeyDown,
    onFocus,
    'aria-invalid': ariaInvalid,
    ...inputProps
  }: TypeaheadProps<T, V>,
  ref: React.Ref<HTMLInputElement>,
) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listboxId = useId();

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const selectedValues = useMemo(() => normalizeSelected(value, multiple), [value, multiple]);

  const getKey = useCallback((obj: T): string => asString(readField(obj, valueField as keyof T)), [valueField]);

  const getLabel = useCallback((obj: T): string => asString(readField(obj, labelField as keyof T)), [labelField]);

  const getRawValue = useCallback(
    (obj: T): V => {
      const raw = readField(obj, valueField as keyof T);
      return raw as unknown as V;
    },
    [valueField],
  );

  const selectedOptions = useMemo(() => {
    if (selectedValues.length === 0) return [];
    const selectedSet = new Set(selectedValues.map(String));
    return options.filter((o) => selectedSet.has(getKey(o)));
  }, [options, selectedValues, getKey]);

  const groupedOptions: Group<T>[] = useMemo(() => {
    if (!groupBy) return [{ label: '', options }];

    const map = new Map<string, T[]>();
    for (const option of options) {
      const groupVal = readField(option, groupBy as keyof T);
      const label = asString(groupVal ?? '');
      const arr = map.get(label);
      if (arr) arr.push(option);
      else map.set(label, [option]);
    }
    return Array.from(map.entries()).map(([label, groupOptions]) => ({ label, options: groupOptions }));
  }, [options, groupBy]);

  const filteredGroups: Group<T>[] = useMemo(() => {
    const query = inputValue.trim().toLowerCase();

    const matchesDefault = (option: T) => getLabel(option).toLowerCase().includes(query);

    return groupedOptions
      .map((group) => {
        const groupOptions = group.options.filter((option) => {
          if (!query) return true;
          return filterFn ? filterFn(option, inputValue) : matchesDefault(option);
        });

        return { ...group, options: groupOptions };
      })
      .filter((g) => g.options.length > 0);
  }, [groupedOptions, inputValue, filterFn, getLabel]);

  const flatFilteredOptions = useMemo(() => filteredGroups.flatMap((g) => g.options), [filteredGroups]);

  const closeDropdownSoon = useCallback(() => {
    window.setTimeout(() => setOpen(false), HIDE_DROPDOWN_TIMEOUT);
  }, []);

  const handleSelect = useCallback(
    (option: T) => {
      const rawValue = getRawValue(option);

      if (multiple) {
        const exists = selectedValues.some((v) => String(v) === String(rawValue));
        const next = exists
          ? selectedValues.filter((v) => String(v) !== String(rawValue))
          : [...selectedValues, rawValue];
        onChange(next);
      } else {
        onChange(rawValue);
        setOpen(false);
      }

      setInputValue('');
      setHighlightedIndex(-1);
    },
    [getRawValue, multiple, onChange, selectedValues],
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
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) => (prev < flatFilteredOptions.length - 1 ? prev + 1 : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : flatFilteredOptions.length - 1));
      } else if (event.key === 'Enter' && highlightedIndex !== -1) {
        event.preventDefault();
        const option = flatFilteredOptions[highlightedIndex];
        if (option) handleSelect(option);
      } else if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      } else if (event.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
        const next = selectedValues.slice(0, -1);
        onChange(multiple ? next : (next[0] ?? null));
      }

      onKeyDown?.(event);
    },
    [flatFilteredOptions, highlightedIndex, handleSelect, inputValue, multiple, onChange, selectedValues, onKeyDown],
  );

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setHighlightedIndex(-1);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open && highlightedIndex !== -1) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightedIndex]);

  useEffect(() => {
    if (!triggerRef.current) return;

    const dialogContent = triggerRef.current.closest('[role="dialog"]') as HTMLElement | null;
    setPortalContainer(dialogContent ?? undefined);
  }, [open]);

  useEffect(() => {
    const el = listScrollRef.current;
    if (!el || !open) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;

      event.preventDefault();
      event.stopPropagation();
      el.scrollTop += event.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [open]);

  const inputHasSelection = selectedOptions.length > 0;
  const selectedSet = useMemo(() => new Set(selectedValues.map(String)), [selectedValues]);
  const showLabelOverlay = !multiple && inputValue === '' && inputHasSelection;

  const firstSelected = selectedOptions[0];
  const selectedDisplay = showLabelOverlay && firstSelected
    ? (renderSelected?.(firstSelected) ?? getLabel(firstSelected))
    : null;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) setOpen(false);
      }}
    >
      <div className={typeaheadRootClass} aria-invalid={ariaInvalid} data-typeahead-root="true">
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={triggerRef}
            className={cn(typeaheadControlClass, disabled && 'opacity-50 cursor-not-allowed', className)}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            onMouseDown={(e) => {
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
                {multiple &&
                  selectedOptions.map((option) => {
                    const key = getKey(option);
                    const label = getLabel(option);
                    const rawValue = getRawValue(option);

                    return (
                      <Badge key={key} variant="outline" className={typeaheadChipClass}>
                        <span className="truncate max-w-[100px]">{label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(rawValue);
                          }}
                          disabled={disabled}
                          aria-label={`Remove ${label}`}
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </Badge>
                    );
                  })}

                <div className="relative flex-1 min-w-0 flex items-center">
                  {showLabelOverlay && (
                    <span className="absolute inset-0 flex items-center pointer-events-none min-w-0 overflow-hidden">
                      {selectedDisplay}
                    </span>
                  )}
                  <input
                    {...inputProps}
                    ref={inputRef}
                    autoComplete="off"
                    disabled={disabled}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDownInternal}
                    onFocus={(e) => {
                      if (!disabled) onFocus?.(e);
                    }}
                    onBlur={() => {
                      if (!disabled) closeDropdownSoon();
                    }}
                    placeholder={!inputHasSelection ? placeholder : ''}
                    className={cn(typeaheadInputClass, 'w-full', showLabelOverlay && 'caret-transparent')}
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined}
                  />
                </div>
              </div>

              <ScrollBar orientation="horizontal" className="h-0.5" />
            </ScrollArea>

            <Button
              tabIndex={-1}
              type="button"
              variant="ghost"
              size="sm"
              className={chevronButtonClass}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) setOpen((v) => !v);
              }}
              disabled={disabled}
              aria-label={open ? 'Close options' : 'Open options'}
            >
              <ChevronDown className={cn('h-3 w-3 opacity-40 transition-transform', { 'rotate-180': open })} aria-hidden="true" />
            </Button>
          </div>
        </PopoverPrimitive.Anchor>

        <PopoverPrimitive.Portal container={portalContainer}>
          <PopoverPrimitive.Content
            data-vaul-no-drag
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={8}
            avoidCollisions
            sticky="always"
            style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
            className={cn(
              'z-50 bg-popover border border-input rounded-md shadow-md overflow-hidden max-w-[calc(100vw-1rem)]',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              dropdownClassName,
            )}
          >
            <div ref={listScrollRef} className="max-h-[300px] overflow-y-auto overscroll-contain" tabIndex={-1}>
              <div className="p-1 min-w-0" role="listbox" id={listboxId} aria-label="Options">
                {filteredGroups.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground" role="status">
                    {emptyMessage}
                  </div>
                )}

                {filteredGroups.map((group, groupIndex) => {
                  const groupOffset = filteredGroups.slice(0, groupIndex).reduce((acc, g) => acc + g.options.length, 0);

                  return (
                    <div key={group.label || groupIndex}>
                      {groupBy && group.label && (
                        <div className="px-2 py-1 text-2xs font-mono uppercase tracking-widest text-muted-foreground">
                          {group.label}
                        </div>
                      )}

                      {group.options.map((option, index) => {
                        const flatIndex = groupOffset + index;
                        const optionKey = getKey(option);
                        const isHighlighted = highlightedIndex === flatIndex;
                        const isSelected = selectedSet.has(optionKey);

                        return (
                          <div
                            key={optionKey}
                            id={`${listboxId}-opt-${flatIndex}`}
                            ref={(el) => {
                              optionRefs.current[flatIndex] = el;
                            }}
                            role="option"
                            aria-selected={isSelected}
                            className={cn(
                              'flex items-center px-2 py-1 cursor-pointer min-w-0 text-xs',
                              isHighlighted
                                ? 'bg-accent text-accent-foreground'
                                : isSelected
                                  ? 'bg-accent/40 text-accent-foreground'
                                  : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                            }}
                            onClick={() => handleSelect(option)}
                          >
                            {!hideCheckmarkColumn && (
                              <span
                                className="mr-2 flex h-4 w-4 items-center justify-center shrink-0"
                                aria-hidden="true"
                              >
                                {isSelected ? <Check className="h-4 w-4" /> : null}
                              </span>
                            )}

                            {renderElement(option, valueField, labelField, { isFiltered: inputValue.trim() !== '' })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
};

TypeaheadInner.displayName = 'Typeahead';

type TypeaheadComponent = <T, V extends string | number>(
  props: TypeaheadProps<T, V> & React.RefAttributes<HTMLInputElement>,
) => React.ReactElement;

const Typeahead = forwardRef(TypeaheadInner) as unknown as TypeaheadComponent;

export default Typeahead;
export { Typeahead };
