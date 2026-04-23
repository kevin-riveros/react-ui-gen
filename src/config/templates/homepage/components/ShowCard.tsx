type ShowCardProps = {
	title: string;
	image: string;
	match?: number;
	year?: number;
	rating?: string;
	genres?: string[];
	progress?: number;
	episode?: string;
};

export const ShowCard = ({
	title,
	image,
	match,
	year,
	rating,
	genres,
	progress,
	episode,
}: ShowCardProps) => {
	return (
		<article className="group relative w-[220px] shrink-0 md:w-[260px]">
			<div className="relative aspect-video overflow-hidden rounded-sm bg-surface transition-transform duration-300 group-hover:scale-[1.08] origin-left">
				<img
					src={image}
					alt={title}
					className="h-full w-full object-cover"
					loading="lazy"
				/>
				{typeof progress === "number" && (
					<div className="absolute inset-x-0 bottom-0 h-1 bg-surface-elevated/70">
						<div
							className="h-full bg-danger"
							style={{ width: `${progress}%` }}
						/>
					</div>
				)}
			</div>

			<div className="pointer-events-none absolute left-0 right-0 top-full z-10 mt-1 origin-top scale-y-0 rounded-sm bg-surface p-3 opacity-0 shadow-lg transition-all duration-200 group-hover:pointer-events-auto group-hover:scale-y-100 group-hover:opacity-100">
				<h3 className="text-foreground text-sm font-semibold">{title}</h3>
				<div className="text-muted mt-1 flex flex-wrap items-center gap-1.5 text-xs">
					{typeof match === "number" && (
						<span className="text-success font-semibold">{match}% Match</span>
					)}
					{rating && <span className="border border-border px-1 text-[10px]">{rating}</span>}
					{year && <span>{year}</span>}
					{episode && <span>{episode}</span>}
				</div>
				{genres && (
					<p className="text-muted mt-1 text-xs">
						{genres.map((g, i) => (
							<span key={g}>
								{i > 0 && <span className="px-1.5">·</span>}
								{g}
							</span>
						))}
					</p>
				)}
			</div>
		</article>
	);
};
