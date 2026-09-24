import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DeferredImxChat } from "@/components/ai/deferred-imx-chat";
import { DeferredQuickCapture } from "@/components/capture/deferred-quick-capture";
import { FocusAudioHost } from "@/components/focus/focus-audio-host";
import { CaptureHotkey } from "@/components/layout/capture-hotkey";
import { ClientShell } from "@/components/layout/client-shell";
import { IdleRoutePrefetch } from "@/components/layout/idle-route-prefetch";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { TimezoneSync } from "@/components/layout/timezone-sync";
import { UserProvider } from "@/components/providers/user-provider";
import { getCurrentUser } from "@/lib/auth";
import {
  resolveAvatarUrl,
  resolveDisplayName,
  resolveInitials,
} from "@/lib/display-name";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UserProvider
      email={user.email ?? null}
      name={resolveDisplayName(user)}
      initials={resolveInitials(user)}
      avatarUrl={resolveAvatarUrl(user)}
    >
      <TimezoneSync />
      <SkipToContent />
      <FocusAudioHost />
      <IdleRoutePrefetch />
      <CaptureHotkey />
      <ClientShell>
        <div className="flex min-h-svh">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex min-h-svh min-w-0 flex-1 flex-col">
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <main
              id="main-content"
              className="flex min-h-0 min-w-0 flex-1 flex-col"
            >
              {children}
            </main>
          </div>
        </div>
        <MobileTabBar />
        <DeferredQuickCapture />
        <DeferredImxChat />
      </ClientShell>
    </UserProvider>
  );
}
