import { requireUserWithProfile } from "@/lib/session";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserWithProfile();
  return <AppShell username={user.name ?? "you"}>{children}</AppShell>;
}
