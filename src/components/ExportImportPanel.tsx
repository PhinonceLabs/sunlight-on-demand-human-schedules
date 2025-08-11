import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload, FileText, Code, ExternalLink } from 'lucide-react';
import { LightingSchedule } from '../utils/lightingStandards';
import { format } from 'date-fns';

interface ExportImportPanelProps {
  currentSchedule: LightingSchedule | null;
  onImportSchedule: (schedule: LightingSchedule) => void;
}

const ExportImportPanel: React.FC<ExportImportPanelProps> = ({
  currentSchedule,
  onImportSchedule
}) => {
  const [importData, setImportData] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const { toast } = useToast();

  // Export to JSON
  const exportToJSON = () => {
    if (!currentSchedule) {
      toast({
        title: "No Schedule Available",
        description: "Please generate a lighting schedule first.",
        variant: "destructive"
      });
      return;
    }

    const exportData = {
      ...currentSchedule,
      exportedAt: new Date().toISOString(),
      version: "1.0",
      metadata: {
        tool: "Circadian Lighting Designer",
        url: window.location.origin
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighting-schedule-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Schedule Exported",
      description: "Lighting schedule has been downloaded as JSON."
    });
  };

  // Export to CSV for spreadsheet applications
  const exportToCSV = () => {
    if (!currentSchedule) {
      toast({
        title: "No Schedule Available",
        description: "Please generate a lighting schedule first.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Time', 'Intensity (%)', 'Temperature (K)', 'Color Name'];
    const rows = currentSchedule.schedule.map(point => [
      `${Math.floor(point.time)}:${String(Math.round((point.time % 1) * 60)).padStart(2, '0')}`,
      point.intensity.toString(),
      point.temperature.toString(),
      getColorTemperatureName(point.temperature)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighting-schedule-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Schedule Exported",
      description: "Lighting schedule has been downloaded as CSV."
    });
  };

  // Export to IES LM-63 format (simplified version for lighting professionals)
  const exportToIES = () => {
    if (!currentSchedule) {
      toast({
        title: "No Schedule Available",
        description: "Please generate a lighting schedule first.",
        variant: "destructive"
      });
      return;
    }

    const iesContent = `IESNA:LM-63-2002
[TEST] ${currentSchedule.name}
[TESTLAB] Circadian Lighting Designer
[TESTDATE] ${format(new Date(), 'MM/dd/yyyy')}
[MANUFAC] Custom Schedule
[LUMCAT] ${currentSchedule.name.replace(/\s+/g, '_')}
[LUMINAIRE] Circadian Lighting Schedule
[LAMP] LED
[_CIRCADIAN_SCHEDULE] ${currentSchedule.schedule.map(p => `${p.time},${p.intensity},${p.temperature}`).join(';')}
TILT=NONE
1 ${currentSchedule.schedule.length} 1 1 1 1 1 1 1
1 1 100
0 90
0
${currentSchedule.schedule.map(point => point.intensity).join(' ')}
`;

    const blob = new Blob([iesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighting-schedule-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.ies`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "IES File Exported",
      description: "Lighting schedule has been exported in IES format."
    });
  };

  // Import from JSON
  const importFromJSON = () => {
    try {
      const data = JSON.parse(importData);
      
      if (!data.name || !data.schedule || !Array.isArray(data.schedule)) {
        throw new Error('Invalid schedule format');
      }

      // Validate schedule data
      const isValidSchedule = data.schedule.every((point: any) => 
        typeof point.time === 'number' &&
        typeof point.intensity === 'number' &&
        typeof point.temperature === 'number'
      );

      if (!isValidSchedule) {
        throw new Error('Invalid schedule data points');
      }

      onImportSchedule(data);
      setImportData('');
      
      toast({
        title: "Schedule Imported",
        description: `Successfully imported "${data.name}"`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format or schedule data.",
        variant: "destructive"
      });
    }
  };

  // Send to external API (for integration with other tools)
  const sendToAPI = async () => {
    if (!currentSchedule || !apiEndpoint) {
      toast({
        title: "Missing Data",
        description: "Please provide both a schedule and API endpoint.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule: currentSchedule,
          timestamp: new Date().toISOString(),
          source: 'circadian-lighting-designer'
        })
      });

      if (response.ok) {
        toast({
          title: "API Integration Success",
          description: "Schedule sent to external system successfully."
        });
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      toast({
        title: "API Integration Failed",
        description: "Could not send schedule to external system.",
        variant: "destructive"
      });
    }
  };

  const getColorTemperatureName = (kelvin: number): string => {
    if (kelvin <= 2700) return "Warm";
    if (kelvin <= 3500) return "Warm White";
    if (kelvin <= 4500) return "Cool White";
    if (kelvin <= 5500) return "Daylight";
    if (kelvin <= 6500) return "Cool Daylight";
    return "Blue Sky";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Schedule
          </CardTitle>
          <CardDescription>
            Export your lighting schedule for use in other applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={exportToJSON} 
              variant="outline" 
              className="w-full"
              disabled={!currentSchedule}
            >
              <FileText className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              className="w-full"
              disabled={!currentSchedule}
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              onClick={exportToIES} 
              variant="outline" 
              className="w-full"
              disabled={!currentSchedule}
            >
              <Code className="h-4 w-4 mr-2" />
              IES Format
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Schedule
          </CardTitle>
          <CardDescription>
            Import a lighting schedule from JSON data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-data">JSON Data</Label>
            <Textarea
              id="import-data"
              placeholder="Paste your JSON schedule data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={6}
            />
          </div>
          <Button 
            onClick={importFromJSON}
            disabled={!importData.trim()}
            className="w-full"
          >
            Import Schedule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ExternalLink className="h-5 w-5 mr-2" />
            API Integration
          </CardTitle>
          <CardDescription>
            Send schedule data to external systems (BIM, lighting control, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">API Endpoint URL</Label>
            <Input
              id="api-endpoint"
              placeholder="https://your-system.com/api/lighting"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
          </div>
          <Button 
            onClick={sendToAPI}
            disabled={!currentSchedule || !apiEndpoint}
            className="w-full"
          >
            Send to External System
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportImportPanel;