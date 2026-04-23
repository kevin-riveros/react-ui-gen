"use server";

import { prisma } from "@/lib/prisma";
import { loadStarterFiles } from "@/lib/config/loader";
import { VirtualFileSystem } from "@/lib/file-system";

/**
 * Create a project seeded from the active config's `starterFiles.dir`
 * (an MUI `theme.js` + `App.jsx`, a Tailwind `styles/theme.css`, etc.).
 *
 * The starter files are read fresh per request so edits to the on-disk
 * folder during development show up on the next blank project without
 * restarting the server.
 */
export async function createBlankProject() {
  const fs = new VirtualFileSystem();
  for (const file of loadStarterFiles()) {
    fs.createFileWithParents(file.path, file.content);
  }

  const project = await prisma.project.create({
    data: {
      name: `Design #${~~(Math.random() * 100000)}`,
      messages: "[]",
      data: JSON.stringify(fs.serialize()),
    },
  });

  return { id: project.id, name: project.name };
}
