// types/dashboard.ts
export interface KPIs {
  avgPM25: number;
  avgTemp: number;
  avgPM10: number;
  maxCO2: number;
  aguaCaida: number;
}

export interface TimePoint {
  date: string; // ISO date 'YYYY-MM-DD' o ISO datetime
  pm25?: number;
  temp?: number;
  co2?: number;
}

export interface CompositionDatum {
  name: string;
  value: number;
}

export interface StackedDatum {
  date: string;
  co2?: number;
  consumo?: number;
}

export interface TempCo2Point {
  tempBin: number;
  co2: number;
  count: number;
}

export interface DashboardPayload {
  kpis: KPIs;
  timeseries: TimePoint[];
  composition: CompositionDatum[];
  stacked: StackedDatum[];
  tempCo2Trend: TempCo2Point[];
}
