import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { FocusAudioHost } from "@/components/focus/focus-audio-host";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/components/providers/user-provider";
import { getCurrentUser } from "@/lib/auth";

const ImxChat = dynamic(
  () =>
    import("@/components/ai/imx-chat").then((m) => ({
      default: m.ImxChat,
    })),
  { loading: () => null },
);

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UserProvider email={user.email ?? null}>
      <FocusAudioHost />
      <div className="flex min-h-svh">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </div>
      </div>
      <MobileTabBar />
      <ImxChat />
    </UserProvider>
  );
}
