import { CargoData } from './types';
import { subDays, format, eachDayOfInterval } from 'date-fns';

const PRODUTORES = [
  'Fazenda Santa Maria',
  'Agropecuária Vale Verde',
  'Sítio Bom Retiro',
  'Fazenda Progresso',
  'Grupo Terra Forte',
  'Estância Esperança',
  'Fazenda Nova Era',
  'Agro São José',
  'Sítio Primavera',
  'Fazenda Horizonte',
  'Agro Planalto',
  'Fazenda Boa Vista'
];

const CULTIVARES = ['Soja M6410', 'Soja M5917', 'Milho DKB255', 'Milho P3016', 'Trigo TBIO'];

export function generateMockData(): CargoData[] {
  const data: CargoData[] = [];
  const today = new Date();
  const startDate = subDays(today, 30);
  
  const days = eachDayOfInterval({ start: startDate, end: today });
  
  let ticketCounter = 1000;

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    // Random number of loads per day (between 5 and 25)
    const loadsPerDay = Math.floor(Math.random() * 20) + 5;
    
    for (let i = 0; i < loadsPerDay; i++) {
      data.push({
        Ticket: `TKT-${ticketCounter++}`,
        Data: dateStr,
        'Liquido Sem Desc': Math.floor(Math.random() * 30000) + 10000, // 10k to 40k kg
        'Umidade (%)': parseFloat((Math.random() * 10 + 8).toFixed(1)), // 8% to 18%
        Produtor: PRODUTORES[Math.floor(Math.random() * PRODUTORES.length)],
        Cultivar: CULTIVARES[Math.floor(Math.random() * CULTIVARES.length)],
      });
    }
  });

  return data;
}
