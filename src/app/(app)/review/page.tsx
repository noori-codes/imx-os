import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function ReviewPage() {
  return (
    <>
      <Header title="Review" description="Daily reflection and review" />
      <PagePlaceholder
        title="Daily Review"
        description="Phase 10 will guide you through an end-of-day reflection: what went well, what to improve, and tomorrow's focus."
      />
    </>
  );
}
