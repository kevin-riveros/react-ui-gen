import { Avatar, Button, Card, Chip } from "@heroui/react";
import { MessageCircle, Pencil, Star } from "lucide-react";
import "./index.css";

const STATS = [
  { label: "Reviews", value: "312" },
  { label: "Rating", value: "4.93" },
  { label: "Years hosting", value: "7" },
];

const HIGHLIGHTS = [
  { icon: "🏡", label: "Superhost" },
  { icon: "🗣️", label: "Speaks English, Spanish" },
  { icon: "📍", label: "Lives in Barcelona, Spain" },
  { icon: "🎓", label: "Where I went to school: UPC" },
];

const REVIEWS = [
  {
    author: "Marta",
    date: "October 2025",
    location: "Paris, France",
    body: "Sofía was an incredible host — thoughtful check-in notes, sparkling clean apartment, and stellar neighborhood tips. Already planning a return trip.",
    avatar: "https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    author: "James",
    date: "September 2025",
    location: "Austin, TX",
    body: "The place matched the photos perfectly. Sofía responded within minutes whenever we had a question. Ten out of ten, would book again.",
    avatar: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    author: "Yuki",
    date: "August 2025",
    location: "Tokyo, Japan",
    body: "Loved the terrace and the quiet street. Felt like a local for a week thanks to Sofía's hand-drawn map of coffee shops.",
    avatar: "https://images.pexels.com/photos/3280130/pexels-photo-3280130.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

const LISTINGS = [
  {
    title: "Sunlit loft in Gràcia",
    price: "€142 / night",
    rating: "4.95",
    reviews: 212,
    image: "https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    title: "Rooftop studio near Sagrada",
    price: "€118 / night",
    rating: "4.91",
    reviews: 168,
    image: "https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    title: "Seaside cabin in Sitges",
    price: "€176 / night",
    rating: "4.88",
    reviews: 94,
    image: "https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

const Stat = ({ label, value }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-4">
    <span className="text-2xl font-semibold tracking-tight">{value}</span>
    <span className="text-xs uppercase tracking-wide text-muted">
      {label}
    </span>
  </div>
);

const Highlight = ({ icon, label }) => (
  <li className="flex items-center gap-3 text-sm text-neutral-700">
    <span className="text-lg leading-none">{icon}</span>
    <span>{label}</span>
  </li>
);

const ReviewCard = ({ author, date, location, body, avatar }) => (
  <Card className="h-full">
    <Card.Content className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <Avatar.Image src={avatar} alt={author} />
          <Avatar.Fallback>{author[0]}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{author}</span>
          <span className="text-xs text-neutral-500">{location}</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-neutral-700">{body}</p>
      <span className="text-xs text-neutral-400">{date}</span>
    </Card.Content>
  </Card>
);

const ListingCard = ({ title, price, rating, reviews, image }) => (
  <Card className="overflow-hidden">
    <img
      src={image}
      alt={title}
      className="h-40 w-full object-cover"
    />
    <Card.Content className="flex flex-col gap-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="flex items-center gap-1 text-xs text-neutral-600">
          ★ {rating}
        </span>
      </div>
      <span className="text-xs text-neutral-500">
        {reviews} reviews
      </span>
      <span className="mt-2 text-sm font-semibold">{price}</span>
    </Card.Content>
  </Card>
);

export const App = () => {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar size="lg" className="h-20 w-20 text-2xl">
              <Avatar.Image
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Sofía Martín"
              />
              <Avatar.Fallback>SM</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Sofía Martín
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Superhost
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Host on Airbnb since 2018 · Barcelona, Spain
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <Button variant="primary">
              <Pencil className="h-4 w-4" />
              Edit profile
            </Button>
          </div>
        </header>

        <Card>
          <Card.Content className="flex flex-col divide-y divide-separator p-0 md:flex-row md:divide-x md:divide-y-0">
            {STATS.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </Card.Content>
        </Card>

        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <aside>
            <Card shadow="none" className="bg-surface-secondary">
              <Card.Content className="flex flex-col gap-5 p-6">
                <h2 className="text-lg font-semibold">About Sofía</h2>
                <ul className="flex flex-col gap-3">
                  {HIGHLIGHTS.map((item) => (
                    <Highlight key={item.label} {...item} />
                  ))}
                </ul>
              </Card.Content>
            </Card>
          </aside>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Sofía's bio</h2>
            <p className="text-sm leading-relaxed text-neutral-700">
              Hi! I'm Sofía — born and raised in Barcelona, obsessed with
              finding the quiet corners of a noisy city. When I'm not
              hosting, I'm probably biking along the coast, chasing a
              new espresso bar, or replanning my tiny terrace garden.
              I believe a great stay starts with a great welcome, so I
              personalize recommendations for every guest based on what
              brings them to town.
            </p>
            <p className="text-sm leading-relaxed text-neutral-700">
              Book with confidence — I respond within the hour and I've
              hosted guests from 40+ countries.
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">
              Reviews · {REVIEWS.length}
            </h2>
            <Button variant="light" size="sm">
              Show all
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((review) => (
              <ReviewCard key={review.author} {...review} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">
              Listings · {LISTINGS.length}
            </h2>
            <Button variant="light" size="sm">
              View all
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LISTINGS.map((listing) => (
              <ListingCard key={listing.title} {...listing} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};
