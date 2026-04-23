"use server";

import { prisma } from "@/lib/prisma";
import { loadTemplate } from "@/lib/templates/loader";
import { VirtualFileSystem } from "@/lib/file-system";

export async function createFromTemplate(slug: string) {
  const { files, lockedFiles } = loadTemplate(slug);

  const fs = new VirtualFileSystem();
  for (const [filePath, content] of Object.entries(files)) {
    fs.createFileWithParents(filePath, content);
  }
  for (const lockedPath of lockedFiles) {
    fs.setLocked(lockedPath, true);
  }

  const project = await prisma.project.create({
    data: {
      name: slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      messages: "[]",
      data: JSON.stringify(fs.serialize()),
    },
  });

  return { id: project.id, name: project.name };
}
