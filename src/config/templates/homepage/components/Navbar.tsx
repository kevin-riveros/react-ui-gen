import { Avatar, Button } from "@heroui/react";
import { Bell, ChevronDown, Search } from "lucide-react";

import { navLinks } from "../data/mockData";

export const Navbar = () => {
	return (
		<header className="bg-gradient-to-b from-background via-background/80 to-transparent fixed inset-x-0 top-0 z-50">
			<nav className="flex items-center justify-between px-[4%] py-4">
				<div className="flex items-center gap-8">
					<a href="#" aria-label="Netflix" className="text-danger font-black tracking-tight text-2xl">
						NETFLIX
					</a>
					<ul className="hidden md:flex items-center gap-5">
						{navLinks.map((link) => (
							<li key={link.label}>
								<a
									href={link.href}
									className={
										link.active
											? "text-foreground text-sm font-medium"
											: "text-muted hover:text-foreground text-sm transition-colors"
									}
								>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</div>

				<div className="flex items-center gap-4">
					<Button isIconOnly variant="ghost" size="sm" aria-label="Search">
						<Search className="h-4 w-4" />
					</Button>
					<a href="#kids" className="hidden lg:inline text-foreground text-sm">
						Kids
					</a>
					<Button isIconOnly variant="ghost" size="sm" aria-label="Notifications">
						<Bell className="h-4 w-4" />
					</Button>
					<button className="flex items-center gap-1.5 group" aria-label="Profile">
						<Avatar size="sm" color="accent" className="h-8 w-8 rounded-sm">
							<Avatar.Fallback>R</Avatar.Fallback>
						</Avatar>
						<ChevronDown className="h-3.5 w-3.5 text-foreground transition-transform group-hover:rotate-180" />
					</button>
				</div>
			</nav>
		</header>
	);
};
