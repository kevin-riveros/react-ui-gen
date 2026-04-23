import { Button } from "@heroui/react";
import { Check, Play, Plus, ThumbsUp } from "lucide-react";

import { show } from "../data/mockData";

export const CinematicHero = () => {
	return (
		<section className="relative h-screen min-h-[680px] w-full overflow-hidden">
			<img
				src={show.backdrop}
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
			<div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background/95 via-background/50 to-transparent" />

			<div className="relative z-10 flex h-full items-end px-[4%] pb-20">
				<div className="max-w-2xl space-y-6">
					<p className="text-danger flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
						<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-danger" />
						{show.releaseLabel}
					</p>

					<div className="space-y-1">
						<p className="text-muted text-sm font-medium uppercase tracking-widest">
							{show.season}
						</p>
						<h1 className="text-foreground text-5xl font-black tracking-tight md:text-7xl">
							{show.title}
						</h1>
						<p className="text-foreground/80 text-lg italic">{show.tagline}</p>
					</div>

					<div className="text-muted flex flex-wrap items-center gap-2 text-sm">
						<span className="text-success font-semibold">{show.match}% Match</span>
						<span>·</span>
						<span>{show.year}</span>
						<span>·</span>
						<span className="border border-border px-1.5 text-xs">{show.rating}</span>
						<span>·</span>
						<span>{show.seasons} Seasons</span>
						<span>·</span>
						<span>{show.genres.join(", ")}</span>
					</div>

					<p className="text-foreground/90 max-w-xl text-base leading-relaxed">
						{show.synopsis}
					</p>

					<div className="flex flex-wrap items-center gap-3 pt-2">
						<Button variant="primary" size="lg" className="rounded-md px-6">
							<Play className="h-5 w-5 fill-current" />
							Play
						</Button>
						<Button
							variant="ghost"
							size="lg"
							className="rounded-md bg-surface/60 px-6 text-foreground"
						>
							<Plus className="h-5 w-5" />
							My List
						</Button>
						<Button
							isIconOnly
							variant="ghost"
							size="lg"
							aria-label="Rate"
							className="rounded-full border border-border bg-surface/60"
						>
							<ThumbsUp className="h-5 w-5" />
						</Button>
						<Button
							isIconOnly
							variant="ghost"
							size="lg"
							aria-label="Watched"
							className="rounded-full border border-border bg-surface/60"
						>
							<Check className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};
