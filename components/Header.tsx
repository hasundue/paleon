const id = Deno.env.get("DEPLOYMENT_ID") ?? "dev";

const pages = [
  { name: "Home", href: "/", emoji: "🏠" },
  { name: "App", href: `/paleon/${id}`, emoji: "🔎" },
  { name: "Doc", href: "/doc", emoji: "📚" },
  { name: "GitHub", href: "https://github.com/hasundue/paleon", emoji: "📜" },
] as const;

type Page = typeof pages[number]["name"];

type NavProps = {
  current?: Page;
};

export default function Header(props: NavProps) {
  return (
    <header style="padding-bottom: 0">
      <nav>
        {pages.map((page) => (
          <a
            href={page.href}
            class={page.name === props.current ? "current" : ""}
          >
            {page.emoji} {page.name}
          </a>
        ))}
      </nav>
    </header>
  );
}
