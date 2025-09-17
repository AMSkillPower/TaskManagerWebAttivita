import React, { useState, useEffect } from 'react';
import { integrationService } from '../services/integrationService';
import { Calendar, FileSpreadsheet, Settings, Check, X, RefreshCw } from 'lucide-react';

const IntegrationSettings: React.FC = () => {
  const [config, setConfig] = useState(integrationService.getConfig());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    calendar: 'disconnected' | 'connected' | 'connecting';
    sharepoint: 'disconnected' | 'connected' | 'connecting';
  }>({
    calendar: 'disconnected',
    sharepoint: 'disconnected'
  });

  useEffect(() => {
    // Verifica stato connessioni all'avvio
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    // Verifica se i token sono presenti
    const googleToken = localStorage.getItem('google_access_token');
    const sharepointToken = localStorage.getItem('sharepoint_access_token');
    
    setStatus({
      calendar: googleToken ? 'connected' : 'disconnected',
      sharepoint: sharepointToken ? 'connected' : 'disconnected'
    });
  };

  const handleConfigChange = (service: 'googleCalendar' | 'sharepoint', field: string, value: boolean | string) => {
    const newConfig = {
      ...config,
      [service]: {
        ...config[service],
        [field]: value
      }
    };
    setConfig(newConfig);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      integrationService.updateConfig(config);
      // Salva anche nel localStorage per persistenza
      localStorage.setItem('integration_config', JSON.stringify(config));
      
      // Reinizializza i servizi se necessario
      if (config.googleCalendar.enabled || config.sharepoint.enabled) {
        await integrationService.initializeServices();
      }
      
      checkConnectionStatus();
    } catch (error) {
      console.error('Errore salvataggio configurazione:', error);
    } finally {
      setSaving(false);
    }
  };

  const connectService = async (service: 'calendar' | 'sharepoint') => {
    setStatus(prev => ({ ...prev, [service]: 'connecting' }));
    
    try {
      if (service === 'calendar') {
        // Implementa connessione Google Calendar
        window.open('https://accounts.google.com/oauth/authorize?...', '_blank');
      } else {
        // Implementa connessione SharePoint
        window.open('https://login.microsoftonline.com/...', '_blank');
      }
    } catch (error) {
      console.error(`Errore connessione ${service}:`, error);
      setStatus(prev => ({ ...prev, [service]: 'disconnected' }));
    }
  };

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusText = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected':
        return 'Connesso';
      case 'connecting':
        return 'Connessione...';
      default:
        return 'Disconnesso';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Settings className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Impostazioni Integrazione</h3>
      </div>

      <div className="space-y-6">
        {/* Google Calendar */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">Google Calendar</h4>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.calendar)}
              <span className="text-sm text-gray-600">{getStatusText(status.calendar)}</span>
              {status.calendar === 'disconnected' && (
                <button
                  onClick={() => connectService('calendar')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Connetti
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.googleCalendar.enabled}
                onChange={(e) => handleConfigChange('googleCalendar', 'enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Abilita integrazione Google Calendar</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.googleCalendar.autoCreate}
                onChange={(e) => handleConfigChange('googleCalendar', 'autoCreate', e.target.checked)}
                disabled={!config.googleCalendar.enabled}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Crea automaticamente eventi per i commenti</span>
            </label>
          </div>
        </div>

        {/* SharePoint */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="text-md font-medium text-gray-900">SharePoint Excel</h4>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.sharepoint)}
              <span className="text-sm text-gray-600">{getStatusText(status.sharepoint)}</span>
              {status.sharepoint === 'disconnected' && (
                <button
                  onClick={() => connectService('sharepoint')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Connetti
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.sharepoint.enabled}
                onChange={(e) => handleConfigChange('sharepoint', 'enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Abilita integrazione SharePoint</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.sharepoint.autoUpdate}
                onChange={(e) => handleConfigChange('sharepoint', 'autoUpdate', e.target.checked)}
                disabled={!config.sharepoint.enabled}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Aggiorna automaticamente Excel per i commenti</span>
            </label>

            {config.sharepoint.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percorso file Excel (opzionale)
                </label>
                <input
                  type="text"
                  value={config.sharepoint.excelFilePath || ''}
                  onChange={(e) => handleConfigChange('sharepoint', 'excelFilePath', e.target.value)}
                  placeholder="es: Documents/TaskComments.xlsx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se vuoto, userà una lista SharePoint
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pulsante Salva */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>{saving ? 'Salvando...' : 'Salva Impostazioni'}</span>
        </button>
      </div>
    </div>
  );
};

export default IntegrationSettings;