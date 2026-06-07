"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { ROI_ASSUMPTIONS, ROI_ASSUMPTIONS_VERSION } from "@/domain/roi/assumptions";
import { calculateRoiRange } from "@/domain/roi/calculator";
import { validationError, type ActionResult } from "@/features/shared/actions";
import { projectIdAccessWhere } from "@/server/auth/authorization";
import { requireAppIdentity } from "@/server/auth/identity";
import { db } from "@/server/db";
import { roiSnapshots, scenarios } from "@/server/db/schema";
import { roiSnapshotCreateSchema, roiSnapshotDataSchema } from "@/domain/validation/roi";
import type { RoiSnapshotDTO } from "./queries";

function revalidateRoiPaths(projectId: string, scenarioId?: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  if (scenarioId) {
    revalidatePath(`/projects/${projectId}/scenarios/${scenarioId}`);
  }
}

export async function calculateAndSaveRoiSnapshot(
  input: unknown,
): Promise<ActionResult<{ snapshot: RoiSnapshotDTO }>> {
  const parsed = roiSnapshotCreateSchema.safeParse(input);
  if (!parsed.success) {
    return validationError("Please fix the highlighted ROI fields.", parsed.error);
  }

  const identity = await requireAppIdentity();

  const project = await db.query.projects.findFirst({
    where: projectIdAccessWhere(parsed.data.projectId, identity),
    columns: { id: true },
  });

  if (!project) {
    return { ok: false, message: "Project or scenario not found." };
  }

  if (parsed.data.scenarioId) {
    const scenario = await db.query.scenarios.findFirst({
      where: and(
        eq(scenarios.id, parsed.data.scenarioId),
        eq(scenarios.projectId, parsed.data.projectId),
      ),
      columns: { id: true },
    });

    if (!scenario) {
      return { ok: false, message: "Project or scenario not found." };
    }
  }

  const computedSnapshot = roiSnapshotDataSchema.parse({
    inputs: parsed.data.inputs,
    assumptionsVersion: ROI_ASSUMPTIONS_VERSION,
    assumptions: ROI_ASSUMPTIONS,
    results: calculateRoiRange(parsed.data.inputs),
  });

  const [createdSnapshot] = await db
    .insert(roiSnapshots)
    .values({
      projectId: parsed.data.projectId,
      scenarioId: parsed.data.scenarioId ?? null,
      inputs: computedSnapshot.inputs,
      assumptionsVersion: computedSnapshot.assumptionsVersion,
      assumptions: computedSnapshot.assumptions,
      results: computedSnapshot.results,
    })
    .returning({
      id: roiSnapshots.id,
      projectId: roiSnapshots.projectId,
      scenarioId: roiSnapshots.scenarioId,
      inputs: roiSnapshots.inputs,
      assumptionsVersion: roiSnapshots.assumptionsVersion,
      assumptions: roiSnapshots.assumptions,
      results: roiSnapshots.results,
      createdAt: roiSnapshots.createdAt,
    });

  if (!createdSnapshot) {
    return { ok: false, message: "Project or scenario not found." };
  }

  const snapshot: RoiSnapshotDTO = {
    id: createdSnapshot.id,
    projectId: createdSnapshot.projectId,
    scenarioId: createdSnapshot.scenarioId,
    createdAt: createdSnapshot.createdAt.toISOString(),
    ...computedSnapshot,
  };

  revalidateRoiPaths(snapshot.projectId, snapshot.scenarioId ?? undefined);
  return { ok: true, data: { snapshot } };
}
