import React, { useState } from 'react';
import { Search, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  loading: boolean;
  initialQuery?: string;
}

const SUGGESTED_QUERIES = [
  'When is my DBMS assignment due?',
  'BuildX hackathon schedule',
  'Scholarship eligibility requirements',
  'Exam notice and dates',
];

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  loading,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-white border-2 border-slate-200 focus-within:border-blue-500 rounded-2xl shadow-xs transition-all">
          <div className="pl-4 pr-2 text-slate-400">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your files (e.g., 'When is my DBMS assignment due?')..."
            className="w-full py-3.5 pr-24 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-normal"
          />

          <div className="absolute right-2.5 flex items-center space-x-1.5">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs hover:shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Quick Queries */}
      <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
        <span className="text-[11px] font-medium text-slate-400 flex items-center mr-1">
          <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
          Try asking:
        </span>
        {SUGGESTED_QUERIES.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSelectSuggestion(suggestion)}
            className="px-2.5 py-1 text-[11px] bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/70 hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            "{suggestion}"
          </button>
        ))}
      </div>
    </div>
  );
};
