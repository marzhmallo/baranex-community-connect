import { Loader2 } from 'lucide-react';

interface LocalizedLoadingScreenProps {
  isLoading: boolean;
}

const LocalizedLoadingScreen = ({ isLoading }: LocalizedLoadingScreenProps) => {
  console.log('LocalizedLoadingScreen render:', { isLoading });
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-primary/20" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading forums</p>
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