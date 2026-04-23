import { getSharedProject } from "@/actions/get-shared-project";
import { ShareContent } from "./share-content";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function SharePage({ params }: PageProps) {
  const { projectId } = await params;

  let project;
  try {
    project = await getSharedProject(projectId);
  } catch {
    redirect("/");
  }

  return <ShareContent project={project} />;
}
