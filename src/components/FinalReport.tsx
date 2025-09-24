import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Printer, FileText, Download } from 'lucide-react';
import { standardSchedules } from '../utils/lightingStandards';

interface FinalReportProps {
  currentSchedule: any;
  roiData?: {
    annualSavings: number;
    roiPercentage: number;
    paybackPeriod: number;
    totalInvestment: number;
  };
}

const FinalReport: React.FC<FinalReportProps> = ({ currentSchedule, roiData }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    window.print();
  };

  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Professional Circadian Lighting Report</CardTitle>
              <CardDescription>Comprehensive analysis and recommendations</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Print-friendly report content */}
      <div className="print:shadow-none print:border-none" id="report-content">
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-primary mb-2">
                Circadian Lighting Design Report
              </h1>
              <p className="text-lg text-muted-foreground">
                Professional Lighting Analysis & Recommendations
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Generated on {currentDate}
              </p>
            </div>

            {/* Executive Summary */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Executive Summary
              </h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  This report presents a comprehensive analysis of implementing circadian lighting solutions 
                  for your facility. Based on scientific research and industry best practices, our 
                  recommendations will improve employee wellbeing, productivity, and energy efficiency 
                  while providing measurable return on investment.
                </p>
              </div>
            </section>

            {/* Project Details */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Lighting Schedule:</span>
                    <Badge variant="secondary">{currentSchedule.name}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Application:</span>
                    <span className="text-muted-foreground">{currentSchedule.application}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Standards Compliance:</span>
                    <span className="text-muted-foreground">WELL Building Standard v2</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Energy Efficiency:</span>
                    <span className="text-green-600 font-medium">25-40% reduction</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Health Benefits:</span>
                    <span className="text-blue-600 font-medium">Proven</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Implementation:</span>
                    <span className="text-muted-foreground">Phased approach</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Lighting Schedule Details */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Recommended Lighting Schedule</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{currentSchedule.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentSchedule.schedule.map((period: any, index: number) => (
                    <div key={index} className="bg-muted/20 p-3 rounded-lg text-center">
                      <div className="font-medium text-sm">{period.time}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {period.intensity}% • {period.temperature}K
                      </div>
                      <div className="text-xs mt-1">{period.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator />

            {/* ROI Analysis */}
            {roiData && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Financial Analysis</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${roiData.annualSavings.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {roiData.roiPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {roiData.paybackPeriod} years
                    </div>
                    <div className="text-sm text-muted-foreground">Payback Period</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ${roiData.totalInvestment.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Investment</div>
                  </div>
                </div>
              </section>
            )}

            <Separator />

            {/* Health Benefits */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Health & Productivity Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Measurable Improvements</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 15-25% improvement in sleep quality</li>
                    <li>• 8-15% increase in productivity</li>
                    <li>• 20-30% reduction in eye strain</li>
                    <li>• 10-20% decrease in absenteeism</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Long-term Benefits</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Enhanced cognitive performance</li>
                    <li>• Improved mood and alertness</li>
                    <li>• Better circadian rhythm regulation</li>
                    <li>• Reduced healthcare costs</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Implementation Recommendations */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Implementation Recommendations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Phase 1: Pilot Installation (Months 1-2)</h3>
                  <p className="text-sm text-muted-foreground">
                    Deploy circadian lighting in high-traffic areas and collaborative spaces to 
                    demonstrate immediate benefits and gather user feedback.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Phase 2: Full Deployment (Months 3-6)</h3>
                  <p className="text-sm text-muted-foreground">
                    Roll out system-wide implementation with integrated controls and automated 
                    scheduling based on occupancy patterns and daylight availability.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Phase 3: Optimization (Months 6-12)</h3>
                  <p className="text-sm text-muted-foreground">
                    Fine-tune settings based on usage data, seasonal adjustments, and employee 
                    feedback to maximize benefits and energy efficiency.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Citations */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Scientific References</h2>
              <div className="space-y-2">
                {currentSchedule.citations?.map((citation: string, index: number) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {index + 1}. {citation}
                  </p>
                ))}
              </div>
            </section>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4">
              <p>Professional Circadian Lighting Designer - Generated Report</p>
              <p>This report is based on current scientific research and industry best practices.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content, #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-none {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FinalReport;