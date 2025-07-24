import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, MapPin, Users, Calendar, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { BarangaySelectionModal } from "@/components/public/BarangaySelectionModal";
import { BarangayBanner } from "@/components/public/BarangayBanner";
import { useBarangaySelection } from "@/hooks/useBarangaySelection";
import { ThemeToggle } from "@/components/theme/IconThemeToggle";

const PublicHomePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<'announcements' | 'events' | 'officials' | 'emergency' | 'forum'>('announcements');
  const { selectedBarangay, showBanner, clearSelection, dismissBanner } = useBarangaySelection();
  const navigate = useNavigate();

  const handleContentNavigation = (contentType: 'announcements' | 'events' | 'officials' | 'emergency' | 'forum') => {
    if (selectedBarangay) {
      // If barangay is already selected, navigate directly
      navigate(`/public/${contentType}?barangay=${selectedBarangay.id}`);
    } else {
      // Show modal for barangay selection
      setSelectedContentType(contentType);
      setModalOpen(true);
    }
  };

  const handleChangeBarangay = () => {
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barangay Banner */}
      {showBanner && selectedBarangay && (
        <BarangayBanner 
          onChangeBarangay={handleChangeBarangay}
          onDismiss={dismissBanner}
        />
      )}

      {/* Public Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Barangay Portal</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => handleContentNavigation('announcements')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Announcements
            </button>
            <button 
              onClick={() => handleContentNavigation('events')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Events
            </button>
            <button 
              onClick={() => handleContentNavigation('officials')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Officials
            </button>
            <button 
              onClick={() => handleContentNavigation('emergency')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Emergency
            </button>
            <button 
              onClick={() => handleContentNavigation('forum')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Community Forum
            </button>
            <ThemeToggle />
            <Link to="/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Admin Login
              </Button>
            </Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Your <span className="text-primary">Barangay Portal</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stay connected with your community. Access important announcements, events, 
            officials information, and emergency services all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => handleContentNavigation('announcements')}
            >
              View Latest Announcements
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => handleContentNavigation('emergency')}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Community Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleContentNavigation('announcements')}
            >
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Announcements</CardTitle>
                <CardDescription>
                  Stay updated with the latest news and announcements from your barangay
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleContentNavigation('events')}
            >
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Events Calendar</CardTitle>
                <CardDescription>
                  View upcoming community events, meetings, and important dates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleContentNavigation('officials')}
            >
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Barangay Officials</CardTitle>
                <CardDescription>
                  Meet your elected officials and learn about their roles and responsibilities
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleContentNavigation('emergency')}
            >
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Emergency Services</CardTitle>
                <CardDescription>
                  Access emergency contacts, evacuation centers, and disaster preparedness info
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleContentNavigation('forum')}
            >
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community Forum</CardTitle>
                <CardDescription>
                  Participate in community discussions and share your thoughts
                </CardDescription>
              </CardHeader>
            </Card>

            <Link to="/login">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
                <CardHeader>
                  <LogIn className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>For Administrators</CardTitle>
                  <CardDescription>
                    Login to access the administrative dashboard and management tools
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Barangay Portal</h3>
              <p className="text-muted-foreground mb-4">
                Your gateway to community services and information
              </p>
              <p className="text-muted-foreground">
                Connecting communities, one click at a time
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => handleContentNavigation('announcements')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Announcements
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleContentNavigation('events')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Events Calendar
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleContentNavigation('officials')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Barangay Officials
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleContentNavigation('emergency')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Emergency Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleContentNavigation('forum')}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Community Forum
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Information</h3>
              <p className="text-muted-foreground mb-4">
                This portal provides access to public information and services
              </p>
              <p className="text-muted-foreground">
                For administrative access, please contact your local officials
              </p>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Barangay Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Barangay Selection Modal */}
      <BarangaySelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contentType={selectedContentType}
      />
    </div>
  );
};

export default PublicHomePage;