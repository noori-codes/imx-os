import { Header } from "@/components/layout/header";
import { ReviewSkeleton } from "@/components/review/review-skeleton";

export default function ReviewLoading() {
  return (
    <>
      <Header title="Review" />
      <ReviewSkeleton />
    </>
  );
}
