import { Button } from "@heroui/react";
import { ChevronDown, Play } from "lucide-react";

import { episodes, show } from "../data/mockData";

export const EpisodeList = () => {
	return (
		<section className="space-y-6 px-[4%] py-12">
			<header className="flex flex-wrap items-center justify-between gap-4 border-b border-separator/40 pb-4">
				<h2 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
					Episodes
				</h2>
				<Button
					variant="ghost"
					className="rounded-md border border-border px-4 text-foreground"
				>
					{show.season}
					<ChevronDown className="h-4 w-4" />
				</Button>
			</header>

			<ol className="divide-y divide-separator/40">
				{episodes.map((ep) => (
					<li
						key={ep.number}
						className="group grid grid-cols-[auto_1fr] gap-4 py-5 md:grid-cols-[48px_280px_1fr_80px] md:items-center md:gap-6"
					>
						<span className="text-muted col-span-1 text-3xl font-semibold md:text-center">
							{ep.number}
						</span>

						<div className="relative aspect-video w-full overflow-hidden rounded-sm bg-surface md:w-[280px]">
							<img
								src={ep.image}
								alt=""
								className="h-full w-full object-cover"
								loading="lazy"
							/>
							<div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 transition-opacity group-hover:opacity-100">
								<div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground">
									<Play className="h-5 w-5 fill-current text-foreground" />
								</div>
							</div>
						</div>

						<div className="col-span-2 space-y-1.5 md:col-span-1">
							<div className="flex items-baseline justify-between gap-4">
								<h3 className="text-foreground text-base font-semibold">{ep.title}</h3>
								<span className="text-muted text-sm md:hidden">{ep.duration}</span>
							</div>
							<p className="text-muted text-sm leading-relaxed line-clamp-2">
								{ep.synopsis}
							</p>
						</div>

						<span className="text-muted hidden text-sm md:block md:text-right">
							{ep.duration}
						</span>
					</li>
				))}
			</ol>
		</section>
	);
};
