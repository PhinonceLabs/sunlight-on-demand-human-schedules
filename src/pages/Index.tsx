
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, BarChart3, Info, Lightbulb, Download, Folder, Plug, DollarSign, FileText, Sparkles } from 'lucide-react';
import CustomizationPanel from '../components/CustomizationPanel';
import LightingSchedule from '../components/LightingSchedule';
import ScheduleVisualizer from '../components/ScheduleVisualizer';
import ResearchInfo from '../components/ResearchInfo';
import ExportImportPanel from '../components/ExportImportPanel';
import ProjectManager from '../components/ProjectManager';
import ProfessionalIntegrations from '../components/ProfessionalIntegrations';
import ROICalculator from '../components/ROICalculator';
import FinalReport from '../components/FinalReport';
import LightSourceComparison from '../components/LightSourceComparison';
import { standardSchedules, LightingSchedule as LightingScheduleType } from '../utils/lightingStandards';

const Index = () => {
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [customSchedule, setCustomSchedule] = useState<LightingScheduleType | null>(null);
  const [roiData, setRoiData] = useState<any>(null);

  const activeSchedule = customSchedule || standardSchedules[currentScheduleIndex];

  const handleImportSchedule = (schedule: LightingScheduleType) => {
    setCustomSchedule(schedule);
  };

  const handleLoadProject = (project: any) => {
    setCustomSchedule(project.schedule);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Earthlight
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Science-based lighting schedules for architecture and lighting professionals. 
            Integrate with your existing workflow and export to industry-standard formats.
          </p>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <Card>
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="visualizer" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Visualizer
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center">
                <Folder className="h-4 w-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center">
                <Plug className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="roi" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                ROI
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Compare
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Research
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <CustomizationPanel 
                onScheduleChange={setCurrentScheduleIndex}
                onCustomScheduleChange={setCustomSchedule}
                currentScheduleIndex={currentScheduleIndex}
              />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <LightingSchedule />
            </TabsContent>

            <TabsContent value="visualizer" className="space-y-4">
              <ScheduleVisualizer schedule={activeSchedule.schedule} />
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <ProjectManager 
                currentSchedule={activeSchedule}
                onLoadProject={handleLoadProject}
              />
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <ExportImportPanel 
                currentSchedule={activeSchedule}
                onImportSchedule={handleImportSchedule}
              />
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <ProfessionalIntegrations currentSchedule={activeSchedule} />
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <ROICalculator onROICalculated={setRoiData} />
            </TabsContent>

            <TabsContent value="compare" className="space-y-4">
              <LightSourceComparison />
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              <ResearchInfo currentSchedule={activeSchedule} />
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <FinalReport currentSchedule={activeSchedule} roiData={roiData} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
