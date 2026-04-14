import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Scale, 
  LayoutDashboard, 
  Download,
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { format, parseISO, isWithinInterval, isValid } from 'date-fns';
import { generateMockData } from './mockData';
import { Scorecard } from './components/Scorecard';
import { TimeSeriesChart, QualityDonutChart } from './components/Charts';
import { Filters } from './components/Filters';
import { FileUpload } from './components/FileUpload';
import { formatNumber, formatCurrency, cn } from './lib/utils';
import { CargoData } from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const MOCK_DATA = generateMockData();

export default function App() {
  const [firebaseData, setFirebaseData] = useState<CargoData[]>([]);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [localData, setLocalData] = useState<CargoData[] | null>(null);

  // Listen to Firebase data
  useEffect(() => {
    const q = query(collection(db, 'cargas'), orderBy('Data', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as CargoData);
      setFirebaseData(data);
      setIsFirebaseLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cargas');
    });
    return () => unsubscribe();
  }, []);

  const activeData = useMemo(() => {
    if (localData) return localData;
    if (firebaseData.length > 0) return firebaseData;
    return MOCK_DATA;
  }, [localData, firebaseData]);

  const isRealData = localData !== null || firebaseData.length > 0;

  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedProdutor, setSelectedProdutor] = useState('Todos');
  const [selectedCultivar, setSelectedCultivar] = useState('Todas');
  const [selectedMoega, setSelectedMoega] = useState('Todas');

  // Update dates when data changes
  useEffect(() => {
    if (activeData.length > 0) {
      const sorted = [...activeData].sort((a, b) => a.Data.localeCompare(b.Data));
      setStartDate(sorted[0].Data);
      setEndDate(sorted[sorted.length - 1].Data);
    }
  }, [activeData]);

  // Unique lists for filters (Cascading)
  const produtores = useMemo(() => Array.from(new Set(activeData.map(d => d.Produtor))).sort(), [activeData]);

  const moegas = useMemo(() => {
    const dataForMoega = selectedProdutor === 'Todos' 
      ? activeData 
      : activeData.filter(d => d.Produtor === selectedProdutor);
    return Array.from(new Set(dataForMoega.map(d => d.Moega || 'N/A'))).sort();
  }, [activeData, selectedProdutor]);

  const cultivares = useMemo(() => {
    const dataForCultivar = activeData.filter(d => {
      const isProdutorMatch = selectedProdutor === 'Todos' || d.Produtor === selectedProdutor;
      const isMoegaMatch = selectedMoega === 'Todas' || (d.Moega || 'N/A') === selectedMoega;
      return isProdutorMatch && isMoegaMatch;
    });
    return Array.from(new Set(dataForCultivar.map(d => d.Cultivar))).sort();
  }, [activeData, selectedProdutor, selectedMoega]);

  // Reset dependent filters if they become invalid
  useEffect(() => {
    if (selectedMoega !== 'Todas' && !moegas.includes(selectedMoega)) {
      setSelectedMoega('Todas');
    }
  }, [moegas, selectedMoega]);

  useEffect(() => {
    if (selectedCultivar !== 'Todas' && !cultivares.includes(selectedCultivar)) {
      setSelectedCultivar('Todas');
    }
  }, [cultivares, selectedCultivar]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return activeData.filter(d => {
      const date = parseISO(d.Data);
      if (!isValid(date)) return false;
      
      const isDateMatch = isWithinInterval(date, { 
        start: parseISO(startDate), 
        end: parseISO(endDate) 
      });
      const isProdutorMatch = selectedProdutor === 'Todos' || d.Produtor === selectedProdutor;
      const isCultivarMatch = selectedCultivar === 'Todas' || d.Cultivar === selectedCultivar;
      const isMoegaMatch = selectedMoega === 'Todas' || (d.Moega || 'N/A') === selectedMoega;
      return isDateMatch && isProdutorMatch && isCultivarMatch && isMoegaMatch;
    });
  }, [activeData, startDate, endDate, selectedProdutor, selectedCultivar, selectedMoega]);

  // Stats
  const stats = useMemo(() => {
    const totalCargas = filteredData.length;
    const uniqueDates = new Set(filteredData.map(d => d.Data)).size;
    const mediaCargasPorDia = uniqueDates > 0 ? totalCargas / uniqueDates : 0;
    const volumeTotalLiquido = filteredData.reduce((acc, curr) => acc + curr['Liquido Sem Desc'], 0);
    const umidadeMediaTotal = totalCargas > 0 
      ? filteredData.reduce((acc, curr) => acc + curr['Umidade (%)'], 0) / totalCargas 
      : 0;

    return {
      totalCargas,
      mediaCargasPorDia,
      volumeTotalLiquido,
      umidadeMediaTotal
    };
  }, [filteredData]);

  // Daily Evolution
  const dailyEvolution = useMemo(() => {
    const grouped = filteredData.reduce((acc: any, curr) => {
      if (!acc[curr.Data]) {
        acc[curr.Data] = { count: 0, umidadeTotal: 0 };
      }
      acc[curr.Data].count += 1;
      acc[curr.Data].umidadeTotal += curr['Umidade (%)'];
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]: any) => ({ 
        date: format(parseISO(date), 'dd/MM'), 
        fullDate: date,
        count: data.count,
        umidadeMedia: data.umidadeTotal / data.count
      }));
  }, [filteredData]);

  // Top 5 Days by Volume
  const top5Days = useMemo(() => {
    const grouped = filteredData.reduce((acc: any, curr) => {
      acc[curr.Data] = (acc[curr.Data] || 0) + curr['Liquido Sem Desc'];
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, volume]) => ({ date, volume: volume as number }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [filteredData]);

  // Quality Analysis
  const qualityData = useMemo(() => {
    const grouped = filteredData.reduce((acc: any, curr) => {
      const condition = curr['Umidade (%)'] > 14 ? 'Carga Úmida' : 'Carga Seca';
      acc[condition] = (acc[condition] || 0) + curr['Liquido Sem Desc'];
      return acc;
    }, {});

    return [
      { name: 'Carga Seca', value: grouped['Carga Seca'] || 0 },
      { name: 'Carga Úmida', value: grouped['Carga Úmida'] || 0 }
    ];
  }, [filteredData]);

  // Producer Performance
  const producerPerformance = useMemo(() => {
    const grouped = filteredData.reduce((acc: any, curr) => {
      if (!acc[curr.Produtor]) {
        acc[curr.Produtor] = { cargas: 0, umidadeTotal: 0, volumeTotal: 0 };
      }
      acc[curr.Produtor].cargas += 1;
      acc[curr.Produtor].umidadeTotal += curr['Umidade (%)'];
      acc[curr.Produtor].volumeTotal += curr['Liquido Sem Desc'];
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, data]: any) => ({
        name,
        cargas: data.cargas,
        mediaUmidade: data.umidadeTotal / data.cargas,
        volumeTotal: data.volumeTotal
      }))
      .sort((a, b) => b.volumeTotal - a.volumeTotal)
      .slice(0, 10);
  }, [filteredData]);

  // Cultivar Performance
  const cultivarPerformance = useMemo(() => {
    const grouped = filteredData.reduce((acc: any, curr) => {
      if (!acc[curr.Cultivar]) {
        acc[curr.Cultivar] = { cargas: 0, umidadeTotal: 0, volumeTotal: 0 };
      }
      acc[curr.Cultivar].cargas += 1;
      acc[curr.Cultivar].umidadeTotal += curr['Umidade (%)'];
      acc[curr.Cultivar].volumeTotal += curr['Liquido Sem Desc'];
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, data]: any) => ({
        name,
        cargas: data.cargas,
        mediaUmidade: data.umidadeTotal / data.cargas,
        volumeTotal: data.volumeTotal
      }))
      .sort((a, b) => b.volumeTotal - a.volumeTotal);
  }, [filteredData]);

  const handleDataLoaded = (data: CargoData[]) => {
    // If not logged in, we just show locally
    setLocalData(data);
  };

  return (
    <div className="min-h-screen bg-sleek-bg text-sleek-text-main font-sans">
      {/* Header */}
      <header className="bg-sleek-header border-b border-sleek-border sticky top-0 z-10 h-16 flex items-center">
        <div className="max-w-[1200px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="logo-area flex items-center gap-3">
            <h1 className="text-[18px] font-semibold text-sleek-text-main">Dashboard de Safra</h1>
            {isRealData ? (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Database className="w-3 h-3" /> DADOS REAIS
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> MODO DEMO
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <FileUpload 
              onDataLoaded={handleDataLoaded} 
              onReset={() => {
                setLocalData(null);
                // Note: We don't delete from Firebase here, just clear local view
              }}
              hasData={activeData.length > 0}
              isRealData={isRealData}
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 space-y-4">
        {/* Print Only Header */}
        <div className="hidden print:block border-b-2 border-sleek-accent pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-sleek-text-main">Relatório de Acompanhamento de Safra</h1>
              <p className="text-sm text-sleek-text-secondary mt-1">Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-sleek-accent text-white">
                DADOS OFICIAIS
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 bg-slate-50 p-4 rounded-lg border border-sleek-border">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sleek-text-secondary font-bold">Período</p>
              <p className="text-sm font-semibold">{format(parseISO(startDate), 'dd/MM/yyyy')} - {format(parseISO(endDate), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sleek-text-secondary font-bold">Produtor</p>
              <p className="text-sm font-semibold">{selectedProdutor}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sleek-text-secondary font-bold">Cultivar</p>
              <p className="text-sm font-semibold">{selectedCultivar}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sleek-text-secondary font-bold">Moega</p>
              <p className="text-sm font-semibold">{selectedMoega}</p>
            </div>
          </div>
        </div>

        {/* Filters Rail */}
        <div className="bg-white p-3 rounded-lg border border-sleek-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Filters 
            produtores={produtores}
            cultivares={cultivares}
            moegas={moegas}
            selectedProdutor={selectedProdutor}
            selectedCultivar={selectedCultivar}
            selectedMoega={selectedMoega}
            onProdutorChange={setSelectedProdutor}
            onCultivarChange={setSelectedCultivar}
            onMoegaChange={setSelectedMoega}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => {
                try {
                  window.print();
                } catch (e) {
                  alert("Para exportar o PDF, por favor abra o aplicativo em uma nova aba usando o botão no canto superior direito.");
                }
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-sleek-border text-sleek-text-main hover:bg-slate-50 hover:border-sleek-accent hover:text-sleek-accent transition-all px-4 py-2 rounded-md text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> 
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* 1. Visões Gerais */}
          <div className="col-span-12 md:col-span-3 h-[100px]">
            <Scorecard 
              title="Total de Cargas" 
              value={formatNumber(stats.totalCargas)} 
              icon={BarChart3}
              className="h-full"
            />
          </div>
          <div className="col-span-12 md:col-span-3 h-[100px]">
            <Scorecard 
              title="Média de Cargas / Dia" 
              value={stats.mediaCargasPorDia.toFixed(1)} 
              icon={TrendingUp}
              className="h-full"
            />
          </div>
          <div className="col-span-12 md:col-span-3 h-[100px]">
            <Scorecard 
              title="Volume Total Bruto" 
              value={<>{formatNumber(Math.round(stats.volumeTotalLiquido / 1000))} <span className="text-[14px] font-normal">ton</span></>} 
              icon={Scale}
              className="h-full"
            />
          </div>
          <div className="col-span-12 md:col-span-3 h-[100px]">
            <Scorecard 
              title="Umidade Média" 
              value={`${stats.umidadeMediaTotal.toFixed(1)}%`} 
              icon={AlertCircle}
              className="h-full"
            />
          </div>

          {/* 2. Gráfico de Série Temporal e Top Dias */}
          <div className="col-span-12 lg:col-span-8 h-[300px]">
            <TimeSeriesChart 
              data={dailyEvolution} 
              title="Evolução Diária de Recebimento (Tickets)" 
            />
          </div>
          <div className="col-span-12 lg:col-span-4 bg-sleek-card p-4 rounded-lg border border-sleek-border flex flex-col h-[300px]">
            <h3 className="text-[14px] font-semibold text-sleek-text-main mb-4 flex justify-between items-center">
              Top 5 Dias (Maior Volume)
            </h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Data</th>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Cargas</th>
                    <th className="text-right text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Volume (t)</th>
                  </tr>
                </thead>
                <tbody>
                  {top5Days.map((day) => (
                    <tr key={day.date} className="border-b border-slate-50">
                      <td className="py-2 px-1">{format(parseISO(day.date), 'dd/MM/yyyy')}</td>
                      <td className="py-2 px-1">{filteredData.filter(d => d.Data === day.date).length}</td>
                      <td className="py-2 px-1 text-right font-semibold text-sleek-accent">{formatNumber(Math.round(day.volume / 1000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {top5Days.length === 0 && (
                <p className="text-center text-slate-400 py-12 text-xs">Sem dados no período</p>
              )}
            </div>
          </div>

          {/* 3. Análise de Qualidade e Tabelas de Desempenho */}
          <div className="col-span-12 lg:col-span-4 h-[320px]">
            <QualityDonutChart 
              data={qualityData} 
              title="Qualidade (Umidade)" 
            />
          </div>
          <div className="col-span-12 lg:col-span-4 bg-sleek-card p-4 rounded-lg border border-sleek-border flex flex-col h-[320px]">
            <h3 className="text-[14px] font-semibold text-sleek-text-main mb-4">Top 10 Produtores (Volume)</h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Produtor</th>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Umidade</th>
                    <th className="text-right text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Bruto (t)</th>
                  </tr>
                </thead>
                <tbody>
                  {producerPerformance.map((p) => (
                    <tr key={p.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-1 font-medium truncate max-w-[100px]" title={p.name}>{p.name}</td>
                      <td className="py-2 px-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          p.mediaUmidade > 14 ? "bg-[#fce8e6] text-sleek-danger" : "bg-[#e6f4ea] text-sleek-success"
                        )}>
                          {p.mediaUmidade.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-right font-semibold text-sleek-accent">{formatNumber(Math.round(p.volumeTotal / 1000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {producerPerformance.length === 0 && (
                <p className="text-center text-slate-400 py-12 text-xs">Sem dados</p>
              )}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 bg-sleek-card p-4 rounded-lg border border-sleek-border flex flex-col h-[320px]">
            <h3 className="text-[14px] font-semibold text-sleek-text-main mb-4">Quantidade por Cultivar</h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Cultivar</th>
                    <th className="text-left text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Umidade</th>
                    <th className="text-right text-sleek-text-secondary font-medium border-b border-sleek-border pb-2 px-1">Bruto (t)</th>
                  </tr>
                </thead>
                <tbody>
                  {cultivarPerformance.map((c) => (
                    <tr key={c.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-1 font-medium truncate max-w-[100px]" title={c.name}>{c.name}</td>
                      <td className="py-2 px-1">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          c.mediaUmidade > 14 ? "bg-[#fce8e6] text-sleek-danger" : "bg-[#e6f4ea] text-sleek-success"
                        )}>
                          {c.mediaUmidade.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-1 text-right font-semibold text-sleek-accent">{formatNumber(Math.round(c.volumeTotal / 1000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cultivarPerformance.length === 0 && (
                <p className="text-center text-slate-400 py-12 text-xs">Sem dados</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



