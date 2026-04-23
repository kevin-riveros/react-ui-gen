import { getTemplates } from "@/lib/templates/loader";
import { HomePage } from "@/components/home/HomePage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const templates = getTemplates();

  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  const recentProjects = projects.map((p) => ({
    ...p,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <HomePage templates={templates} recentProjects={recentProjects} />;
}
