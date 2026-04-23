import { ContentRow } from "./components/ContentRow";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { ShowCard } from "./components/ShowCard";
import { TopTenRow } from "./components/TopTenRow";
import {
	continueWatching,
	newReleases,
	trending,
} from "./data/mockData";
import "./index.css";

export const App = () => {
	return (
		<div className="dark min-h-screen bg-background text-foreground">
			<Navbar />
			<main>
				<Hero />

				<div className="relative z-20 -mt-24 space-y-2 pb-12">
					<ContentRow title="Continue Watching">
						{continueWatching.map((show) => (
							<ShowCard key={show.id} {...show} />
						))}
					</ContentRow>

					<ContentRow title="Trending Now">
						{trending.map((show) => (
							<ShowCard key={show.id} {...show} />
						))}
					</ContentRow>

					<TopTenRow />

					<ContentRow title="New Releases">
						{newReleases.map((show) => (
							<ShowCard key={show.id} {...show} />
						))}
					</ContentRow>
				</div>
			</main>
			<Footer />
		</div>
	);
};
