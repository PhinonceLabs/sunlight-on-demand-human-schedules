import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getProjectForCurrentIdentity } from "@/features/projects/queries";
import { ProjectWorkspaceClient } from "@/features/projects/components/ProjectWorkspaceClient";
import { getLatestScenarioForProject, listScenariosForProject } from "@/features/scenarios/queries";

export const runtime = "nodejs";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

const projectPageParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export default async function ProjectPage({ params }: ProjectPageProps) {
  const parsedParams = projectPageParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    notFound();
  }

  const { projectId } = parsedParams.data;
  const project = await getProjectForCurrentIdentity(projectId);

  if (!project) {
    notFound();
  }

  const latestScenario = await getLatestScenarioForProject(project.id);

  if (latestScenario) {
    redirect(`/projects/${project.id}/scenarios/${latestScenario.id}`);
  }

  const scenarios = await listScenariosForProject(project.id);

  return (
    <ProjectWorkspaceClient
      project={project}
      scenarios={scenarios}
      scenario={null}
      roiSnapshots={[]}
      reportSnapshots={[]}
    />
  );
}
