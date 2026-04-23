"use server";

import type { UIMessage } from "ai";
import { prisma } from "@/lib/prisma";

interface CreateProjectInput {
  name: string;
  messages: UIMessage[];
  data: Record<string, unknown>;
}

export async function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      messages: JSON.stringify(input.messages),
      data: JSON.stringify(input.data),
    },
  });
}
