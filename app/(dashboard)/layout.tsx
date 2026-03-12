import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-56">
        <Header />
        <main className="mx-auto max-w-6xl p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
