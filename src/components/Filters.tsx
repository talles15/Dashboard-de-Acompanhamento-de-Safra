import React from 'react';
import { Calendar, User, Sprout, LayoutDashboard } from 'lucide-react';

interface FiltersProps {
  produtores: string[];
  cultivares: string[];
  moegas: string[];
  selectedProdutor: string;
  selectedCultivar: string;
  selectedMoega: string;
  onProdutorChange: (val: string) => void;
  onCultivarChange: (val: string) => void;
  onMoegaChange: (val: string) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  produtores,
  cultivares,
  moegas,
  selectedProdutor,
  selectedCultivar,
  selectedMoega,
  onProdutorChange,
  onCultivarChange,
  onMoegaChange,
  startDate,
  endDate,
  onDateChange
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="text-[12px] px-3 py-1.5 border border-sleek-border rounded bg-white text-sleek-text-secondary flex items-center gap-2 cursor-pointer hover:border-sleek-accent transition-colors">
        <Calendar className="w-3.5 h-3.5" />
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="bg-transparent focus:outline-none cursor-pointer"
        />
        <span>-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="bg-transparent focus:outline-none cursor-pointer"
        />
      </div>

      <div className="text-[12px] px-3 py-1.5 border border-sleek-border rounded bg-white text-sleek-text-secondary flex items-center gap-2 cursor-pointer hover:border-sleek-accent transition-colors">
        <User className="w-3.5 h-3.5" />
        <select 
          value={selectedProdutor}
          onChange={(e) => onProdutorChange(e.target.value)}
          className="bg-transparent focus:outline-none cursor-pointer appearance-none"
        >
          <option value="Todos">Produtor: Todos</option>
          {produtores.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-[10px]">▼</span>
      </div>

      <div className="text-[12px] px-3 py-1.5 border border-sleek-border rounded bg-white text-sleek-text-secondary flex items-center gap-2 cursor-pointer hover:border-sleek-accent transition-colors">
        <Sprout className="w-3.5 h-3.5" />
        <select 
          value={selectedCultivar}
          onChange={(e) => onCultivarChange(e.target.value)}
          className="bg-transparent focus:outline-none cursor-pointer appearance-none"
        >
          <option value="Todas">Cultivar: Todas</option>
          {cultivares.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-[10px]">▼</span>
      </div>

      <div className="text-[12px] px-3 py-1.5 border border-sleek-border rounded bg-white text-sleek-text-secondary flex items-center gap-2 cursor-pointer hover:border-sleek-accent transition-colors">
        <LayoutDashboard className="w-3.5 h-3.5" />
        <select 
          value={selectedMoega}
          onChange={(e) => onMoegaChange(e.target.value)}
          className="bg-transparent focus:outline-none cursor-pointer appearance-none"
        >
          <option value="Todas">Moega: Todas</option>
          {moegas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-[10px]">▼</span>
      </div>
    </div>
  );
};
