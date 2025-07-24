import { FileText, Calendar } from 'lucide-react';

interface LocalizedLoadingScreenProps {
  isLoading: boolean;
  type?: 'documents' | 'calendar' | 'default';
}

const LocalizedLoadingScreen = ({ isLoading, type = 'default' }: LocalizedLoadingScreenProps) => {
  console.log('LocalizedLoadingScreen render:', { isLoading, type });
  if (!isLoading) return null;

  const getLoadingConfig = () => {
    switch (type) {
      case 'calendar':
        return {
          icon: Calendar,
          title: 'Loading events',
          subtitle: 'Preparing calendar data and upcoming events'
        };
      case 'documents':
        return {
          icon: FileText,
          title: 'Loading documents',
          subtitle: 'Preparing document templates and requests'
        };
      default:
        return {
          icon: FileText,
          title: 'Loading',
          subtitle: 'Please wait...'
        };
    }
  };

  const config = getLoadingConfig();
  const IconComponent = config.icon;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <IconComponent className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-primary/20" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{config.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{config.subtitle}</p>
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalizedLoadingScreen;