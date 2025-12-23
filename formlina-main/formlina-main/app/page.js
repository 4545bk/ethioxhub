import HomeClient from "./HomeClient";
import ClientProvider from "./ClientProvider";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <ClientProvider>
      <HomeClient />
    </ClientProvider>
  );
}