export interface MonthlyData {
  month: number;
  expenses: number;
  investment: number;
  portfolioValue: number;
  profit: number;
}

export type InvestmentTrack = 'SPY500' | 'NASDAQ100' | 'RUSSELL2000' | 'VTSAX' | 'VTI' | 'SWTSX' | 'IWV' | 'WFIVX';

export interface Client {
  id: number;
  name: string;
  profession: string;
  customProfession?: string;
  investmentTrack: InvestmentTrack;
  monthlyData: MonthlyData[];
  monthlyExpenses: number;
  investmentPercentage: string;
}

export interface Metrics {
  totalInvestment: number;
  portfolioValue: number;
  totalProfit: number;
  latestMonthlyInvestment: number;
  managementFee: number;
  currentValue: number;
}

export interface ClientMetrics extends Metrics {
  // Now includes all properties from Metrics, including currentValue
}

export interface AggregateMetrics {
  totalValue: number;
  totalInvestment: number;
  totalProfit: number;
  totalClients: number;
}