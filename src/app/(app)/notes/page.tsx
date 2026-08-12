import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function NotesPage() {
  return (
    <>
      <Header title="Notes" description="Notes and journaling" />
      <PagePlaceholder
        title="Notes & Journal"
        description="Phase 8 will bring rich-text notes and daily journal entries, searchable from one place."
      />
    </>
  );
}
