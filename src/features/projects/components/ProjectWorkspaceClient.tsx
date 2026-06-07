"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Copy, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ExportImportPanel from "@/components/ExportImportPanel";
import LightSourceComparison from "@/components/LightSourceComparison";
import ProfessionalIntegrations from "@/components/ProfessionalIntegrations";
import ResearchInfo from "@/components/ResearchInfo";
import ScheduleVisualizer from "@/components/ScheduleVisualizer";
import { getCurrentLightSettings, formatTime } from "@/utils/scheduleGenerator";
import type { LightingSchedule } from "@/utils/lightingStandards";
import { ScenarioFormClient } from "@/features/scenarios/components/ScenarioFormClient";
import { deleteScenario, quickSaveScenario } from "@/features/scenarios/actions";
import {
  formatOptionalDecimal,
  formatOptionalNumber,
  hasDerivedLegacyDisplay,
  toLegacyDisplaySchedule,
} from "@/features/scenarios/displaySchedule";
import { ROICalculatorClient } from "@/features/roi/components/ROICalculatorClient";
import { ReportBuilderClient } from "@/features/reports/components/ReportBuilderClient";
import type { RoiSnapshotDTO } from "@/features/roi/queries";
import type { ReportSnapshotSummaryDTO } from "@/features/reports/queries";
import type { ProjectDetailDTO } from "../queries";
import type { ScenarioDetailDTO, ScenarioSummaryDTO } from "@/features/scenarios/queries";

type WorkspaceProps = {
  project: ProjectDetailDTO;
  scenarios: ScenarioSummaryDTO[];
  scenario: ScenarioDetailDTO | null;
  roiSnapshots: RoiSnapshotDTO[];
  reportSnapshots: ReportSnapshotSummaryDTO[];
};

function sourceLabel(source: ScenarioSummaryDTO["source"]) {
  return source.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function describeActionError(result: { message: string; fieldErrors?: Record<string, string[]> }) {
  const fieldMessages = Object.entries(result.fieldErrors ?? {}).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );

  return [result.message, ...fieldMessages].join("\n");
}


