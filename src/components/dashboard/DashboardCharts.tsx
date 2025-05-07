import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // adjust path as needed
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Bar } from 'recharts';
import { ChartContainer } from '@/components/chart-container';
import { ChartTooltipContent } from '@/components/chart-tooltip';
import { Users, FileText, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardCharts = () => {
  const [populationData, setPopulationData] = useState([]);
  const [demographicData, setDemographicData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchPopulation();
    fetchDemographics();
    fetchActivities();
  }, []);

  const fetchPopulation = async () => {
    const { data, error } = await supabase
      .from('population_stats')
      .select('month, residents')
      .order('id', { ascending: true });

    if (!error) setPopulationData(data);
  };

  const fetchDemographics = async () => {
    const { data, error } = await supabase
      .from('demographics')
      .select('age_group, male, female')
      .order('id', { ascending: true });

    if (!error) {
      const formatted = data.map(d => ({
        age: d.age_group,
        male: d.male,
        female: d.female,
      }));
      setDemographicData(formatted);
    }
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);

    if (!error) setRecentActivities(data);
  };

  const totalPopulation = populationData.at(-1)?.residents || 0;
  const lastMonth = populationData[populationData.length - 1];
  const secondLastMonth = populationData[populationData.length - 2];
  const growthRate = secondLastMonth
    ? (((lastMonth.residents - secondLastMonth.residents) / secondLastMonth.residents) * 100).toFixed(1)
    : '0.0';
  const newThisMonth = secondLastMonth
    ? lastMonth.residents - secondLastMonth.residents
    : lastMonth?.residents;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Population Overview</CardTitle>
              <CardDescription>Monthly resident registration trends</CardDescription>
            </div>
            <Tabs defaultValue="line" className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
              <TabsContent value="line" className="p-0">
                <ChartContainer config={{ residents: { theme: { dark: '#3b82f6', light: '#3b82f6' } } }}>
                  <LineChart data={populationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Line type="monotone" dataKey="residents" stroke="var(--color-residents, #3b82f6)" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="bar" className="p-0">
                <ChartContainer config={{ residents: { theme: { dark: '#3b82f6', light: '#3b82f6' } } }}>
                  <BarChart data={populationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Bar dataKey="residents" fill="var(--color-residents, #3b82f6)" />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">Total Population</div>
                <div className="text-2xl font-bold text-center">{totalPopulation.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">Growth Rate</div>
                <div className="text-2xl font-bold text-center text-baranex-success">+{growthRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">New this Month</div>
                <div className="text-2xl font-bold text-center">{newThisMonth}</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    {activity.type === 'resident' && <Users className="h-4 w-4 text-primary" />}
                    {activity.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
                    {activity.type === 'household' && <Home className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <Link to="/activity" className="flex items-center justify-center text-sm text-primary hover:underline mt-2 py-2">
                View all activity <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>Demographic breakdown by gender</CardDescription>
          </CardHeader>
          <CardContent className="aspect-auto h-[200px] pt-0">
            <ChartContainer config={{
              male: { theme: { dark: '#3b82f6', light: '#3b82f6' } },
              female: { theme: { dark: '#ec4899', light: '#ec4899' } },
            }}>
              <BarChart layout="vertical" data={demographicData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="age" type="category" />
                <Tooltip content={<ChartTooltipContent nameKey="age" />} />
                <Legend />
                <Bar dataKey="male" fill="var(--color-male, #3b82f6)" />
                <Bar dataKey="female" fill="var(--color-female, #ec4899)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
