import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lightbulb, Sparkles, Activity, Zap, Plus, Trash2 } from 'lucide-react';

// Spectral / quality model for a light source.
// melanopicRatio (M/P ratio per CIE S 026): higher = more circadian potency at a given lux.
// dynamic: schedule changes throughout day. tunable: spectrum can change but isn't scheduled biologically.
export interface LightSource {
  id: string;
  name: string;
  type: 'static' | 'tunable-nonbio' | 'dynamic-circadian';
  cct: string;            // e.g. "4000K" or "2700-6500K"
  cri: number;            // 0-100
  r9: number;             // deep red rendering, 0-100
  melanopicRatio: number; // M/P ratio
  efficacy: number;       // lumens / watt
  flickerPct: number;     // % flicker (lower = better)
  costPerFixture: number; // USD
  notes?: string;
}

const PRESETS: LightSource[] = [
  {
    id: 'fl-t8',
    name: 'Legacy Fluorescent T8 (4100K)',
    type: 'static',
    cct: '4100K',
    cri: 75,
    r9: 15,
    melanopicRatio: 0.62,
    efficacy: 85,
    flickerPct: 30,
    costPerFixture: 120,
    notes: 'Baseline workplace lighting. Poor R9, noticeable flicker.',
  },
  {
    id: 'led-static',
    name: 'Standard LED Panel (4000K, static)',
    type: 'static',
    cct: '4000K',
    cri: 82,
    r9: 25,
    melanopicRatio: 0.65,
    efficacy: 130,
    flickerPct: 8,
    costPerFixture: 180,
    notes: 'Common spec-grade office LED. Single fixed spectrum.',
  },
  {
    id: 'led-tunable',
    name: 'Tunable White LED (non-biological)',
    type: 'tunable-nonbio',
    cct: '2700-6500K',
    cri: 90,
    r9: 50,
    melanopicRatio: 0.85,
    efficacy: 110,
    flickerPct: 5,
    costPerFixture: 320,
    notes: 'User-adjusted CCT, not scheduled. Better CRI, no circadian programming.',
  },
  {
    id: 'earthlight',
    name: 'Earthlight Dynamic Circadian',
    type: 'dynamic-circadian',
    cct: '1800-6500K',
    cri: 95,
    r9: 85,
    melanopicRatio: 1.10,
    efficacy: 120,
    flickerPct: 1,
    costPerFixture: 450,
    notes: 'Automated spectral & intensity schedule aligned to circadian biology.',
  },
];

// Research-derived scaling factors keyed to source type.
// These multiply the headline ROI gains (productivity, absenteeism, turnover) used elsewhere in the app.
const HUMAN_IMPACT_FACTOR: Record<LightSource['type'], number> = {
  'static': 0.0,                 // baseline – no circadian benefit
  'tunable-nonbio': 0.35,        // some benefit from better spectrum/CRI, no biological timing
  'dynamic-circadian': 1.0,      // full modeled benefit
};

interface Props {
  employees?: number;
  averageSalary?: number;
  fixtureCount?: number;
}

