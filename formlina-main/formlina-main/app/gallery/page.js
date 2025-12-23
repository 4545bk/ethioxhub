import GalleryClient from "./GalleryClient";
import ClientProvider from "../ClientProvider";

export const dynamic = "force-dynamic";

export default function Gallery() {
  return (
    <ClientProvider>
      <GalleryClient />
    </ClientProvider>
  );
}