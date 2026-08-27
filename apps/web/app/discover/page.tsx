import { DiscoverClient } from "../../components/DiscoverClient";
import { TopNav } from "../../components/TopNav";

export default function DiscoverPage() {
  return (
    <main className="shell">
      <TopNav />
      <section className="panel">
        <h1>Discover Drops</h1>
        <p className="muted">Upload licensed/local Tech House audio, create a reference drop, then find similar drops.</p>
        <div className="waveform" />
        <div className="pill-row">
          <span className="pill">Intro</span>
          <span className="pill">Build</span>
          <span className="pill">Drop</span>
          <span className="pill">Breakdown</span>
          <span className="pill">Drop 2</span>
        </div>
        <DiscoverClient />
      </section>
    </main>
  );
}
