import { readStore } from "@/lib/db";
import HomeConsole from "@/components/HomeConsole";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await readStore();
  return <HomeConsole initialData={store} />;
}

