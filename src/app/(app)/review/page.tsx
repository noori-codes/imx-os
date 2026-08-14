import { getReviewPageData } from "@/actions/review";
import { Header } from "@/components/layout/header";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewHistory } from "@/components/review/review-history";
import { ReviewNav } from "@/components/review/review-nav";
import { ReviewRecapCard } from "@/components/review/review-recap";
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
      <Header
        title="Review"
        description="End-of-day reflection and recap"
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ReviewNav date={date} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <ReviewForm key={date} date={date} review={review} />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <ReviewRecapCard recap={recap} />
            <ReviewHistory selectedDate={date} recent={recent} />
          </div>
        </div>
      </div>
    </>
  );
}
