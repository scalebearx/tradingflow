import { AuthProvider } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
} 