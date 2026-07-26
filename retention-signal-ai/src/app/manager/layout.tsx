import { ManagerLayout } from "@/components/manager/manager-layout";
import { ManagerProtectedRoute } from "@/components/manager/manager-protected-route";

// PRD §2: All /manager/* routes use ManagerLayout with ManagerSidebar
// PRD §3: ManagerProtectedRoute enforces role = 'manager' only
export default function ManagerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ManagerProtectedRoute>
      <ManagerLayout>{children}</ManagerLayout>
    </ManagerProtectedRoute>
  );
}
