import { FocusSkeleton } from "@/components/focus/focus-skeleton";
import { Header } from "@/components/layout/header";

export default function FocusLoading() {
  return (
    <>
      <Header title="Focus" description="Timer, sound, one session" />
      <FocusSkeleton />
    </>
  );
}
