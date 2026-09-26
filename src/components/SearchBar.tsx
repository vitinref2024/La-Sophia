import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  totalResultsCount?: number;
  scopeLabel?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onClear,
  totalResultsCount,
  scopeLabel,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6 sm:mb-8">
      <div className="relative flex items-center">
        {/* Search icon */}
        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-[#6B6B6B]">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Search input: branco-gelo #FBF9F6, borda #E8E0D5, texto #1C1C1C */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="🔎 Procurar no cardápio (ex: calabresa, mussarela, refrigerante)..."
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-[#FBF9F6] border border-[#E8E0D5] rounded-xl text-[#1C1C1C] placeholder-[#6B6B6B] text-xs sm:text-sm focus:outline-none focus:border-[#E4171E] focus:ring-2 focus:ring-[#E4171E]/20 transition-all shadow-xs"
        />

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={onClear}
            className="absolute right-2.5 sm:right-3 p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#E8E0D5]/50 transition-colors cursor-pointer"
            title="Limpar pesquisa"
            aria-label="Limpar pesquisa"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active filter hint */}
      {searchTerm.trim().length > 0 && (
        <div className="mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-[#6B6B6B] px-1">
          <span className="[overflow-wrap:anywhere]">
            Buscando por: <strong className="text-[#1C1C1C]">"{searchTerm}"</strong>
            {scopeLabel && (
              <span className="text-[#6B6B6B]">
                {' '}em <strong className="text-[#1C1C1C]">{scopeLabel}</strong>
              </span>
            )}
          </span>
          {typeof totalResultsCount === 'number' && (
            <span className="font-medium text-[#1C1C1C] shrink-0">
              {totalResultsCount === 0
                ? 'Nenhum resultado'
                : `${totalResultsCount} item(s) encontrado(s)`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
