import { getReviewPageData } from "@/actions/review";
import { Header } from "@/components/layout/header";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewHistory } from "@/components/review/review-history";
import { ReviewNav } from "@/components/review/review-nav";
import { ReviewRecapCard } from "@/components/review/review-recap";
import { ReviewStage } from "@/components/review/review-stage";
import { ReviewStats } from "@/components/review/review-stats";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { toDateString } from "@/lib/date-utils";

type ReviewPageProps = {
  searchParams: Promise<{ date?: string }>;
};

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toDateString(new Date());
  }
  return value;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const date = parseDateParam(params.date);
  const { recap, review, recent } = await getReviewPageData(date);

  return (
    <>
      <Header title="Review" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <ReviewStage>
          <div className="review-reveal">
            <ReviewNav date={date} hasReview={Boolean(review)} />
          </div>

          <div className="review-reveal review-reveal-delay-1">
            <ReviewStats recap={recap} review={review} />
          </div>

          <div className="review-reveal review-reveal-delay-2 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)] lg:items-start">
            <ReviewForm key={date} date={date} review={review} />
            <div className="flex flex-col gap-4">
              <ReviewRecapCard recap={recap} />
              <ReviewHistory selectedDate={date} recent={recent} />
            </div>
          </div>
        </ReviewStage>
      </AppPageFrame>
    </>
  );
}
