import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { Header } from "@/components/layout/header";

export default function CalendarLoading() {
  return (
    <>
      <Header chrome title="Calendar" />
      <CalendarSkeleton />
    </>
  );
}
