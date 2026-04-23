"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateMeta } from "@/lib/templates/loader";
import { createFromTemplate } from "@/actions/create-from-template";
import { createBlankProject } from "@/actions/create-blank-project";
import Link from "next/link";
import Image from "next/image";
import { getBrand } from "@/lib/config/client";

const brand = getBrand();

interface RecentProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface HomePageProps {
  templates: TemplateMeta[];
  recentProjects?: RecentProject[];
}

/**
 * Fallback glyph for any template that omits the optional `icon` field in
 * its `meta.json`. Deliberately generic so the picker still renders when
 * a template skips the icon.
 */
const FALLBACK_TEMPLATE_ICON = "📄";

function timeAgo(date: string | Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function HomePage({ templates, recentProjects = [] }: HomePageProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);

  const handleStartFromPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading("prompt");
    try {
      const project = await createBlankProject();
      router.push(`/chat/${project.id}?prompt=${encodeURIComponent(prompt.trim())}`);
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  const handleTemplateClick = async (slug: string) => {
    setLoading(slug);
    try {
      const project = await createFromTemplate(slug);
      router.push(`/chat/${project.id}`);
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartFromPrompt();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="h-14 flex items-center px-6 border-b border-neutral-200/60">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo/UIGen.svg"
                alt={brand.name}
                width={337}
                height={83}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            What do you want to{" "}
            <span className="italic text-blue-600">build</span>?
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            {brand.tagline}
          </p>
        </div>

        {/* Prompt Input */}
        <div className="relative bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the page you want to build..."
            rows={3}
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              Press Enter to start
            </span>
            <button
              onClick={handleStartFromPrompt}
              disabled={!prompt.trim() || loading === "prompt"}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading === "prompt" ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Build now
              {loading !== "prompt" && <span>▶</span>}
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mt-14">
          <p className="text-sm text-gray-400 text-center mb-6">
            or start from a template
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {templates.map((template) => (
              <button
                key={template.slug}
                onClick={() => handleTemplateClick(template.slug)}
                disabled={loading !== null}
                className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === template.slug ? (
                  <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <span className="text-xl">
                    {template.icon ?? FALLBACK_TEMPLATE_ICON}
                  </span>
                )}
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900">
                    {template.name}
                  </span>
                  <p className="text-xs text-gray-500 max-w-[200px] truncate">
                    {template.description}
                  </p>
                </div>
              </button>
            ))}
            <button
              onClick={async () => {
                setLoading("blank");
                try {
                  const project = await createBlankProject();
                  router.push(`/chat/${project.id}`);
                } catch (err) {
                  console.error(err);
                  setLoading(null);
                }
              }}
              disabled={loading !== null}
              className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "blank" ? (
                <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <span className="text-xl">✨</span>
              )}
              <div className="text-left">
                <span className="text-sm font-medium text-gray-900">Blank Canvas</span>
                <p className="text-xs text-gray-500">Start from scratch</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (() => {
          const hasMore = recentProjects.length > 4;
          const visibleProjects = showAllProjects ? recentProjects : recentProjects.slice(0, hasMore ? 4 : recentProjects.length);

          return (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Recent Projects
              </h2>
              <div className="relative">
                <div className="flex flex-col gap-2">
                  {visibleProjects.map((project, index) => {
                    const isTeaser = !showAllProjects && hasMore && index === 3;
                    return (
                      <Link
                        key={project.id}
                        href={`/chat/${project.id}`}
                        className={`flex items-center justify-between px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group ${
                          isTeaser ? "max-h-[36px] overflow-hidden blur-[2px] pointer-events-none" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 block truncate">
                            {project.name}
                          </span>
                          <span className="text-xs text-gray-400 mt-0.5 block" suppressHydrationWarning>
                            {new Date(project.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4" suppressHydrationWarning>
                          {timeAgo(project.updatedAt)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {hasMore && !showAllProjects && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setShowAllProjects(true)}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      View all projects
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      <footer className="py-8 text-center text-sm text-gray-500">
        Built by{" "}
        <a
          href="https://www.linkedin.com/in/kevin-riveros/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-blue-600 transition-colors underline underline-offset-2"
        >
          Kevin Riveros
        </a>
        <span className="mx-2 text-gray-300">·</span>
        <a
          href="https://github.com/kevin-riveros"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-blue-600 transition-colors underline underline-offset-2"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
