import { moreLikeThis } from "../data/mockData";

export const MoreLikeThis = () => {
	return (
		<section className="space-y-6 px-[4%] py-12">
			<h2 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
				More Like This
			</h2>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{moreLikeThis.map((item) => (
					<article
						key={item.id}
						className="group overflow-hidden rounded-sm bg-surface transition-colors hover:bg-surface-secondary"
					>
						<div className="aspect-video overflow-hidden">
							<img
								src={item.image}
								alt={item.title}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								loading="lazy"
							/>
						</div>
						<div className="space-y-2 p-4">
							<div className="flex items-center justify-between gap-2">
								<span className="text-success text-xs font-semibold">
									{item.match}% Match
								</span>
								<span className="text-muted border border-border px-1 text-[10px]">
									{item.rating}
								</span>
							</div>
							<h3 className="text-foreground text-sm font-semibold">{item.title}</h3>
							<p className="text-muted text-xs">{item.year}</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
};
