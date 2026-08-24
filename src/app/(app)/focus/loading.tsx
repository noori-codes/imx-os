import { FocusSkeleton } from "@/components/focus/focus-skeleton";
import { Header } from "@/components/layout/header";

export default function FocusLoading() {
  return (
    <>
      <Header title="Focus" description="One session at a time" />
      <FocusSkeleton />
    </>
  );
}
