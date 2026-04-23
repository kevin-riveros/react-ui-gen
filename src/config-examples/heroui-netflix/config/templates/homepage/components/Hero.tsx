import { Button } from "@heroui/react";
import { Info, Play } from "lucide-react";

import { featured } from "../data/mockData";

export const Hero = () => {
	return (
		<section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
			<img
				src={featured.backdrop}
				alt=""
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
			<div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

			<div className="relative z-10 flex h-full items-end px-[4%] pb-24 md:items-center md:pb-0">
				<div className="max-w-xl space-y-5">
					<p className="text-danger text-xs font-bold uppercase tracking-[0.2em]">
						{featured.tagline}
					</p>
					<h1 className="text-foreground text-4xl font-black tracking-tight md:text-6xl">
						{featured.title}
					</h1>
					<p className="text-ash text-base leading-relaxed text-foreground/90 line-clamp-3">
						{featured.synopsis}
					</p>
					<div className="text-muted flex items-center gap-2 text-sm">
						{featured.meta.map((tag, i) => (
							<span key={tag} className="flex items-center gap-2">
								{i > 0 && <span>·</span>}
								<span>{tag}</span>
							</span>
						))}
					</div>
					<div className="flex items-center gap-3 pt-2">
						<Button variant="primary" size="lg" className="rounded-md px-6">
							<Play className="h-5 w-5 fill-current" />
							Play
						</Button>
						<Button variant="ghost" size="lg" className="rounded-md bg-surface/50 px-6 text-foreground">
							<Info className="h-5 w-5" />
							More Info
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};
