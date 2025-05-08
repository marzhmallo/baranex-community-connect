import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from 'react-router-dom';
import { FileText, Users, Home, TrendingUp, ChevronRight } from 'lucide-react';

// Sample data
const populationData = [{
  month: 'Jan',
  residents: 2400
}, {
  month: 'Feb',
  residents: 2500
}, {
  month: 'Mar',
  residents: 2600
}, {
  month: 'Apr',
  residents: 2680
}, {
  month: 'May',
  residents: 2750
}, {
  month: 'Jun',
  residents: 2800
}, {
  month: 'Jul',
  residents: 2840
}, {
  month: 'Aug',
  residents: 2780
}, {
  month: 'Sep',
  residents: 2860
}, {
  month: 'Oct',
  residents: 2920
}, {
  month: 'Nov',
  residents: 2980
}, {
  month: 'Dec',
  residents: 3050
}];
const demographicData = [{
  age: '0-10',
  male: 120,
  female: 132
}, {
  age: '11-20',
  male: 245,
  female: 231
}, {
  age: '21-30',
  male: 320,
  female: 332
}, {
  age: '31-40',
  male: 290,
  female: 301
}, {
  age: '41-50',
  male: 245,
  female: 230
}, {
  age: '51-60',
  male: 178,
  female: 191
}, {
  age: '61-70',
  male: 122,
  female: 129
}, {
  age: '71+',
  male: 78,
  female: 86
}];
const DashboardCharts = () => {
  const recentActivities = [{
    id: 1,
    type: 'resident',
    name: 'Maria Santos',
    action: 'registered',
    date: '2 hours ago'
  }, {
    id: 2,
    type: 'document',
    name: 'Barangay Clearance',
    action: 'issued to Juan Dela Cruz',
    date: '5 hours ago'
  }, {
    id: 3,
    type: 'household',
    name: 'Garcia Family',
    action: 'updated information',
    date: '1 day ago'
  }, {
    id: 4,
    type: 'resident',
    name: 'Pedro Reyes',
    action: 'updated contact details',
    date: '2 days ago'
  }];
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main chart area - takes up 2 columns on md screens */}
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="mb-1">Population Overview</CardTitle>
              <CardDescription>Monthly resident registration trends</CardDescription>
            </div>
            <Tabs defaultValue="line" className="w-[1500px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
              <TabsContent value="line" className="p-0">
                <ChartContainer config={{
                residents: {
                  theme: {
                    dark: '#3b82f6',
                    light: '#3b82f6'
                  }
                }
              }} className="aspect-auto h-[300px]">
                  <LineChart data={populationData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Line type="monotone" dataKey="residents" name="Residents" stroke="var(--color-residents, #3b82f6)" strokeWidth={2} activeDot={{
                    r: 8
                  }} />
                  </LineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="bar" className="p-0">
                <ChartContainer config={{
                residents: {
                  theme: {
                    dark: '#3b82f6',
                    light: '#3b82f6'
                  }
                }
              }} className="aspect-auto h-[300px]">
                  <BarChart data={populationData} margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Bar dataKey="residents" name="Residents" fill="var(--color-residents, #3b82f6)" />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Total Population</div>
                  <div className="text-2xl font-bold text-center">3,050</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Growth Rate</div>
                  <div className="text-2xl font-bold text-center text-baranex-success">+2.1%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="text-xs uppercase text-muted-foreground mb-1">New this Month</div>
                  <div className="text-2xl font-bold text-center">48</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar area - takes 1 column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-4">
              {recentActivities.map(activity => <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    {activity.type === 'resident' && <Users className="h-4 w-4 text-primary" />}
                    {activity.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
                    {activity.type === 'household' && <Home className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.name} 
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date}
                    </p>
                  </div>
                </div>)}

              <Link to="/activity" className="flex items-center justify-center text-sm text-primary hover:underline mt-2 py-2">
                View all activity
                <ChevronRight className="h-4 w-4 ml-1" />
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
            male: {
              theme: {
                dark: '#3b82f6',
                light: '#3b82f6'
              }
            },
            female: {
              theme: {
                dark: '#ec4899',
                light: '#ec4899'
              }
            }
          }} className="aspect-auto">
              <BarChart layout="vertical" data={demographicData} margin={{
              top: 5,
              right: 30,
              left: 40,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="age" type="category" />
                <Tooltip content={<ChartTooltipContent nameKey="age" />} />
                <Legend />
                <Bar dataKey="male" name="Male" fill="var(--color-male, #3b82f6)" />
                <Bar dataKey="female" name="Female" fill="var(--color-female, #ec4899)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default DashboardCharts;