import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Users, Clock, HeartHandshake, Brain } from 'lucide-react';

interface ROIInputs {
  employees: number;
  averageSalary: number;
  lightingCost: number;
  currentAbsenteeism: number; // days per year
  currentTurnover: number; // percentage
}

interface ROIResults {
  productivityGain: number;
  reducedAbsenteeism: number;
  reducedTurnover: number;
  energySavings: number;
  totalAnnualSavings: number;
  roiPercentage: number;
  paybackPeriod: number;
}

const ROICalculator = () => {
  const [inputs, setInputs] = useState<ROIInputs>({
    employees: 100,
    averageSalary: 65000,
    lightingCost: 50000,
    currentAbsenteeism: 8,
    currentTurnover: 15
  });

  const [results, setResults] = useState<ROIResults | null>(null);

  const calculateROI = () => {
    // Research-based improvement metrics
    const productivityIncrease = 0.08; // 8% productivity increase (WELL Building Standard)
    const absenteeismReduction = 0.25; // 25% reduction in sick days (Harvard T.H. Chan School)
    const turnoverReduction = 0.20; // 20% reduction in turnover (Stanford research)
    const energyEfficiency = 0.30; // 30% energy savings (LED + controls)

    const totalLaborCost = inputs.employees * inputs.averageSalary;
    
    // Calculate annual savings
    const productivityGain = totalLaborCost * productivityIncrease;
    
    const absenteeismCostPerDay = inputs.averageSalary / 250; // 250 working days
    const currentAbsenteeismCost = inputs.employees * inputs.currentAbsenteeism * absenteeismCostPerDay;
    const reducedAbsenteeism = currentAbsenteeismCost * absenteeismReduction;
    
    const turnoverCostPerEmployee = inputs.averageSalary * 0.75; // 75% of annual salary
    const currentTurnoverCost = inputs.employees * (inputs.currentTurnover / 100) * turnoverCostPerEmployee;
    const reducedTurnover = currentTurnoverCost * turnoverReduction;
    
    const currentEnergyBudget = inputs.lightingCost * 0.40; // 40% of lighting cost is energy
    const energySavings = currentEnergyBudget * energyEfficiency;
    
    const totalAnnualSavings = productivityGain + reducedAbsenteeism + reducedTurnover + energySavings;
    const roiPercentage = ((totalAnnualSavings - inputs.lightingCost) / inputs.lightingCost) * 100;
    const paybackPeriod = inputs.lightingCost / totalAnnualSavings;

    setResults({
      productivityGain,
      reducedAbsenteeism,
      reducedTurnover,
      energySavings,
      totalAnnualSavings,
      roiPercentage,
      paybackPeriod
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary" />
            Circadian Lighting ROI Calculator
          </CardTitle>
          <CardDescription>
            Calculate the financial return on investment for implementing circadian lighting systems.
            Based on peer-reviewed research showing significant impacts on productivity, health, and energy costs.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
            <CardDescription>
              Enter your organization's details for accurate ROI calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employees">Number of Employees</Label>
              <Input
                id="employees"
                type="number"
                value={inputs.employees}
                onChange={(e) => setInputs({...inputs, employees: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Average Annual Salary ($)</Label>
              <Input
                id="salary"
                type="number"
                value={inputs.averageSalary}
                onChange={(e) => setInputs({...inputs, averageSalary: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lightingCost">Lighting System Investment ($)</Label>
              <Input
                id="lightingCost"
                type="number"
                value={inputs.lightingCost}
                onChange={(e) => setInputs({...inputs, lightingCost: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="absenteeism">Current Sick Days per Employee/Year</Label>
              <Input
                id="absenteeism"
                type="number"
                value={inputs.currentAbsenteeism}
                onChange={(e) => setInputs({...inputs, currentAbsenteeism: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="turnover">Current Annual Turnover Rate (%)</Label>
              <Input
                id="turnover"
                type="number"
                value={inputs.currentTurnover}
                onChange={(e) => setInputs({...inputs, currentTurnover: parseInt(e.target.value) || 0})}
                className="w-full"
              />
            </div>

            <Button onClick={calculateROI} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Calculate ROI
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Impact Analysis</CardTitle>
              <CardDescription>
                Annual savings and return on investment based on research data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{results.roiPercentage.toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">Annual ROI</div>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{results.paybackPeriod.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Years Payback</div>
                </div>
              </div>

              <Separator />

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-primary" />
                  Human Impact Savings
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Productivity Increase (8%)</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.productivityGain)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <HeartHandshake className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Reduced Sick Days (25%)</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.reducedAbsenteeism)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Reduced Turnover (20%)</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.reducedTurnover)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Energy Savings (30%)</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {formatCurrency(results.energySavings)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-semibold">
                  <span>Total Annual Savings</span>
                  <Badge className="font-mono text-lg px-3 py-1">
                    {formatCurrency(results.totalAnnualSavings)}
                  </Badge>
                </div>
              </div>

              {/* Research Citations */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Research Foundation</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Harvard T.H. Chan School: 25% reduction in sick building syndrome</li>
                  <li>• WELL Building Standard: 8% productivity increase</li>
                  <li>• Stanford Research: 20% reduction in employee turnover</li>
                  <li>• DOE Studies: 30% energy savings with smart lighting controls</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ROICalculator;