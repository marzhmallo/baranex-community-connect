
import { FileCheck, FileClock, FileWarning, Files } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DocumentsStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Documents
          </CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">248</div>
          <p className="text-xs text-muted-foreground mt-1">
            +12% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Approval
          </CardTitle>
          <FileClock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">32</div>
          <p className="text-xs text-muted-foreground mt-1">
            +4% from last week
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Approved Documents
          </CardTitle>
          <FileCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">187</div>
          <p className="text-xs text-muted-foreground mt-1">
            +15% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-card hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rejected Documents
          </CardTitle>
          <FileWarning className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">29</div>
          <p className="text-xs text-muted-foreground mt-1">
            -8% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsStats;
