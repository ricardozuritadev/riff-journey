import { BandForm } from "@/features/bands/band-form";

export default async function EditBandPage(
  props: PageProps<"/bands/[bandId]/edit">,
) {
  const { bandId } = await props.params;
  return <BandForm bandId={bandId} />;
}
