import { BandDetailScreen } from "@/features/bands/band-detail-screen";

export default async function BandDetailPage(
  props: PageProps<"/bands/[bandId]">,
) {
  const { bandId } = await props.params;
  return <BandDetailScreen bandId={bandId} />;
}
