import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

export default function ErrorState({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Page</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/landing-pages">
          <Button>Back to Pages</Button>
        </Link>
      </div>
    </div>
  );
}
