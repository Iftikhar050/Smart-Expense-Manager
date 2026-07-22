import { Search, X } from 'lucide-react';

interface FilterBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function FilterBar({ value, onChange, placeholder = 'Search...', className = '' }: FilterBarProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary dark:focus:ring-sky-500 focus:border-primary dark:focus:border-sky-500 sm:text-sm shadow-sm transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
          title="Clear filter"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
