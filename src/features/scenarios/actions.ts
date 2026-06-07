"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { projectAccessWhere, projectIdAccessWhere } from "@/server/auth/authorization";
import { requireAppIdentity } from "@/server/auth/identity";
import { db } from "@/server/db";
import { projects, scenarios } from "@/server/db/schema";
import { fetchSunTimesForLocation } from "@/server/lighting/sunTimes";
import { customScheduleInputSchema, lightingScheduleSchema } from "@/server/validation/lighting";
import {
  importedScheduleInputSchema,
  quickSaveScheduleInputSchema,
  scenarioCreateSchema,
  scenarioUpdateSchema,
} from "@/server/validation/scenario";
import { createNamedSchedule, generateCustomSchedule } from "@/utils/scheduleGenerator";
import { standardSchedules } from "@/utils/lightingStandards";
import type { ActionResult } from "@/features/projects/actions";

const quickSaveActionSchema = z.object({
  scenarioId: z.string().uuid(),
  name: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(120).optional(),
  ),
  note: z.string().trim().max(500).optional(),
});

type ZodLikeError = { flatten: () => { fieldErrors: Record<string, string[]> } };

function validationError(message: string, error: ZodLikeError): ActionResult<never> {
  return {
    ok: false,
    message,
    fieldErrors: error.flatten().fieldErrors,
  };
}

function revalidateScenarioPaths(projectId: string, scenarioId?: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  if (scenarioId) {
    revalidatePath(`/projects/${projectId}/scenarios/${scenarioId}`);
  }
}

function authorizedProjectIds(identity: Awaited<ReturnType<typeof requireAppIdentity>>) {
  return db.select({ id: projects.id }).from(projects).where(projectAccessWhere(identity));
}

async function canAccessProjectId(projectId: string): Promise<boolean> {
  const identity = await requireAppIdentity();
  const project = await db.query.projects.findFirst({
    where: projectIdAccessWhere(projectId, identity),
    columns: { id: true },
  });

  return Boolean(project);
}

async function getAuthorizedScenario(scenarioId: string) {
  const identity = await requireAppIdentity();
  return db
    .select({
      id: scenarios.id,
      projectId: scenarios.projectId,
      name: scenarios.name,
      description: scenarios.description,
      source: scenarios.source,
      presetName: scenarios.presetName,
      schedule: scenarios.schedule,
      scheduleInputs: scenarios.scheduleInputs,
    })
    .from(scenarios)
    .innerJoin(projects, eq(projects.id, scenarios.projectId))
    .where(and(eq(scenarios.id, scenarioId), projectAccessWhere(identity)))
    .limit(1)
    .then((rows) => rows.at(0) ?? null);
}

function findPreset(presetName: string) {
  return standardSchedules.find((schedule) => schedule.name === presetName) ?? null;
}

export async function createScenario(input: unknown): Promise<ActionResult<{ scenarioId: string }>> {
  const parsed = scenarioCreateSchema.safeParse(input);
  if (!parsed.success) {
    return validationError("Please fix the highlighted scenario fields.", parsed.error);
  }

  const identity = await requireAppIdentity();
  const scenario = await db.transaction(async (tx) => {
    const project = await tx.query.projects.findFirst({
      where: projectIdAccessWhere(parsed.data.projectId, identity),
      columns: { id: true },
    });

    if (!project) {
      return null;
    }

    const [createdScenario] = await tx
      .insert(scenarios)
      .values({
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        description: parsed.data.description,
        source: parsed.data.source,
        presetName: parsed.data.presetName ?? null,
        schedule: parsed.data.schedule as typeof scenarios.$inferInsert["schedule"],
        scheduleInputs: (parsed.data.scheduleInputs ?? null) as typeof scenarios.$inferInsert["scheduleInputs"],
      })
      .returning({ id: scenarios.id, projectId: scenarios.projectId });

    return createdScenario ?? null;
  });

  if (!scenario) {
    return { ok: false, message: "Unable to create scenario." };
  }

  revalidateScenarioPaths(scenario.projectId, scenario.id);
  return { ok: true, data: { scenarioId: scenario.id } };
}

