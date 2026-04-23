import { topTen } from "../data/mockData";

export const TopTenRow = () => {
	return (
		<section className="space-y-3 px-[4%] py-6">
			<h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
				Top 10 in the U.S. Today
			</h2>
			<div className="scrollbar-none -mx-[4%] flex gap-3 overflow-x-auto px-[4%] pb-8">
				{topTen.map((show) => (
					<article
						key={show.id}
						className="relative flex shrink-0 items-center gap-0"
					>
						<span
							className="text-foreground/90 font-black leading-[0.8] tracking-tighter"
							style={{
								fontSize: "clamp(7rem, 14vw, 11rem)",
								WebkitTextStroke: "2px var(--color-foreground)",
								color: "transparent",
							}}
							aria-hidden="true"
						>
							{show.rank}
						</span>
						<div className="relative -ml-6 h-[180px] w-[120px] overflow-hidden rounded-sm bg-surface md:h-[220px] md:w-[148px]">
							<img
								src={show.image}
								alt={show.title}
								className="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
					</article>
				))}
			</div>
		</section>
	);
};
