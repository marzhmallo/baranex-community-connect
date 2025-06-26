
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Search, 
  Plus,
  FileText,
  Calendar,
  User,
  TrendingUp
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DocumentTemplatesList from "./DocumentTemplatesList";
import DocumentTemplateForm from "./DocumentTemplateForm";
import DocumentsStats from "./DocumentsStats";
import { useNavigate } from "react-router-dom";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const navigate = useNavigate();

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleCloseForm = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  if (showTemplateForm) {
    return (
      <DocumentTemplateForm 
        template={editingTemplate} 
        onClose={handleCloseForm}
      />
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and issue official barangay documents
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/documents/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <DocumentsStats />

      {/* Search and Filter Section */}
      <Card className="border-2 border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-white/30"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-2 border-white/30">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-6 border-2 border-white/20">
                <div className="space-y-4">
                  <h4 className="font-semibold">Filter Templates</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Document Type</Label>
                      <Select>
                        <SelectTrigger className="border-2 border-white/30">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="certificate">Certificates</SelectItem>
                          <SelectItem value="clearance">Clearances</SelectItem>
                          <SelectItem value="permit">Permits</SelectItem>
                          <SelectItem value="id">IDs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Fee Range</Label>
                      <Select>
                        <SelectTrigger className="border-2 border-white/30">
                          <SelectValue placeholder="Any fee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="low">₱1 - ₱50</SelectItem>
                          <SelectItem value="medium">₱51 - ₱200</SelectItem>
                          <SelectItem value="high">₱200+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Validity Period</Label>
                    <Select>
                      <SelectTrigger className="border-2 border-white/30">
                        <SelectValue placeholder="Any validity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1 border-2 border-white/30">
                      Reset
                    </Button>
                    <Button size="sm" className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Templates List */}
          <DocumentTemplatesList 
            searchQuery={searchQuery}
            onEdit={handleEditTemplate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;