export async function createScenarioFromPreset(input: {
  projectId: string;
  presetName: string;
  name?: string;
  description?: string;
}): Promise<ActionResult<{ scenarioId: string }>> {
  const preset = findPreset(input.presetName);
  if (!preset) {
    return { ok: false, message: "Preset schedule not found." };
  }

  const parsedSchedule = lightingScheduleSchema.safeParse(preset);
  if (!parsedSchedule.success) {
    return validationError("Preset schedule is invalid.", parsedSchedule.error);
  }

  return createScenario({
    projectId: input.projectId,
    name: input.name?.trim() || preset.name,
    description: input.description?.trim() || preset.description,
    source: "standard_preset",
    presetName: preset.name,
    schedule: parsedSchedule.data,
    scheduleInputs: { presetName: preset.name },
  });
}

export async function createScenarioFromCustomInputs(input: {
  projectId: string;
  name?: string;
  description?: string;
  inputs: unknown;
}): Promise<ActionResult<{ scenarioId: string }>> {
  const parsedInputs = customScheduleInputSchema.safeParse(input.inputs);
  if (!parsedInputs.success) {
    return validationError("Please fix the highlighted custom schedule fields.", parsedInputs.error);
  }

  let sunTimes;
  if (parsedInputs.data.useSunTimes && parsedInputs.data.location) {
    try {
      sunTimes = await fetchSunTimesForLocation(parsedInputs.data.location);
    } catch {
      return {
        ok: false,
        message: "Unable to fetch sunrise/sunset data for that location.",
      };
    }
  }

  const generatedPoints = generateCustomSchedule(
    parsedInputs.data.wakeTime,
    parsedInputs.data.sleepTime,
    parsedInputs.data.maxIntensity,
    parsedInputs.data.basePresetName,
    sunTimes,
  );

  const description =
    input.description?.trim() ||
    `Wake ${parsedInputs.data.wakeTime}, sleep ${parsedInputs.data.sleepTime}, max ${parsedInputs.data.maxIntensity}%`;
  const namedSchedule = createNamedSchedule(input.name?.trim() || "Custom Schedule", description, generatedPoints);
  const parsedSchedule = lightingScheduleSchema.safeParse(namedSchedule);
  if (!parsedSchedule.success) {
    return validationError("Generated custom schedule is invalid.", parsedSchedule.error);
  }

  return createScenario({
    projectId: input.projectId,
    name: namedSchedule.name,
    description: namedSchedule.description,
    source: "custom",
    schedule: parsedSchedule.data,
    scheduleInputs: parsedInputs.data,
  });
}

export async function importScenarioFromJson(input: {
  projectId: string;
  rawJson: string;
  name?: string;
}): Promise<ActionResult<{ scenarioId: string }>> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(input.rawJson);
  } catch {
    return { ok: false, message: "Imported scenario JSON is not valid JSON." };
  }

  const parsedSchedule = lightingScheduleSchema.safeParse(parsedJson);
  if (!parsedSchedule.success) {
    return validationError("Imported schedule does not match the Earthlight schedule schema.", parsedSchedule.error);
  }

  const inputMetadata = importedScheduleInputSchema.safeParse({
    importFormat: "json",
    importedAt: new Date().toISOString(),
    sourceName: parsedSchedule.data.name,
  });
  if (!inputMetadata.success) {
    return validationError("Imported schedule metadata is invalid.", inputMetadata.error);
  }

  return createScenario({
    projectId: input.projectId,
    name: input.name?.trim() || parsedSchedule.data.name,
    description: parsedSchedule.data.description,
    source: "imported",
    schedule: parsedSchedule.data,
    scheduleInputs: inputMetadata.data,
  });
}

