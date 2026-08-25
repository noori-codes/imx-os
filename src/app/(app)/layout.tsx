import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FocusAudioHost } from "@/components/focus/focus-audio-host";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/components/providers/user-provider";
import { getCurrentUser } from "@/lib/auth";

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
    </UserProvider>
  );
}
