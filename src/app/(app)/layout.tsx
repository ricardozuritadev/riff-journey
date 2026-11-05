import { AppSidebar } from "@/components/layout/app-sidebar";
import { DbGate } from "@/components/layout/db-gate";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DbGate>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 md:pt-8">
            {children}
          </main>
        </DbGate>
        <MobileNav />
      </div>
    </div>
  );
}