const LightSourceComparison: React.FC<Props> = ({
  employees: empProp,
  averageSalary: salProp,
  fixtureCount: fixProp,
}) => {
  const [employees, setEmployees] = useState(empProp ?? 100);
  const [averageSalary, setAverageSalary] = useState(salProp ?? 65000);
  const [fixtureCount, setFixtureCount] = useState(fixProp ?? 200);
  const [hoursPerDay, setHoursPerDay] = useState(10);
  const [energyRate, setEnergyRate] = useState(0.14); // $/kWh
  const [wattsPerFixture, setWattsPerFixture] = useState(40);

  const [selected, setSelected] = useState<Record<string, boolean>>({
    'led-static': true,
    'led-tunable': true,
    'earthlight': true,
  });

  const sources = PRESETS;

  const rows = useMemo(() => {
    const totalLabor = employees * averageSalary;
    // Headline annual human-impact ceiling (matches ROI tab assumptions: 8% prod + ~ absenteeism + turnover)
    const fullHumanCeiling = totalLabor * 0.12;

    return sources
      .filter(s => selected[s.id])
      .map(s => {
        const capex = s.costPerFixture * fixtureCount;
        const kWhPerYear = (wattsPerFixture / 1000) * hoursPerDay * 250 * fixtureCount;
        // Efficacy correction relative to 100 lm/W baseline
        const efficacyAdj = 100 / s.efficacy;
        const annualEnergyCost = kWhPerYear * energyRate * efficacyAdj;

        const humanImpactSavings = fullHumanCeiling * HUMAN_IMPACT_FACTOR[s.type];
        const netAnnual = humanImpactSavings - annualEnergyCost;
        const payback = netAnnual > 0 ? capex / netAnnual : Infinity;

        // Composite quality score (0-100) weighted toward biological + visual quality
        const qualityScore = Math.round(
          s.cri * 0.25 +
          s.r9 * 0.15 +
          Math.min(s.melanopicRatio / 1.2, 1) * 100 * 0.35 +
          Math.min(s.efficacy / 150, 1) * 100 * 0.15 +
          Math.max(0, 100 - s.flickerPct * 2) * 0.10
        );

        return {
          source: s,
          capex,
          annualEnergyCost,
          humanImpactSavings,
          netAnnual,
          payback,
          qualityScore,
        };
      });
  }, [sources, selected, employees, averageSalary, fixtureCount, hoursPerDay, energyRate, wattsPerFixture]);

  const fmt = (n: number) =>
    isFinite(n)
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
      : '—';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Light Source Comparison
          </CardTitle>
          <CardDescription>
            Compare static, tunable (non-biological), and dynamic circadian sources across spectral quality,
            energy, and human-impact ROI. Use this to show clients comparative data side-by-side.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Employees</Label>
            <Input type="number" value={employees} onChange={e => setEmployees(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Avg. Salary ($)</Label>
            <Input type="number" value={averageSalary} onChange={e => setAverageSalary(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Fixture Count</Label>
            <Input type="number" value={fixtureCount} onChange={e => setFixtureCount(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Watts / Fixture</Label>
            <Input type="number" value={wattsPerFixture} onChange={e => setWattsPerFixture(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Hours / Day</Label>
            <Input type="number" value={hoursPerDay} onChange={e => setHoursPerDay(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Energy Rate ($/kWh)</Label>
            <Input type="number" step="0.01" value={energyRate} onChange={e => setEnergyRate(parseFloat(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Sources to Compare</CardTitle>
          <CardDescription>Toggle any combination of fixture types.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map(s => (
            <label
              key={s.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer"
            >
              <Checkbox
                checked={!!selected[s.id]}
                onCheckedChange={(v) => setSelected(prev => ({ ...prev, [s.id]: !!v }))}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{s.name}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">{s.type}</Badge>
                  <Badge variant="outline" className="text-xs">CCT {s.cct}</Badge>
                  <Badge variant="outline" className="text-xs">CRI {s.cri}</Badge>
                  <Badge variant="outline" className="text-xs">R9 {s.r9}</Badge>
                  <Badge variant="outline" className="text-xs">M/P {s.melanopicRatio.toFixed(2)}</Badge>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Comparative Analysis
            </CardTitle>
            <CardDescription>
              Quality score weights CRI, R9, melanopic ratio, efficacy, and flicker.
              Human-impact savings scale by source type (static = 0, tunable non-bio = 35%, dynamic circadian = 100%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Quality</TableHead>
                    <TableHead className="text-right">CapEx</TableHead>
                    <TableHead className="text-right">Energy / yr</TableHead>
                    <TableHead className="text-right">Human Savings / yr</TableHead>
                    <TableHead className="text-right">Net / yr</TableHead>
                    <TableHead className="text-right">Payback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.source.id}>
                      <TableCell>
                        <div className="font-medium">{r.source.name}</div>
                        <div className="text-xs text-muted-foreground">{r.source.type}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.qualityScore >= 80 ? 'default' : 'outline'}>
                          {r.qualityScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.capex)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.annualEnergyCost)}</TableCell>
                      <TableCell className="text-right font-mono text-primary">{fmt(r.humanImpactSavings)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{fmt(r.netAnnual)}</TableCell>
                      <TableCell className="text-right">
                        {isFinite(r.payback) ? `${r.payback.toFixed(1)} yrs` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 font-medium mb-1"><Zap className="h-4 w-4" /> Static</div>
                <p className="text-muted-foreground text-xs">Fixed spectrum, no circadian alignment. Lowest CapEx, no human-impact ROI.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 font-medium mb-1"><Lightbulb className="h-4 w-4" /> Tunable (non-bio)</div>
                <p className="text-muted-foreground text-xs">User-controlled CCT. Improved visual quality but limited circadian benefit without scheduling.</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 font-medium mb-1"><Sparkles className="h-4 w-4 text-primary" /> Dynamic Circadian</div>
                <p className="text-muted-foreground text-xs">Automated spectral + intensity schedule. Full modeled productivity, absenteeism, and turnover gains.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LightSourceComparison;