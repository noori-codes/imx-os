import Link from "next/link";

import { GoalsStage } from "@/components/goals/goals-stage";
import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/shared/empty-state";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <>
      <Header chrome title="Project" />
      <AppPageFrame>
        <GoalsStage>
          <EmptyState
            glyph="folder"
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
