import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { GoalsStage } from "@/components/goals/goals-stage";
import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <>
      <Header chrome title="Project" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <GoalsStage>
          <EmptyState
            icon={FolderKanban}
            title="Project not found"
            description="This project may have been deleted or you don’t have access."
            className="py-20"
          >
            <Button asChild className="mt-5">
              <Link href="/goals">Back to goals</Link>
            </Button>
          </EmptyState>
        </GoalsStage>
      </AppPageFrame>
    </>
  );
}
