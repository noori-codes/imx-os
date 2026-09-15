import { Suspense } from "react";
import type { Metadata } from "next";

import { getReviewPageData } from "@/actions/review";
import { Header } from "@/components/layout/header";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewHistory } from "@/components/review/review-history";
import { ReviewPulse } from "@/components/review/review-pulse";
import { ReviewRecapCard } from "@/components/review/review-recap";
import { ReviewSkeleton } from "@/components/review/review-skeleton";
import { ReviewStage } from "@/components/review/review-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { toDateString } from "@/lib/date-utils";

export const metadata: Metadata = {
  title: "Review",
  description: "Daily reflection and recap",
};

type ReviewPageProps = {
  searchParams: Promise<{ date?: string }>;
};

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toDateString(new Date());
  }
  return value;
}

async function ReviewBody({ date }: { date: string }) {
  const { recap, review, recent } = await getReviewPageData(date);

  return (
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <ReviewStage>
        <div className="review-reveal">
          <ReviewPulse date={date} recap={recap} review={review} />
        </div>

        <div className="review-reveal review-reveal-delay-1 border-t border-border/30 pt-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)] lg:items-start">
            <ReviewForm key={date} date={date} review={review} />
            <div className="flex flex-col gap-4">
              <ReviewRecapCard recap={recap} />
              <ReviewHistory selectedDate={date} recent={recent} />
            </div>
          </div>
        </div>
      </ReviewStage>
    </AppPageFrame>
  );
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const date = parseDateParam(params.date);

  return (
    <>
      <Header chrome title="Review" />
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewBody date={date} />
      </Suspense>
    </>
  );
}
