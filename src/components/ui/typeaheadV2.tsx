import React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export const TypeaheadV2: React.FC<TypeaheadV2Props> = ({
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
                                             }) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    } else {
      return value ? [value] : [];
    }
  }, [multiple, value]);

  const selectedOptions = React.useMemo(() => {
    return options.filter(option => selectedValues.includes(option[valueField]));
  }, [options, selectedValues, valueField]);

  const handleSelect = (option: Option) => {
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
  };

  const handleRemove = (optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.filter(v => v !== optionValue);
      onChange(newValue);
    } else {
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && selectedValues.length > 0) {
      const newValue = selectedValues.slice(0, -1);
      onChange(multiple ? newValue : newValue[0] || null);
    }
  };

  const renderSelectedItems = () => {
    if (!multiple && selectedOptions.length === 1) {
      return <span className="text-sm">{selectedOptions[0][labelField]}</span>;
    }

    return selectedOptions.map((option) => (
      <Badge key={option[valueField]} variant="secondary" className="text-sm">
        {option[labelField]}
        {multiple && (
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
        )}
      </Badge>
    ));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedOptions.length > 0 ? renderSelectedItems() : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option[valueField]}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedValues.includes(option[valueField]) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {renderElement(option, valueField, labelField)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default TypeaheadV2;
