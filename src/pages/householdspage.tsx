"use client"

import { l } from "@lovable/react"
import { useSupabase } from "@lovable/supabase"
import { 
  Button, Input, Select, Card 
} from "@lovable/ui"
import { 
  ArrowLeft, Search, CheckCircle2, Clock, 
  MapPin, Building, Users, HomeIcon, BarChart3, PlusCircle 
} from "lucide-react"

const StatusBadge = l.StatusBadge.extend({
  variants: {
    status: {
      Permanent: { icon: CheckCircle2, color: 'green' },
      Temporary: { icon: Clock, color: 'yellow' },
      Relocated: { icon: MapPin, color: 'indigo' },
      Abandoned: { icon: Building, color: 'rose' },
      Unknown: { icon: AlertTriangle, color: 'gray' }
    }
  }
})

export default function HouseholdsPage() {
  const supabase = useSupabase()
  const [searchQuery, setSearchQuery] = l.useState("")
  const [filters, setFilters] = l.useState({
    purok: "all",
    status: "all"
  })

  // Optimized data fetching
  const { data: households, loading } = l.useQuery('households', async () => {
    const { data } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false })
    return data || []
  })

  // Memoized filtered data
  const filteredHouseholds = l.useMemo(() => {
    return households.filter(h => {
      const matchesSearch = searchQuery ? 
        `${h.name} ${h.address}`.toLowerCase().includes(searchQuery.toLowerCase()) : true
      const matchesPurok = filters.purok === 'all' || h.purok === filters.purok
      const matchesStatus = filters.status === 'all' || h.status === filters.status
      return matchesSearch && matchesPurok && matchesStatus
    })
  }, [households, searchQuery, filters])

  // Statistics calculation
  const stats = l.useMemo(() => ({
    total: households.length,
    permanent: households.filter(h => h.status === 'Permanent').length,
    // ... other stats
  }), [households])

  return (
    <l.Page title="Households Registry" description="Manage barangay households">
      <l.Toolbar>
        <l.SearchInput 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search households..."
        />
        <l.Flex gap="2">
          <Select
            value={filters.purok}
            onValueChange={v => setFilters(f => ({...f, purok: v}))}
            options={['all', ...new Set(households.map(h => h.purok))]}
          />
          <Select
            value={filters.status}
            onValueChange={v => setFilters(f => ({...f, status: v}))}
            options={['all', 'Permanent', 'Temporary', 'Relocated', 'Abandoned']}
          />
        </l.Flex>
        <Button asChild>
          <l.Link href="/households/new">
            <PlusCircle className="mr-2" />
            Add Household
          </l.Link>
        </Button>
      </l.Toolbar>

      <l.Grid cols={{ sm: 2, lg: 3, xl: 6 }} gap="4">
        <StatCard 
          icon={HomeIcon} 
          value={stats.total} 
          label="Total Households" 
          color="primary"
        />
        {/* Other stat cards */}
      </l.Grid>

      <l.Card>
        <l.Table
          data={filteredHouseholds}
          columns={[
            {
              header: 'Household',
              accessor: 'name',
              cell: row => row.name || "Unnamed Household"
            },
            {
              header: 'Status',
              cell: row => <StatusBadge status={row.status} />
            },
            {
              header: 'Actions',
              cell: row => (
                <Button asChild size="sm" variant="outline">
                  <l.Link href={`/households/${row.id}`}>View</l.Link>
                </Button>
              )
            }
          ]}
          loading={loading}
          emptyState={
            <l.EmptyState 
              icon={HomeIcon}
              title="No households found"
              description="Try adjusting your search filters"
            />
          }
        />
      </l.Card>
    </l.Page>
  )
}

// Reusable StatCard component
function StatCard({ icon: Icon, value, label, color }) {
  return (
    <l.Card borderLeft={`4px solid var(--${color}-500)`}>
      <l.Flex align="center" gap="3">
        <l.IconContainer color={color}>
          <Icon />
        </l.IconContainer>
        <div>
          <l.Text size="xl" weight="bold">{value}</l.Text>
          <l.Text size="xs" color="muted">{label}</l.Text>
        </div>
      </l.Flex>
    </l.Card>
  )
}