import { redirect } from "next/navigation";

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
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex min-h-screen flex-1 flex-col">{children}</div>
      </div>
    </UserProvider>
  );
}
