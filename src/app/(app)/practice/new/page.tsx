import { PracticeForm } from "@/features/practice/practice-form";

export default async function NewPracticePage(
  props: PageProps<"/practice/new">,
) {
  const searchParams = await props.searchParams;
  const raw = searchParams.songId;
  const songId = typeof raw === "string" ? raw : undefined;
  return <PracticeForm songId={songId} />;
}
