import { ReviewClient } from "../../components/ReviewClient";
import { TopNav } from "../../components/TopNav";

export default function ReviewPage() {
  return (
    <main className="shell">
      <TopNav />
      <ReviewClient />
    </main>
  );
}