export async function quickSaveScenario(input: unknown): Promise<ActionResult<{ scenarioId: string; projectId: string }>> {
  const parsedInput = quickSaveActionSchema.safeParse(input);
  if (!parsedInput.success) {
    return validationError("Please fix the highlighted quick-save fields.", parsedInput.error);
  }

  const sourceScenario = await getAuthorizedScenario(parsedInput.data.scenarioId);
  if (!sourceScenario) {
    return { ok: false, message: "Scenario not found." };
  }

  const parsedSchedule = lightingScheduleSchema.safeParse(sourceScenario.schedule);
  if (!parsedSchedule.success) {
    return { ok: false, message: "Source scenario schedule is invalid and cannot be quick-saved." };
  }

  const quickSaveInputs = quickSaveScheduleInputSchema.safeParse({
    note: parsedInput.data.note,
    savedFrom: "workspace",
  });
  if (!quickSaveInputs.success) {
    return validationError("Quick-save metadata is invalid.", quickSaveInputs.error);
  }

  const result = await createScenario({
    projectId: sourceScenario.projectId,
    name: parsedInput.data.name || `${sourceScenario.name} quick save`,
    description: sourceScenario.description,
    source: "quick_save",
    presetName: sourceScenario.presetName ?? undefined,
    schedule: parsedSchedule.data,
    scheduleInputs: quickSaveInputs.data,
  });

  if (result.ok === false) {
    return result;
  }

  return { ok: true, data: { scenarioId: result.data.scenarioId, projectId: sourceScenario.projectId } };
}

export async function updateScenario(
  scenarioId: string,
  input: unknown,
): Promise<ActionResult<{ scenarioId: string; projectId: string }>> {
  const parsed = scenarioUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return validationError("Please fix the highlighted scenario fields.", parsed.error);
  }

  const sourceScenario = await getAuthorizedScenario(scenarioId);
  if (!sourceScenario) {
    return { ok: false, message: "Scenario not found." };
  }

  const identity = await requireAppIdentity();
  const [scenario] = await db
    .update(scenarios)
    .set({
      projectId: sourceScenario.projectId,
      name: parsed.data.name ?? sourceScenario.name,
      description: parsed.data.description ?? sourceScenario.description,
      source: parsed.data.source ?? sourceScenario.source,
      presetName: parsed.data.presetName ?? sourceScenario.presetName,
      schedule: (parsed.data.schedule ?? sourceScenario.schedule) as typeof scenarios.$inferInsert["schedule"],
      scheduleInputs: (parsed.data.scheduleInputs ?? sourceScenario.scheduleInputs) as typeof scenarios.$inferInsert["scheduleInputs"],
    })
    .where(
      and(
        eq(scenarios.id, scenarioId),
        eq(scenarios.projectId, sourceScenario.projectId),
        inArray(scenarios.projectId, authorizedProjectIds(identity)),
      ),
    )
    .returning({ id: scenarios.id, projectId: scenarios.projectId });

  if (!scenario) {
    return { ok: false, message: "Scenario not found." };
  }

  revalidateScenarioPaths(scenario.projectId, scenario.id);
  return { ok: true, data: { scenarioId: scenario.id, projectId: scenario.projectId } };
}

export async function deleteScenario(
  scenarioId: string,
): Promise<ActionResult<{ scenarioId: string; projectId: string }>> {
  const sourceScenario = await getAuthorizedScenario(scenarioId);
  if (!sourceScenario) {
    return { ok: false, message: "Scenario not found." };
  }

  const identity = await requireAppIdentity();
  const [scenario] = await db
    .delete(scenarios)
    .where(
      and(
        eq(scenarios.id, scenarioId),
        eq(scenarios.projectId, sourceScenario.projectId),
        inArray(scenarios.projectId, authorizedProjectIds(identity)),
      ),
    )
    .returning({ id: scenarios.id, projectId: scenarios.projectId });

  if (!scenario) {
    return { ok: false, message: "Scenario not found." };
  }

  revalidateScenarioPaths(scenario.projectId, scenario.id);
  return { ok: true, data: { scenarioId: scenario.id, projectId: scenario.projectId } };
}
