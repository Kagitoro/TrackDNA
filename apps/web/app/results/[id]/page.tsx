import { ResultsClient } from "../../../components/ResultsClient";
import { TopNav } from "../../../components/TopNav";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="shell">
      <TopNav />
      <ResultsClient id={id} />
    </main>
  );
}
