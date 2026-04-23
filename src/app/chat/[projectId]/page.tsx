import { getProject } from "@/actions/get-project";
import { MainContent } from "@/app/main-content";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ prompt?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const { prompt } = await searchParams;

  let project;
  try {
    project = await getProject(projectId);
  } catch {
    redirect("/");
  }

  return <MainContent project={project} initialPrompt={prompt} />;
}
