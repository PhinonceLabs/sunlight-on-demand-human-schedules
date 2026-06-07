import { notFound } from "next/navigation";
import { z } from "zod";
import { getProjectForCurrentIdentity } from "@/features/projects/queries";
import { ProjectWorkspaceClient } from "@/features/projects/components/ProjectWorkspaceClient";
import { listRoiSnapshotsForScenario } from "@/features/roi/queries";
import { listReportSnapshotsForScenario } from "@/features/reports/queries";
import { getScenarioForProject, listScenariosForProject } from "@/features/scenarios/queries";

export const runtime = "nodejs";

type ScenarioPageProps = {
  params: Promise<{ projectId: string; scenarioId: string }>;
};

const scenarioPageParamsSchema = z.object({
  projectId: z.string().uuid(),
  scenarioId: z.string().uuid(),
});

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const parsedParams = scenarioPageParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    notFound();
  }

  const { projectId, scenarioId } = parsedParams.data;
  const [project, scenario] = await Promise.all([
    getProjectForCurrentIdentity(projectId),
    getScenarioForProject(projectId, scenarioId),
  ]);

  if (!project || !scenario) {
    notFound();
  }

  const [scenarios, roiSnapshots, reportSnapshots] = await Promise.all([
    listScenariosForProject(project.id),
    listRoiSnapshotsForScenario(project.id, scenario.id),
    listReportSnapshotsForScenario(project.id, scenario.id),
  ]);

  return (
    <ProjectWorkspaceClient
      project={project}
      scenarios={scenarios}
      scenario={scenario}
      roiSnapshots={roiSnapshots}
      reportSnapshots={reportSnapshots}
    />
  );
}
