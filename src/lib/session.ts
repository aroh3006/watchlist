import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Every user-scoped server component/route calls this. Never trust a client-supplied userId. */
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireUserWithProfile() {
  const user = await requireUser();
  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, displayName: user.name ?? "Viewer" },
  });
  return { ...user, profile };
}

export async function getOptionalUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
