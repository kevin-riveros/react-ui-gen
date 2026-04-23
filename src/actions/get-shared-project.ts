"use server";

import { prisma } from "@/lib/prisma";

export async function getSharedProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    id: project.id,
    name: project.name,
    data: JSON.parse(project.data),
    createdAt: project.createdAt,
  };
}
