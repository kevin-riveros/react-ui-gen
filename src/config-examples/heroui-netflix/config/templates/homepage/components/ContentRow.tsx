import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type ContentRowProps = {
	title: string;
	children: ReactNode;
};

export const ContentRow = ({ title, children }: ContentRowProps) => {
	return (
		<section className="space-y-3 px-[4%] py-6">
			<a
				href="#"
				className="group flex w-fit items-center gap-1 text-foreground"
			>
				<h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
				<ChevronRight className="h-5 w-5 text-danger opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
			</a>
			<div className="scrollbar-none -mx-[4%] flex gap-2 overflow-x-auto px-[4%] pb-24">
				{children}
			</div>
		</section>
	);
};
