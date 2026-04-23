import { CastSection } from "./components/CastSection";
import { CinematicHero } from "./components/CinematicHero";
import { EpisodeList } from "./components/EpisodeList";
import { Footer } from "./components/Footer";
import { MoreLikeThis } from "./components/MoreLikeThis";
import { Navbar } from "./components/Navbar";
import "./index.css";

export const App = () => {
	return (
		<div className="dark min-h-screen bg-background text-foreground">
			<Navbar />
			<main>
				<CinematicHero />
				<EpisodeList />
				<CastSection />
				<MoreLikeThis />
			</main>
			<Footer />
		</div>
	);
};
