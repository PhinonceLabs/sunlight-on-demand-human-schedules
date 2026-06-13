"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { FolderKanban, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { describeActionError } from "@/features/shared/actionErrors";
import { projectTypeValues, type ProjectTypeValue } from "@/domain/constants";
import { createProject, deleteProject, updateProject } from "../actions";
import type { ProjectSummaryDTO } from "../queries";

type ProjectFormState = {
  name: string;
  description: string;
  client: string;
  location: string;
  projectType: ProjectTypeValue;
  tags: string;
};

const emptyForm: ProjectFormState = {
  name: "",
  description: "",
  client: "",
  location: "",
  projectType: "office",
  tags: "",
};

function projectToForm(project: ProjectSummaryDTO): ProjectFormState {
  return {
    name: project.name,
    description: project.description,
    client: project.client,
    location: project.location,
    projectType: project.projectType,
    tags: project.tags.join(", "),
  };
}

function formToInput(form: ProjectFormState) {
  return {
    ...form,
    tags: form.tags,
  };
}

function projectTypeLabel(projectType: ProjectTypeValue) {
  return projectType.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function ProjectFields({
  form,
  setForm,
}: {
  form: ProjectFormState;
  setForm: (nextForm: ProjectFormState) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Acme headquarters lighting retrofit"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-client">Client</Label>
        <Input
          id="project-client"
          value={form.client}
          onChange={(event) => setForm({ ...form, client: event.target.value })}
          placeholder="Acme Corp"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-location">Location</Label>
        <Input
          id="project-location"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
          placeholder="New York, NY"
        />
      </div>
      <div className="space-y-2">
        <Label>Project type</Label>
        <Select
          value={form.projectType}
          onValueChange={(value) => setForm({ ...form, projectType: value as ProjectTypeValue })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectTypeValues.map((projectType) => (
              <SelectItem key={projectType} value={projectType}>
                {projectTypeLabel(projectType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-tags">Tags</Label>
        <Input
          id="project-tags"
          value={form.tags}
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
          placeholder="priority, retrofit, WELL"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Project goals, stakeholder notes, and site constraints."
        />
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummaryDTO }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(() => projectToForm(project));

  const updatedAt = useMemo(() => new Date(project.updatedAt).toLocaleDateString(), [project.updatedAt]);

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProject(project.id, formToInput(form));
      if (result.ok === false) {
        toast({ title: "Project update failed", description: describeActionError(result), variant: "destructive" });
        return;
      }
      toast({ title: "Project updated", description: "The database-backed project record was saved." });
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${project.name}" and all of its saved scenarios?`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.ok === false) {
        toast({ title: "Project delete failed", description: describeActionError(result), variant: "destructive" });
        return;
      }
      toast({ title: "Project deleted", description: "Project and scenario rows were removed from Postgres." });
      router.refresh();
    });
  };

  if (isEditing) {
    return (
      <Card>
        <form onSubmit={handleUpdate}>
          <CardHeader>
            <CardTitle>Edit project</CardTitle>
            <CardDescription>Only project metadata is edited here; scenarios remain separate snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectFields form={form} setForm={setForm} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-earthlight-hairline bg-card shadow-[0_1px_0_hsl(var(--el-hairline))] transition hover:shadow-[0_10px_30px_-18px_hsl(var(--el-ink)/0.25)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-sun-gradient transition-transform duration-500 group-hover:scale-y-100" />
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-earthlight-paper-deep text-earthlight-ink">
            <FolderKanban className="h-5 w-5" />
          </div>
          <Badge variant="secondary">{project.scenarioCount} scenarios</Badge>
        </div>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description || "No description yet."}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <span className="font-medium text-foreground">Client:</span> {project.client || "—"}
          </div>
          <div>
            <span className="font-medium text-foreground">Location:</span> {project.location || "—"}
          </div>
          <div>
            <span className="font-medium text-foreground">Type:</span> {projectTypeLabel(project.projectType)}
          </div>
          <div>
            <span className="font-medium text-foreground">Updated:</span> {updatedAt}
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button asChild>
          <Link href={`/projects/${project.id}`}>Open workspace</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} disabled={isPending}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit project</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete project</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function ProjectListClient({ projects }: { projects: ProjectSummaryDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ProjectFormState>(emptyForm);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createProject(formToInput(form));
      if (result.ok === false) {
        toast({ title: "Project creation failed", description: describeActionError(result), variant: "destructive" });
        return;
      }
      toast({ title: "Project created", description: "Opening the authenticated project workspace." });
      router.push(`/projects/${result.data.projectId}`);
    });
  };

  return (
    <div className="space-y-8">
      <Card className="bg-card/80 shadow-sm backdrop-blur">
        <form onSubmit={handleCreate}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New project
            </CardTitle>
            <CardDescription>
              Projects are persisted under your Clerk identity. The client never sends owner IDs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectFields form={form} setForm={setForm} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create project
            </Button>
          </CardFooter>
        </form>
      </Card>

      {projects.length === 0 ? (
        <Card className="border-dashed bg-card/70 text-center shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>Create your first authenticated project above.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
