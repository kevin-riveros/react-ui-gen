import { Avatar } from "@heroui/react";

import { cast } from "../data/mockData";

export const CastSection = () => {
	return (
		<section className="space-y-6 px-[4%] py-12">
			<h2 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
				Cast
			</h2>

			<ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
				{cast.map((member) => (
					<li key={member.name} className="flex flex-col items-center gap-3 text-center">
						<Avatar size="lg" className="h-24 w-24">
							<Avatar.Image src={member.avatar} alt={member.name} />
							<Avatar.Fallback>
								{member.name
									.split(" ")
									.map((w) => w[0])
									.join("")}
							</Avatar.Fallback>
						</Avatar>
						<div className="space-y-0.5">
							<p className="text-foreground text-sm font-semibold">{member.name}</p>
							<p className="text-muted text-xs">{member.role}</p>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
};
