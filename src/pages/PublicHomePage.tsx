import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, MapPin, Users, Calendar, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const PublicHomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
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
            <Link to="/public/announcements" className="text-sm font-medium hover:text-primary transition-colors">
              Announcements
            </Link>
            <Link to="/public/events" className="text-sm font-medium hover:text-primary transition-colors">
              Events
            </Link>
            <Link to="/public/officials" className="text-sm font-medium hover:text-primary transition-colors">
              Officials
            </Link>
            <Link to="/public/emergency" className="text-sm font-medium hover:text-primary transition-colors">
              Emergency
            </Link>
            <Link to="/public/forum" className="text-sm font-medium hover:text-primary transition-colors">
              Community Forum
            </Link>
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
            <Link to="/public/announcements">
              <Button size="lg" className="w-full sm:w-auto">
                View Latest Announcements
              </Button>
            </Link>
            <Link to="/public/emergency">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emergency Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Community Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/public/announcements">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <FileText className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>
                    Stay updated with the latest news and announcements from your barangay
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/public/events">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Events Calendar</CardTitle>
                  <CardDescription>
                    View upcoming community events, meetings, and important dates
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/public/officials">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Barangay Officials</CardTitle>
                  <CardDescription>
                    Meet your elected officials and learn about their roles and responsibilities
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/public/emergency">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Emergency Services</CardTitle>
                  <CardDescription>
                    Access emergency contacts, evacuation centers, and disaster preparedness info
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/public/forum">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>
                    Participate in community discussions and share your thoughts
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

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
                  <Link to="/public/announcements" className="text-muted-foreground hover:text-primary transition-colors">
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link to="/public/events" className="text-muted-foreground hover:text-primary transition-colors">
                    Events Calendar
                  </Link>
                </li>
                <li>
                  <Link to="/public/officials" className="text-muted-foreground hover:text-primary transition-colors">
                    Barangay Officials
                  </Link>
                </li>
                <li>
                  <Link to="/public/emergency" className="text-muted-foreground hover:text-primary transition-colors">
                    Emergency Services
                  </Link>
                </li>
                <li>
                  <Link to="/public/forum" className="text-muted-foreground hover:text-primary transition-colors">
                    Community Forum
                  </Link>
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
    </div>
  );
};

export default PublicHomePage;