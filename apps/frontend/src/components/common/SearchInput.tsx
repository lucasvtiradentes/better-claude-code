import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
};

export const SearchInput = ({
  value: externalValue,
  onChange,
  placeholder = 'Search...',
  debounce
}: SearchInputProps) => {
  const [value, setValue] = useState(externalValue || '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setValue(externalValue || '');
  }, [externalValue]);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      if (debounce) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounce);
      } else {
        onChange(newValue);
      }
    },
    [onChange, debounce]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-86 pl-9 pr-3 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:border-primary"
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => handleChange('')}
          className="p-1.5 hover:bg-accent rounded transition-colors"
          title="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