function ScenarioPicker({
  projectId,
  scenarios,
  activeScenarioId,
}: {
  projectId: string;
  scenarios: ScenarioSummaryDTO[];
  activeScenarioId?: string;
}) {
  const router = useRouter();

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <Select
      value={activeScenarioId}
      onValueChange={(scenarioId) => router.push(`/projects/${projectId}/scenarios/${scenarioId}`)}
    >
      <SelectTrigger className="w-full md:w-80">
        <SelectValue placeholder="Select scenario" />
      </SelectTrigger>
      <SelectContent>
        {scenarios.map((scenario) => (
          <SelectItem key={scenario.id} value={scenario.id}>
            {scenario.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScheduleTable({
  persistedSchedule,
  displaySchedule,
}: {
  persistedSchedule: ScenarioDetailDTO["schedule"];
  displaySchedule: LightingSchedule;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule points</CardTitle>
        <CardDescription>
          Persisted JSONB may include PRD exposure metrics. Legacy display values are adapted only for visualization and never written back.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Display intensity</th>
                <th className="px-4 py-3 font-medium">Display CCT</th>
                <th className="px-4 py-3 font-medium">Photopic lux</th>
                <th className="px-4 py-3 font-medium">Melanopic DER</th>
                <th className="px-4 py-3 font-medium">Melanopic EDI</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {persistedSchedule.schedule.map((point, index) => {
                const displayPoint = displaySchedule.schedule[index];
                const derivedDisplay = hasDerivedLegacyDisplay(point);

                return (
                  <tr key={`${point.time}-${index}`} className="border-t align-top">
                    <td className="px-4 py-3">{formatTime(point.time)}</td>
                    <td className="px-4 py-3">
                      {formatOptionalNumber(displayPoint?.intensity, "%")}
                      {derivedDisplay && point.intensity === undefined && (
                        <span className="ml-1 text-xs text-muted-foreground">derived</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatOptionalNumber(displayPoint?.temperature, "K")}
                      {derivedDisplay && point.temperature === undefined && (
                        <span className="ml-1 text-xs text-muted-foreground">fallback</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatOptionalNumber(point.photopicVerticalLux, " lx")}</td>
                    <td className="px-4 py-3">{formatOptionalDecimal(point.melanopicDER)}</td>
                    <td className="px-4 py-3">{formatOptionalNumber(point.melanopicEDILux, " lx")}</td>
                    <td className="px-4 py-3">
                      <div>{point.source}</div>
                      {point.notes && <div className="mt-1 text-xs text-muted-foreground">{point.notes}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectWorkspaceClient({
  project,
  scenarios,
  scenario,
  roiSnapshots,
  reportSnapshots,
}: WorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [quickSaveName, setQuickSaveName] = useState("");
  const activeSchedule = scenario ? toLegacyDisplaySchedule(scenario.schedule) : null;
  const currentSettings = useMemo(() => {
    if (!activeSchedule) {
      return null;
    }
    return getCurrentLightSettings(activeSchedule.schedule);
  }, [activeSchedule]);

  const handleQuickSave = () => {
    if (!scenario) {
      return;
    }

    const normalizedQuickSaveName = quickSaveName.trim() || undefined;

    startTransition(async () => {
      const result = await quickSaveScenario({
        scenarioId: scenario.id,
        name: normalizedQuickSaveName,
        note: "Saved from project workspace",
      });
      if (result.ok === false) {
        toast({ title: "Quick save failed", description: describeActionError(result), variant: "destructive" });
        return;
      }
      toast({ title: "Quick save created", description: "A new scenario snapshot was saved." });
      router.push(`/projects/${result.data.projectId}/scenarios/${result.data.scenarioId}`);
      router.refresh();
    });
  };

  const handleDeleteScenario = () => {
    if (!scenario || !window.confirm(`Delete scenario "${scenario.name}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteScenario(scenario.id);
      if (result.ok === false) {
        toast({ title: "Delete failed", description: describeActionError(result), variant: "destructive" });
        return;
      }
      toast({ title: "Scenario deleted", description: "The scenario snapshot was removed." });
      router.push(`/projects/${project.id}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{project.projectType}</Badge>
            <Badge variant="outline">{project.scenarioCount} scenarios</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-lumify-neutral-darker">{project.name}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {project.description || "Create and persist schedule scenarios for this authenticated project."}
          </p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <div>Client: <span className="text-foreground">{project.client || "—"}</span></div>
            <div>Location: <span className="text-foreground">{project.location || "—"}</span></div>
          </div>
        </div>
        <ScenarioPicker projectId={project.id} scenarios={scenarios} activeScenarioId={scenario?.id} />
      </div>

      {scenario && activeSchedule && currentSettings ? (
        <Card className="overflow-hidden bg-white/80 shadow-sm backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-lumify-blue-light via-lumify-blue to-lumify-blue-dark text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{scenario.name}</CardTitle>
                <CardDescription className="text-white/85">
                  {scenario.description || activeSchedule.description}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white text-lumify-blue-dark">
                  {sourceLabel(scenario.source)}
                </Badge>
                {scenario.presetName && <Badge className="bg-white/15 text-white">{scenario.presetName}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-lg border bg-background/85 p-4">
              <div className="text-sm text-muted-foreground">Current intensity</div>
              <div className="mt-1 text-2xl font-semibold">{currentSettings.intensity}%</div>
            </div>
            <div className="rounded-lg border bg-background/85 p-4">
              <div className="text-sm text-muted-foreground">Current CCT</div>
              <div className="mt-1 text-2xl font-semibold">{currentSettings.temperature}K</div>
            </div>
            <div className="rounded-lg border bg-background/85 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Snapshot updated
              </div>
              <div className="mt-1 text-lg font-semibold">{new Date(scenario.updatedAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-white/70 text-center shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>No saved scenarios yet</CardTitle>
            <CardDescription>
              Save a preset, generate a custom scenario, or import JSON to create the first persisted schedule snapshot.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue={scenario ? "schedule" : "scenarios"} className="space-y-6">
        <TabsList className="grid h-auto grid-cols-2 md:grid-cols-8">
          <TabsTrigger value="schedule" disabled={!activeSchedule}>Schedule</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="roi" disabled={!scenario}>ROI</TabsTrigger>
          <TabsTrigger value="reports" disabled={!scenario}>Reports</TabsTrigger>
          <TabsTrigger value="research" disabled={!activeSchedule}>Research</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="integrations" disabled={!activeSchedule}>Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          {activeSchedule && (
            <>
              <ScheduleVisualizer schedule={activeSchedule.schedule} />
              {scenario && <ScheduleTable persistedSchedule={scenario.schedule} displaySchedule={activeSchedule} />}
              <Card>
                <CardHeader>
                  <CardTitle>Snapshot controls</CardTitle>
                  <CardDescription>
                    Quick-save duplicates the current persisted scenario. It does not save ROI or report snapshots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={quickSaveName}
                    onChange={(event) => setQuickSaveName(event.target.value)}
                    placeholder={`${scenario?.name ?? "Scenario"} quick save`}
                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button onClick={handleQuickSave} disabled={isPending || !scenario}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                    Quick save
                  </Button>
                  <Button variant="outline" onClick={handleDeleteScenario} disabled={isPending || !scenario}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete scenario
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenarioFormClient projectId={project.id} />
        </TabsContent>

        <TabsContent value="export">
          <ExportImportPanel projectId={project.id} scenario={scenario} />
        </TabsContent>

        <TabsContent value="roi">
          {scenario && <ROICalculatorClient projectId={project.id} scenarioId={scenario.id} snapshots={roiSnapshots} />}
        </TabsContent>

        <TabsContent value="reports">
          {scenario && (
            <ReportBuilderClient
              projectId={project.id}
              scenarioId={scenario.id}
              scenarioName={scenario.name}
              roiSnapshots={roiSnapshots}
              reportSnapshots={reportSnapshots}
            />
          )}
        </TabsContent>

        <TabsContent value="research">
          {activeSchedule && <ResearchInfo currentSchedule={activeSchedule} />}
        </TabsContent>

        <TabsContent value="compare">
          <LightSourceComparison />
        </TabsContent>

        <TabsContent value="integrations">
          <ProfessionalIntegrations currentSchedule={activeSchedule} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
