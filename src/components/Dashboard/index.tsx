import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ResponsiveLine } from '@nivo/line';
import { Search, ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';
import { Client, MonthlyData, ClientMetrics, AggregateMetrics } from '@/types/investment';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from "@/components/ui/use-toast";
import { fetchClientsFromSupabase, migrateLocalStorageToSupabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { INVESTMENT_TRACKS, PROFESSIONS } from '@/lib/constants';

const COLORS = ['#8B5CF6', '#0EA5E9', '#F97316', '#D946EF', '#10B981'];
const RISK_PROFILES = ['Conservative', 'Moderate', 'Aggressive'];

const NASDAQ_RETURNS = [
  0.0362, 0.0048, 0.0621, -0.0052, 0.0268, 0.0065, -0.0075, 0.0596, 0.0688, -0.0441,
  0.0179, 0.0612, 0.0102, 0.0552, 0.1070, -0.0278, -0.0581, -0.0217, 0.0405, 0.0659,
  0.0580, 0.0004, 0.0669, -0.0111, 0.1068, -0.0873, 0.0437, 0.0390, -0.1050, -0.0464,
  0.1235, -0.0871, -0.0205, -0.1326, 0.0341, -0.0343, -0.0898, 0.0069, 0.0025, 0.0727,
  -0.0531, 0.0400, 0.0116, 0.0549, -0.0153, 0.0540, 0.0041, 0.0093, 0.0142, 0.0565,
  0.1180, -0.0229, -0.0516, 0.0959, 0.0682, 0.0599, 0.0675, 0.1545, -0.1012, -0.0638,
  0.0199
].reverse();

export const Dashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [comparisonClient, setComparisonClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllClients, setShowAllClients] = useState(false);
  const { toast } = useToast();
  const [visibleSeries, setVisibleSeries] = useState({
    portfolioValue: true,
    investment: true,
    profit: true
  });
  const [investmentPercentage, setInvestmentPercentage] = useState(10);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    const loadClients = async () => {
      try {
        // First, try to migrate any existing localStorage data
        await migrateLocalStorageToSupabase();
        
        // Then fetch all clients from Supabase
        const supabaseClients = await fetchClientsFromSupabase();
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
  }, []);

  const searchClients = (term: string) => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(term.toLowerCase()) ||
      client.profession.toLowerCase().includes(term.toLowerCase())
    );
  };

  const calculateMetrics = (client: Client): ClientMetrics => {
    if (!client.monthlyData || client.monthlyData.length === 0) {
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
    const totalInvestment = client.monthlyData.reduce((sum, data) => sum + data.investment, 0);
    
    return {
      totalInvestment,
      portfolioValue: lastMonth.portfolioValue,
      totalProfit: lastMonth.profit,
      latestMonthlyInvestment: lastMonth.investment,
      managementFee: totalInvestment * 0.005,
      currentValue: lastMonth.portfolioValue
    };
  };

  const aggregateMetrics: AggregateMetrics = clients.reduce((acc, client) => {
    if (!client) return acc;
    const metrics = calculateMetrics(client);
    return {
      totalValue: acc.totalValue + metrics.portfolioValue,
      totalInvestment: acc.totalInvestment + metrics.totalInvestment,
      totalProfit: acc.totalProfit + metrics.totalProfit,
      totalClients: clients.length
    };
  }, { totalValue: 0, totalInvestment: 0, totalProfit: 0, totalClients: 0 });

  const filteredClients = searchTerm ? searchClients(searchTerm) : clients;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const formatChartData = (data: MonthlyData[] | undefined) => {
    if (!data) return [];
    
    const series = [
      {
        id: "Portfolio Value",
        color: "#8B5CF6",
        data: data.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.portfolioValue.toFixed(2))
        })),
        visible: visibleSeries.portfolioValue
      },
      {
        id: "Monthly Investment",
        color: "#0EA5E9",
        data: data.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.investment.toFixed(2))
        })),
        visible: visibleSeries.investment
      },
      {
        id: "Cumulative Profit",
        color: "#F97316",
        data: data.map(d => ({
          x: `Month ${d.month}`,
          y: Number(d.profit.toFixed(2))
        })),
        visible: visibleSeries.profit
      }
    ];

    return series.filter(s => s.visible);
  };

  const handleInvestmentPercentageChange = (value: number[]) => {
    setInvestmentPercentage(value[0]);
    const updatedClients = clients.map(client => ({
      ...client,
      investmentPercentage: value[0].toString(),
      monthlyData: generateMonthlyData(value[0])
    }));
    setClients(updatedClients);
    // Removed saveClients call since we're using Supabase
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4">Portfolio Performance</h2>
          {clients.length > 0 && (
            <ResponsiveLine
              data={formatChartData(selectedClient ? selectedClient.monthlyData : clients[0]?.monthlyData)}
              margin={{ top: 30, right: 110, bottom: 50, left: 80 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Timeline',
                legendOffset: 40,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Amount (ILS)',
                legendOffset: -60,
                legendPosition: 'middle',
              }}
              enableGridX={false}
              enableGridY={true}
              pointSize={8}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              enableArea={true}
              areaOpacity={0.15}
              useMesh={true}
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  justify: false,
                  translateX: 100,
                  translateY: 0,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 100,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  symbolBorderColor: 'rgba(0, 0, 0, .5)',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ]}
              theme={{
                axis: {
                  ticks: {
                    text: {
                      fontSize: isMobile ? 10 : 12,
                      fill: 'hsl(var(--muted-foreground))'
                    }
                  },
                  legend: {
                    text: {
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))'
                    }
                  }
                },
                grid: {
                  line: {
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1
                  }
                },
                crosshair: {
                  line: {
                    stroke: 'hsl(var(--muted-foreground))',
                    strokeWidth: 1,
                    strokeOpacity: 0.35
                  }
                },
                tooltip: {
                  container: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: 12,
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border))'
                  }
                }
              }}
            />
          )}
        </div>

        <div className="bg-card text-card-foreground rounded-xl p-4 md:p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4">Client Distribution</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PROFESSIONS.map(profession => ({
                  name: profession,
                  value: clients.filter(client => client.profession === profession).length
                }))}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 60 : 80}
                outerRadius={isMobile ? 90 : 120}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: '#374151', strokeWidth: 1 }}
              >
                {PROFESSIONS.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
            const isSelected = selectedClient?.id === client.id;
            const isComparison = comparisonClient?.id === client.id;
            const selectedTrack = INVESTMENT_TRACKS.find(track => track.id === client.investmentTrack);

            return (
              <div
                key={client.id}
                className={`bg-card text-card-foreground p-6 rounded-xl shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${isComparison ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedClient(null);
                  } else if (isComparison) {
                    setComparisonClient(null);
                  } else if (!selectedClient) {
                    setSelectedClient(client);
                  } else {
                    setComparisonClient(client);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-semibold text-lg">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.profession}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedTrack?.type === 'Mutual Fund' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    selectedTrack?.type === 'ETF' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }`}>
                    {selectedTrack?.name}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-border pb-4">
                    <h4 className="font-medium mb-4">Investment Profile</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Investment Track:</span>
                        <span className="text-sm font-medium">{selectedTrack?.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Portfolio Value:</span>
                        <span className="text-sm font-medium">{formatCurrency(metrics.portfolioValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Investment:</span>
                        <span className="text-sm font-medium">{formatCurrency(metrics.totalInvestment)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Profit:</span>
                        <span className={`text-sm font-medium ${metrics.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(metrics.totalProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-xl p-4 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">{selectedClient.name}</h2>
                <p className="text-muted-foreground">{selectedClient.profession}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground text-xl p-2"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-4">Investment Profile</h3>
                <div className="space-y-2">
                  {(() => {
                    const selectedTrack = INVESTMENT_TRACKS.find(t => t.id === selectedClient.investmentTrack);
                    return <p>Investment Track: {selectedTrack?.name}</p>;
                  })()}
                  <p>Latest Monthly Investment: {formatCurrency(calculateMetrics(selectedClient).latestMonthlyInvestment)}</p>
                  <p>Total Investment: {formatCurrency(calculateMetrics(selectedClient).totalInvestment)}</p>
                  <p>Portfolio Value: {formatCurrency(calculateMetrics(selectedClient).portfolioValue)}</p>
                  <p>Total Profit: {formatCurrency(calculateMetrics(selectedClient).totalProfit)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Performance Chart</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ResponsiveLine
                      data={formatChartData(selectedClient.monthlyData)}
                      margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                      curve="monotoneX"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: 'Month',
                        legendOffset: 40,
                        legendPosition: 'middle'
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Value (ILS)',
                        legendOffset: -50,
                        legendPosition: 'middle',
                        format: (value: number) => 
                          new Intl.NumberFormat('he-IL', {
                            style: 'currency',
                            currency: 'ILS',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value)
                      }}
                      enablePoints={false}
                      pointSize={10}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 50,
                          itemsSpacing: 0,
                          itemDirection: 'left-to-right',
                          itemWidth: 140,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: 'circle',
                          symbolBorderColor: 'rgba(0, 0, 0, .5)',
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemBackground: 'rgba(0, 0, 0, .03)',
                                itemOpacity: 1
                              }
                            }
                          ]
                        }
                      ]}
                      theme={{
                        axis: {
                          ticks: {
                            text: {
                              fontSize: isMobile ? 10 : 12
                            }
                          }
                        },
                        legends: {
                          text: {
                            fontSize: isMobile ? 10 : 12
                          }
                        }
                      }}
                      tooltip={({ point }) => (
                        <div className="bg-card p-2 shadow rounded border border-border">
                          <strong>{point.serieId}</strong>: {
                            new Intl.NumberFormat('he-IL', {
                              style: 'currency',
                              currency: 'ILS',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(Number(point.data.y))
                          }
                        </div>
                      )}
                    />
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4">Monthly Details</h3>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Monthly Expenses</TableHead>
                      <TableHead>Investment Amount</TableHead>
                      <TableHead>Portfolio Value</TableHead>
                      <TableHead>Profit/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClient.monthlyData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>Month {data.month}</TableCell>
                        <TableCell>{formatCurrency(data.expenses)}</TableCell>
                        <TableCell>{formatCurrency(data.investment)}</TableCell>
                        <TableCell>{formatCurrency(data.portfolioValue)}</TableCell>
                        <TableCell className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(data.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};