import { SongDetailScreen } from "@/features/songs/song-detail-screen";

export default async function SongDetailPage(
  props: PageProps<"/songs/[songId]">,
) {
  const { songId } = await props.params;
  return <SongDetailScreen songId={songId} />;
}
