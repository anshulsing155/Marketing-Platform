import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { AlertCircle, Database } from 'lucide-react';

interface DatabaseCheckProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function DatabaseCheck({ loading, error, onRetry }: DatabaseCheckProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Checking database connection...</p>
      </div>
    );
  }

  if (error) {
    const isTableMissing = error.includes("relation") && error.includes("does not exist");
    
    return (
      <Card>
        <CardContent className="pt-6 pb-6 flex flex-col items-center">
          <div className="bg-amber-100 p-3 rounded-full mb-4">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Database Setup Required</h3>
          <p className="text-center text-gray-600 mb-6 max-w-md">{error}</p>
          
          {isTableMissing && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full max-w-md mb-6">
              <h4 className="font-medium mb-2">Setup Instructions:</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                <li>Log in to your Supabase dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Run the SQL script in the <code className="bg-gray-100 px-1 py-0.5 rounded">supabase-migration.sql</code> file</li>
                <li>Check that all tables were created successfully</li>
                <li>Retry the connection</li>
              </ol>
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button onClick={onRetry}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
