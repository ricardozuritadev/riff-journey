import { AlbumDetailScreen } from "@/features/albums/album-detail-screen";

export default async function AlbumDetailPage(
  props: PageProps<"/albums/[albumId]">,
) {
  const { albumId } = await props.params;
  return <AlbumDetailScreen albumId={albumId} />;
}
