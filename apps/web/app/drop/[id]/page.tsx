import { DropClient } from "../../../components/DropClient";
import { TopNav } from "../../../components/TopNav";

export default async function DropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="shell">
      <TopNav />
      <DropClient id={id} />
    </main>
  );
}
