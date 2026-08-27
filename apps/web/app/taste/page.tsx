import { Metric } from "../../components/Metric";
import { TopNav } from "../../components/TopNav";

export default function TastePage() {
  return (
    <main className="shell">
      <TopNav />
      <section className="panel">
        <h1>My Taste</h1>
        <p className="muted">MVP placeholder for learned preference visualization.</p>
        <Metric label="Delayed bass entry" value={0.91} />
        <Metric label="Rolling bass" value={0.88} />
        <Metric label="Straight kick" value={0.84} />
        <Metric label="Dark sound" value={0.73} />
        <Metric label="Melody density" value={0.21} />
      </section>
    </main>
  );
}
