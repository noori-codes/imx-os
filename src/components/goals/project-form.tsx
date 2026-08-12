"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { createProject, type ProjectActionState } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProjectFormProps = {
  goalId: string;
};

export function ProjectForm({ goalId }: ProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const createProjectForGoal = createProject.bind(null, goalId);
  const [state, formAction, pending] = useActionState<
    ProjectActionState | null,
    FormData
  >(createProjectForGoal, null);

  useEffect(() => {
    if (state && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-title">New project</Label>
          <Input
            id="project-title"
            name="title"
            placeholder="e.g. Build MVP"
            required
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="project-description">Description (optional)</Label>
          <Textarea
            id="project-description"
            name="description"
            placeholder="Scope for this project"
            rows={2}
          />
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          <Plus className="size-4" />
          {pending ? "Adding..." : "Add project"}
        </Button>
      </div>

      {state?.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
