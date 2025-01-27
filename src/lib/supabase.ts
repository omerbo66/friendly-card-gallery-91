import { supabase } from "@/integrations/supabase/client";
import { Client, MonthlyData, InvestmentTrack } from "@/types/investment";
import { toast } from "@/hooks/use-toast";

export const saveClientToSupabase = async (client: Omit<Client, "id">) => {
  console.log("Saving client to Supabase:", client);
  
  try {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        profession: client.profession,
        custom_profession: client.customProfession,
        monthly_expenses: client.monthlyExpenses,
        investment_percentage: client.investmentPercentage,
        investment_track: client.investmentTrack
      })
      .select()
      .single();

    if (clientError) throw clientError;
    console.log("Client saved successfully:", clientData);

    const monthlyDataToInsert = client.monthlyData.map(data => ({
      client_id: clientData.id,
      month: data.month,
      expenses: data.expenses,
      investment: data.investment,
      portfolio_value: data.portfolioValue,
      profit: data.profit
    }));

    const { error: monthlyError } = await supabase
      .from('monthly_data')
      .insert(monthlyDataToInsert);

    if (monthlyError) throw monthlyError;
    console.log("Monthly data saved successfully");

    return clientData;
  } catch (error) {
    console.error("Error saving client:", error);
    toast({
      title: "Error",
      description: "Failed to save client data",
      variant: "destructive"
    });
    throw error;
  }
};

export const fetchClientsFromSupabase = async (): Promise<Client[]> => {
  console.log("Fetching clients from Supabase");
  
  try {
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) throw clientsError;
    console.log("Clients fetched successfully:", clients);

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('monthly_data')
      .select('*');

    if (monthlyError) throw monthlyError;
    console.log("Monthly data fetched successfully");

    return clients.map(client => ({
      id: parseInt(client.id), // Convert UUID to number for type compatibility
      name: client.name,
      profession: client.profession,
      customProfession: client.custom_profession,
      monthlyExpenses: client.monthly_expenses,
      investmentPercentage: client.investment_percentage,
      investmentTrack: client.investment_track as InvestmentTrack,
      monthlyData: monthlyData
        .filter(data => data.client_id === client.id)
        .map(data => ({
          month: data.month,
          expenses: data.expenses,
          investment: data.investment,
          portfolioValue: data.portfolio_value,
          profit: data.profit
        }))
    }));
  } catch (error) {
    console.error("Error fetching clients:", error);
    toast({
      title: "Error",
      description: "Failed to load client data",
      variant: "destructive"
    });
    throw error;
  }
};

export const migrateLocalStorageToSupabase = async () => {
  console.log("Starting localStorage to Supabase migration");
  
  try {
    const localData = localStorage.getItem('investment-clients');
    if (!localData) {
      console.log("No local data found to migrate");
      return;
    }

    const clients: Client[] = JSON.parse(localData);
    console.log("Found local clients to migrate:", clients.length);

    for (const client of clients) {
      const clientToSave = {
        name: client.name,
        profession: client.profession,
        customProfession: client.customProfession,
        monthlyExpenses: client.monthlyExpenses,
        investmentPercentage: client.investmentPercentage,
        investmentTrack: client.investmentTrack,
        monthlyData: client.monthlyData
      };

      await saveClientToSupabase(clientToSave);
    }

    console.log("Migration completed successfully");
    toast({
      title: "Success",
      description: "Data migrated to Supabase successfully"
    });

    localStorage.removeItem('investment-clients');
  } catch (error) {
    console.error("Migration failed:", error);
    toast({
      title: "Error",
      description: "Failed to migrate data to Supabase",
      variant: "destructive"
    });
    throw error;
  }
};