export interface CargoData {
  Ticket: string;
  Data: string; // YYYY-MM-DD
  'Liquido Sem Desc': number;
  'Umidade (%)': number;
  Produtor: string;
  Cultivar: string;
}

export interface DashboardStats {
  totalCargas: number;
  mediaCargasPorDia: number;
  volumeTotalLiquido: number;
}

export interface ConditionData {
  name: string;
  value: number;
}
