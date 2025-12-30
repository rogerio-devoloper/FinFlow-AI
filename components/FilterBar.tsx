import React from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export type FilterPeriod = 'month' | 'quarter' | 'semester' | 'year';

export interface FilterState {
  period: FilterPeriod;
  year: number;
  value: number; // 0-11 for month, 0-3 for quarter, 0-1 for semester
}

interface FilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const QUARTERS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
const SEMESTERS = ['1º Semestre', '2º Semestre'];

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onChange }) => {
  
  const handlePrev = () => {
    let newFilter = { ...filter };
    if (filter.period === 'month') {
      if (filter.value === 0) { newFilter.value = 11; newFilter.year -= 1; }
      else { newFilter.value -= 1; }
    } else if (filter.period === 'quarter') {
      if (filter.value === 0) { newFilter.value = 3; newFilter.year -= 1; }
      else { newFilter.value -= 1; }
    } else if (filter.period === 'semester') {
      if (filter.value === 0) { newFilter.value = 1; newFilter.year -= 1; }
      else { newFilter.value -= 1; }
    } else {
      newFilter.year -= 1;
    }
    onChange(newFilter);
  };

  const handleNext = () => {
    let newFilter = { ...filter };
    if (filter.period === 'month') {
      if (filter.value === 11) { newFilter.value = 0; newFilter.year += 1; }
      else { newFilter.value += 1; }
    } else if (filter.period === 'quarter') {
      if (filter.value === 3) { newFilter.value = 0; newFilter.year += 1; }
      else { newFilter.value += 1; }
    } else if (filter.period === 'semester') {
      if (filter.value === 1) { newFilter.value = 0; newFilter.year += 1; }
      else { newFilter.value += 1; }
    } else {
      newFilter.year += 1;
    }
    onChange(newFilter);
  };

  const handleTypeChange = (period: FilterPeriod) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let newValue = 0;
    if (period === 'month') {
        newValue = currentMonth;
    } else if (period === 'quarter') {
        newValue = Math.floor(currentMonth / 3);
    } else if (period === 'semester') {
        newValue = currentMonth < 6 ? 0 : 1;
    }
    // For 'year', value doesn't matter, but we update year to current
    
    onChange({
        period,
        year: currentYear,
        value: newValue
    });
  };

  const getLabel = () => {
    if (filter.period === 'month') return `${MONTHS[filter.value]} de ${filter.year}`;
    if (filter.period === 'quarter') return `${QUARTERS[filter.value]} de ${filter.year}`;
    if (filter.period === 'semester') return `${SEMESTERS[filter.value]} de ${filter.year}`;
    return `Ano de ${filter.year}`;
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
          <Filter size={20} />
        </div>
        <span className="font-semibold text-dark-text">Filtrar Período</span>
      </div>

      <div className="flex items-center gap-2 bg-dark-hover p-1 rounded-lg border border-dark-border">
        {(['month', 'quarter', 'semester', 'year'] as FilterPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => handleTypeChange(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter.period === p
                ? 'bg-brand-600 text-white shadow'
                : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            {p === 'month' && 'Mês'}
            {p === 'quarter' && 'Trimestre'}
            {p === 'semester' && 'Semestre'}
            {p === 'year' && 'Ano'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handlePrev} className="p-1 hover:bg-dark-bg rounded-full text-dark-muted hover:text-dark-text transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 min-w-[180px] justify-center font-medium text-dark-text">
            <Calendar size={16} className="text-brand-500" />
            {getLabel()}
        </div>
        <button onClick={handleNext} className="p-1 hover:bg-dark-bg rounded-full text-dark-muted hover:text-dark-text transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};