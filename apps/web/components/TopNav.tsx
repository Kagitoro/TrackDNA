import Link from "next/link";

export function TopNav() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        Track<span>DNA</span>
      </Link>
      <nav className="nav">
        <Link className="button" href="/discover">Discover</Link>
        <Link className="button" href="/review">Review</Link>
        <Link className="button" href="/taste">My Taste</Link>
      </nav>
    </header>
  );
}
