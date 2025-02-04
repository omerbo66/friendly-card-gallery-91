import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { Client, MonthlyData, ClientMetrics } from '@/types/investment';
import { useToast } from "@/hooks/use-toast";
import { fetchClientsFromSupabase } from '@/lib/supabase';
import { generateMonthlyData } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { MetricsOverview } from './MetricsOverview';
import { ChartControls } from './ChartControls';
import { PerformanceChart } from './PerformanceChart';
import { ClientDistribution } from './ClientDistribution';
import { ClientCard } from './ClientCard';

export const Dashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllClients, setShowAllClients] = useState(false);
  const { toast } = useToast();
  const [visibleSeries, setVisibleSeries] = useState({
    portfolioValue: true,
    investment: true,
    profit: true
  });
  const [investmentPercentage, setInvestmentPercentage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const loadClients = async () => {
      try {
        const supabaseClients = await fetchClientsFromSupabase();
        console.log('Fetched clients:', supabaseClients);
        setClients(supabaseClients);
      } catch (error) {
        console.error("Error loading clients:", error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive"
        });
      }
    };

    loadClients();
  }, [toast]);

  const calculateMetrics = (client: Client): ClientMetrics => {
    // Add null check for monthlyData
    if (!client.monthlyData || !Array.isArray(client.monthlyData) || client.monthlyData.length === 0) {
      console.log('No monthly data for client:', client.name);
      return {
        totalInvestment: 0,
        portfolioValue: 0,
        totalProfit: 0,
        latestMonthlyInvestment: 0,
        managementFee: 0,
        currentValue: 0
      };
    }

    const lastMonth = client.monthlyData[client.monthlyData.length - 1];
    
    // Verify lastMonth exists and has required properties
    if (!lastMonth || typeof lastMonth.portfolioValue === 'undefined') {
      console.log('Invalid last month data for client:', client.name);
      return {
        totalInvestment: 0,
        portfolioValue: 0,
        totalProfit: 0,
        latestMonthlyInvestment: 0,
        managementFee: 0,
        currentValue: 0
      };
    }

    const totalInvestment = client.monthlyData.reduce((sum, data) => sum + (data.investment || 0), 0);

    return {
      totalInvestment,
      portfolioValue: lastMonth.portfolioValue,
      totalProfit: lastMonth.profit,
      latestMonthlyInvestment: lastMonth.investment,
      managementFee: totalInvestment * 0.005,
      currentValue: lastMonth.portfolioValue
    };
  };

  const aggregateMetrics = clients.reduce((acc, client) => {
    const metrics = calculateMetrics(client);
    return {
      totalValue: acc.totalValue + metrics.portfolioValue,
      totalInvestment: acc.totalInvestment + metrics.totalInvestment,
      totalProfit: acc.totalProfit + metrics.totalProfit,
      totalClients: clients.length
    };
  }, { totalValue: 0, totalInvestment: 0, totalProfit: 0, totalClients: 0 });

  const searchClients = (term: string) => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(term.toLowerCase()) ||
      client.profession.toLowerCase().includes(term.toLowerCase())
    );
  };

  const filteredClients = searchTerm ? searchClients(searchTerm) : clients;

  const handleInvestmentPercentageChange = (value: number[]) => {
    setInvestmentPercentage(value[0]);
    const updatedClients = clients.map(client => ({
      ...client,
      investmentPercentage: value[0].toString(),
      monthlyData: generateMonthlyData(value[0])
    }));
    setClients(updatedClients);
  };

  const handleVisibleSeriesChange = (key: keyof typeof visibleSeries, checked: boolean) => {
    setVisibleSeries(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12">
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 mb-4 md:mb-0">
          <div className="w-full sm:w-auto relative group">
            <Button 
              size="lg"
              className="w-full h-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden"
              onClick={() => navigate('/add-client')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse"></div>
              <div className="flex flex-col items-center gap-2 relative z-10 py-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">
                  Add New Client
                </span>
                <span className="text-sm font-normal text-white/90 whitespace-normal text-center">
                  Start managing a new portfolio
                </span>
                <ArrowUpRight className="w-5 h-5 mt-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Button>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <MetricsOverview metrics={aggregateMetrics} />

      <ChartControls
        investmentPercentage={investmentPercentage}
        visibleSeries={visibleSeries}
        onInvestmentPercentageChange={handleInvestmentPercentageChange}
        onVisibleSeriesChange={handleVisibleSeriesChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4">Portfolio Performance</h2>
          {clients.length > 0 && (
            <PerformanceChart
              data={selectedClient ? selectedClient.monthlyData : clients[0].monthlyData}
              visibleSeries={visibleSeries}
            />
          )}
        </div>

        <div className="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4">Client Distribution</h2>
          <ClientDistribution clients={clients} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">Client Overview</h2>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full md:w-auto pl-10 pr-4 py-2 rounded-lg border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAllClients(!showAllClients)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full md:w-auto"
            >
              {showAllClients ? 'Show Less' : 'Show All Clients'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.slice(0, showAllClients ? undefined : 6).map(client => {
            const metrics = calculateMetrics(client);
            return (
              <ClientCard
                key={client.id}
                client={client}
                metrics={metrics}
                onSelect={(selectedClient) => {
                  if (selectedClient.id === client.id) {
                    setSelectedClient(null);
                  } else {
                    setSelectedClient(selectedClient);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};