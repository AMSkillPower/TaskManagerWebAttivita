import React from 'react';
import { Calendar, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react';

interface CommentIntegrationStatusProps {
  results: {
    calendar: boolean;
    sharepoint: boolean;
  } | null;
  loading: boolean;
}

const CommentIntegrationStatus: React.FC<CommentIntegrationStatusProps> = ({
  results,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Sincronizzazione in corso...</span>
      </div>
    );
  }

  if (!results) return null;

  const hasAnyIntegration = results.calendar !== undefined || results.sharepoint !== undefined;
  
  if (!hasAnyIntegration) return null;

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center space-x-4 text-xs">
        <span className="text-gray-600 font-medium">Sincronizzazione:</span>
        
        {results.calendar !== undefined && (
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 text-blue-600" />
            {results.calendar ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>Calendar</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <X className="h-3 w-3" />
                <span>Calendar</span>
              </div>
            )}
          </div>
        )}

        {results.sharepoint !== undefined && (
          <div className="flex items-center space-x-1">
            <FileSpreadsheet className="h-3 w-3 text-green-600" />
            {results.sharepoint ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>Excel</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <X className="h-3 w-3" />
                <span>Excel</span>
              </div>
            )}
          </div>
        )}

        {(!results.calendar && !results.sharepoint) && (
          <div className="flex items-center space-x-1 text-yellow-600">
            <AlertCircle className="h-3 w-3" />
            <span>Errori di sincronizzazione</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentIntegrationStatus;