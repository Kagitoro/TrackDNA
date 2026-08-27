import Link from "next/link";
import { TopNav } from "../components/TopNav";

const elements = [
  ["Bass", "Rolling bass"],
  ["Melody", "Dark stab melody"],
  ["Vocals", "Short vocal hook"],
  ["Drums", "Straight kick"],
  ["Groove", "Swing groove"],
  ["FX", "Atmospheric FX"]
];

export default function HomePage() {
  return (
    <main className="shell">
      <TopNav />
      <section className="grid">
        <div className="panel">
          <div className="muted">Tech House MVP</div>
          <h1 className="hero-title">
            Find Music<br />by <span className="gradient">Drop DNA</span>
          </h1>
          <p className="muted">Choose a reference drop, inspect its structure, then find tracks with matching drop behavior.</p>
          <div className="element-grid">
            {elements.map(([title, value]) => (
              <div className="element-card" key={title}>
                <span className="gradient">≋</span>
                <strong>{title}</strong>
                <div className="pill-row"><span className="pill">{value}</span></div>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="button primary" href="/discover">Find your Tech House sound</Link>
            <Link className="button" href="/review">Review Drops</Link>
          </div>
        </div>
        <div className="panel">
          <h2>Reference Drop</h2>
          <div className="waveform" />
          <div className="dna-card">
            <strong>Low-end entry</strong>
            <p className="muted">Detect whether full kick + bass starts immediately or enters after tension.</p>
          </div>
        </div>
        <div className="panel">
          <h2>Best Matches</h2>
          {[94, 91, 89].map((score, index) => (
            <div className="result-card" key={score}>
              <div className="art" />
              <div>
                <strong>{["Night Driver", "Dirty Signal", "Low End Theory"][index]}</strong>
                <div className="muted">128-131 BPM · E min</div>
                <div className="pill-row">
                  <span className="pill">Rolling bass</span>
                  <span className="pill">Delayed drop</span>
                </div>
              </div>
              <div className="match">{score}%</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
