"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  Users,
  HomeIcon,
  BarChart3,
  PlusCircle,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatResidentName } from "@/lib/format-names"

// Define typesz
interface Household {
  id: string
  name: string
  address: string
  purok: string
  status: string
  head_of_family: string | null
  is_permanent?: boolean
  [key: string]: any
}

interface Resident {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  [key: string]: any
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string) {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Normalize status for consistent comparison
function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "Unknown"
  return status.trim()
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeStatus(status)

  if (normalizedStatus === "Permanent") {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Permanent
      </div>
    )
  }

  if (normalizedStatus === "Temporary") {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Temporary
      </div>
    )
  }

  if (normalizedStatus === "Relocated") {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
        <MapPin className="h-3 w-3 mr-1" />
        Relocated
      </div>
    )
  }

  if (normalizedStatus === "Abandoned") {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
        <Building className="h-3 w-3 mr-1 opacity-70" />
        Abandoned
      </div>
    )
  }

  return (
    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
      <AlertTriangle className="h-3 w-3 mr-1" />
      {status || "Unknown"}
    </div>
  )
}

export default function HouseholdsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [households, setHouseholds] = useState<Household[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHouseholds, setFilteredHouseholds] = useState<Household[]>([])
  const [selectedPurok, setSelectedPurok] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [stats, setStats] = useState({
    total: 0,
    permanent: 0,
    temporary: 0,
    relocated: 0,
    abandoned: 0,
    averageSize: 0,
  })
  const [headOfFamilyMap, setHeadOfFamilyMap] = useState<Record<string, string>>({})
  const [puroks, setPuroks] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])

  // Fetch households data
  useEffect(() => {
    async function fetchHouseholds() {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Fetch households
        const { data, error } = await supabase.from("households").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching households:", error)
          toast.error("Failed to load households")
          return
        }

        // Extract unique puroks and statuses
        const uniquePuroks = Array.from(new Set((data || []).map((h) => h.purok).filter(Boolean)))
        const uniqueStatuses = Array.from(new Set((data || []).map((h) => h.status).filter(Boolean)))

        setPuroks(uniquePuroks)
        setStatuses(uniqueStatuses)

        // Prepare head of family map
        const nameMap: Record<string, string> = {}

        // For non-UUID values, add them directly to the map
        data?.forEach((household) => {
          if (household.head_of_family && !isValidUUID(household.head_of_family)) {
            // If it's not a UUID, it's probably already a name
            nameMap[household.head_of_family] = household.head_of_family
          }
        })

        // Fetch head of family names - only for valid UUIDs
        const headOfFamilyIds =
          data
            ?.map((household) => household.head_of_family)
            .filter(Boolean)
            .filter((id) => isValidUUID(id as string)) || []

        if (headOfFamilyIds.length > 0) {
          try {
            const { data: residentsData, error: residentsError } = await supabase
              .from("residents")
              .select("id, first_name, middle_name, last_name, suffix")
              .in("id", headOfFamilyIds)

            if (!residentsError && residentsData) {
              residentsData.forEach((resident: Resident) => {
                try {
                  // Use the formatResidentName function
                  nameMap[resident.id] = formatResidentName(
                    resident.first_name,
                    resident.last_name,
                    resident.middle_name,
                    resident.suffix,
                  )
                } catch (formatError) {
                  console.error("Error formatting name:", formatError)
                  // Use a simple fallback format
                  nameMap[resident.id] = `${resident.last_name}, ${resident.first_name}`
                }
              })
            } else if (residentsError) {
              console.error("Error fetching head of family data:", residentsError)
            }
          } catch (residentError) {
            console.error("Error in resident query:", residentError)
          }
        }

        setHeadOfFamilyMap(nameMap)

        // Calculate statistics
        const householdsWithCounts = await Promise.all(
          (data || []).map(async (household) => {
            try {
              const { count, error: countError } = await supabase
                .from("residents")
                .select("*", { count: "exact", head: true })
                .eq("household_id", household.id)

              if (countError) {
                console.error("Error counting residents:", countError)
                return { ...household, resident_count: 0 }
              }

              return { ...household, resident_count: count || 0 }
            } catch (countError) {
              console.error("Error in count query:", countError)
              return { ...household, resident_count: 0 }
            }
          }),
        )

        // Calculate statistics
        const totalHouseholds = householdsWithCounts.length

        // Count households by status - using normalized status for consistent comparison
        const permanentHouseholds = householdsWithCounts.filter((h) => normalizeStatus(h.status) === "Permanent").length
        const temporaryHouseholds = householdsWithCounts.filter((h) => normalizeStatus(h.status) === "Temporary").length
        const relocatedHouseholds = householdsWithCounts.filter((h) => normalizeStatus(h.status) === "Relocated").length
        const abandonedHouseholds = householdsWithCounts.filter((h) => normalizeStatus(h.status) === "Abandoned").length

        const totalResidents = householdsWithCounts.reduce((sum, h) => sum + (h.resident_count || 0), 0)
        const averageSize = totalHouseholds > 0 ? (totalResidents / totalHouseholds).toFixed(1) : "N/A"

        setStats({
          total: totalHouseholds,
          permanent: permanentHouseholds,
          temporary: temporaryHouseholds,
          relocated: relocatedHouseholds,
          abandoned: abandonedHouseholds,
          averageSize: averageSize === "N/A" ? 0 : Number.parseFloat(averageSize),
        })

        setHouseholds(householdsWithCounts)
        setFilteredHouseholds(householdsWithCounts)
      } catch (error) {
        console.error("Error:", error)
        toast.error("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholds()

    // Check if we have a deleted=true query param to show a success message
    if (typeof window !== "undefined") {
      const searchParams = new URL(window.location.href).searchParams
      if (searchParams.get("deleted") === "true") {
        toast.success("Household deleted successfully")
        // Remove the query parameter to prevent showing the toast on refresh
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // Check for created=true query param
      if (searchParams.get("created") === "true") {
        toast.success("Household created successfully")
        // Remove the query parameter to prevent showing the toast on refresh
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [])

  // Filter households based on search query, purok, and status
  useEffect(() => {
    let filtered = [...households]

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((household) => {
        const headOfFamilyName = household.head_of_family ? headOfFamilyMap[household.head_of_family] || "" : ""

        return (
          household.name?.toLowerCase().includes(query) ||
          headOfFamilyName.toLowerCase().includes(query) ||
          household.address?.toLowerCase().includes(query) ||
          `purok ${household.purok}`.toLowerCase().includes(query)
        )
      })
    }

    // Filter by purok
    if (selectedPurok !== "all") {
      filtered = filtered.filter((household) => household.purok === selectedPurok)
    }

    // Filter by status - using normalized status for consistent comparison
    if (selectedStatus !== "all") {
      filtered = filtered.filter((household) => normalizeStatus(household.status) === selectedStatus)
    }

    setFilteredHouseholds(filtered)
  }, [searchQuery, selectedPurok, selectedStatus, households, headOfFamilyMap])

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Households Registry</h1>
            <p className="text-muted-foreground text-sm">Manage and view all registered households in the barangay</p>
          </div>
        </div>
        <Link href="/dashboard/households/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Household
          </Button>
        </Link>
      </div>

      {/* Search and Filters - Household Data */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Household Data
          </CardTitle>
          <CardDescription>Search, filter, and manage household records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search households by name, address, or head of family..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={selectedPurok} onValueChange={setSelectedPurok}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="All Puroks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Puroks</SelectItem>
                {puroks.map((purok) => (
                  <SelectItem key={purok} value={purok}>
                    Purok {purok}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Households Table */}
          <div className="rounded-md border dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="font-semibold">Household Name</TableHead>
                  <TableHead className="font-semibold">Head of Family</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <div className="h-8 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredHouseholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <HomeIcon className="h-10 w-10 mb-2 opacity-20" />
                        <p>No households found matching your search criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHouseholds.map((household) => (
                    <TableRow key={household.id} className="hover:bg-muted/30 dark:hover:bg-gray-800/30">
                      <TableCell className="font-medium">{household.name || "Unnamed Household"}</TableCell>
                      <TableCell>
                        {household.head_of_family ? headOfFamilyMap[household.head_of_family] || "Unknown" : "None"}
                      </TableCell>
                      <TableCell>
                        {household.address
                          ? `${household.address}${household.purok ? `, Purok ${household.purok}` : ""}`
                          : "No address"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={household.status || "Unknown"} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/5 dark:hover:bg-primary/10"
                          asChild
                        >
                          <Link href={`/dashboard/households/id/${household.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards - Redesigned to prevent text cutoff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Households Card */}
        <Card className="overflow-hidden border-l-4 border-l-primary dark:bg-gray-800 dark:border-gray-700 dark:border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-full flex-shrink-0">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Households</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permanent Card */}
        <Card className="overflow-hidden border-l-4 border-l-green-500 dark:bg-gray-800 dark:border-gray-700 dark:border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 dark:bg-green-900/30 p-2.5 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.permanent}</p>
                <p className="text-xs text-muted-foreground">Permanent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temporary Card */}
        <Card className="overflow-hidden border-l-4 border-l-yellow-500 dark:bg-gray-800 dark:border-gray-700 dark:border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-2.5 rounded-full flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.temporary}</p>
                <p className="text-xs text-muted-foreground">Temporary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relocated Card */}
        <Card className="overflow-hidden border-l-4 border-l-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-full flex-shrink-0">
                <MapPin className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.relocated}</p>
                <p className="text-xs text-muted-foreground">Relocated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abandoned Card */}
        <Card className="overflow-hidden border-l-4 border-l-rose-500 dark:bg-gray-800 dark:border-gray-700 dark:border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-rose-50 dark:bg-rose-900/30 p-2.5 rounded-full flex-shrink-0">
                <Building className="h-5 w-5 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.abandoned}</p>
                <p className="text-xs text-muted-foreground">Abandoned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Size Card */}
        <Card className="overflow-hidden border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-full flex-shrink-0">
                <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold truncate">{stats.averageSize > 0 ? stats.averageSize : "N/A"}</p>
                <p className="text-xs text-muted-foreground">Average Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}