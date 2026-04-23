import { footerLinks } from "../data/mockData";

const SOCIAL = [
	{ slug: "facebook", label: "Facebook", href: "#fb" },
	{ slug: "instagram", label: "Instagram", href: "#ig" },
	{ slug: "x", label: "X", href: "#x" },
	{ slug: "youtube", label: "YouTube", href: "#yt" },
];

export const Footer = () => {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-separator/40 mt-24 px-[4%] py-12 text-sm text-muted">
			<div className="mx-auto max-w-6xl space-y-8">
				<div className="flex gap-6">
					{SOCIAL.map((s) => (
						<a
							key={s.slug}
							href={s.href}
							aria-label={s.label}
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							<img
								src={`https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${s.slug}.svg`}
								alt=""
								width={20}
								height={20}
								className="h-5 w-5 invert"
							/>
						</a>
					))}
				</div>

				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{footerLinks.map((link) => (
						<a key={link} href="#" className="hover:text-foreground transition-colors">
							{link}
						</a>
					))}
				</div>

				<div className="flex flex-col gap-3 pt-4">
					<button className="w-fit border border-border px-3 py-1 text-xs text-muted hover:text-foreground transition-colors">
						Service Code
					</button>
					<p className="text-xs">© {year} Netflix-style demo. Built with HeroUI.</p>
				</div>
			</div>
		</footer>
	);
};
