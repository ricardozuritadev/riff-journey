"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDb } from "@/data/db";
import {
  changeSongStage,
  setManualMasteryCriterion,
  setSongTechniques,
} from "@/data/repositories/song-repository";
import {
  DIFFICULTY_LABELS,
  SONG_STATUS_LABELS,
} from "@/domain/constants/labels";
import {
  LEARNING_STAGES,
  LEARNING_STAGE_LABELS,
  MASTERY_CRITERIA,
} from "@/domain/constants/mastery";
import { SongMasteryService } from "@/domain/services/song-mastery";
import type { LearningStage, MasteryCriterionId } from "@/domain/types";
import { formatDate, formatDurationMinutes } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function SongDetailScreen({ songId }: { songId: string }) {
  const song = useLiveQuery(async () => {
    const row = await getDb().songs.get(songId);
    return row ?? null;
  }, [songId]);
  const album = useLiveQuery(async () => {
    if (!song) return null;
    const row = await getDb().albums.get(song.albumId);
    return row ?? null;
  }, [song]);
  const checks =
    useLiveQuery(
      () =>
        getDb().song_mastery_checks.where("songId").equals(songId).toArray(),
      [songId],
    ) ?? [];
  const sessions =
    useLiveQuery(
      () =>
        getDb()
          .practice_sessions.where("songId")
          .equals(songId)
          .toArray()
          .then((list) =>
            list.sort((a, b) => b.practicedAt.localeCompare(a.practicedAt)),
          ),
      [songId],
    ) ?? [];
  const techniques =
    useLiveQuery(() => getDb().techniques.orderBy("name").toArray()) ?? [];
  const songTechniqueIds =
    useLiveQuery(
      () =>
        getDb()
          .song_techniques.where("songId")
          .equals(songId)
          .toArray()
          .then((rows) => rows.map((r) => r.techniqueId)),
      [songId],
    ) ?? [];

  async function handleStageChange(stage: LearningStage) {
    try {
      await changeSongStage(songId, stage);
      toast.success("Etapa actualizada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cambiar la etapa",
      );
    }
  }

  async function handleCriterionToggle(
    criterionId: MasteryCriterionId,
    completed: boolean,
  ) {
    try {
      await setManualMasteryCriterion(songId, criterionId, completed);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar el criterio",
      );
    }
  }

  async function handleTechniqueToggle(techniqueId: string, enabled: boolean) {
    const next = enabled
      ? [...new Set([...songTechniqueIds, techniqueId])]
      : songTechniqueIds.filter((id) => id !== techniqueId);
    try {
      await setSongTechniques(songId, next);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudieron actualizar las técnicas",
      );
    }
  }

  if (song === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!song) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Canción no encontrada.</p>
        <Link href="/bands" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={song.title}
        description={
          album
            ? `${album.name} · pista ${song.trackNumber}`
            : `Pista ${song.trackNumber}`
        }
        actions={
          <>
            {album ? (
              <Link
                href={`/albums/${album.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Ver álbum
              </Link>
            ) : null}
            <Link
              href={`/practice/new?songId=${song.id}`}
              className={cn(buttonVariants())}
            >
              Nueva práctica
            </Link>
          </>
        }
      />

      <section className="flex flex-wrap gap-2 text-sm">
        <Badge>{SONG_STATUS_LABELS[song.status]}</Badge>
        <Badge variant="secondary">
          {LEARNING_STAGE_LABELS[song.learningStage]}
        </Badge>
        {song.difficulty ? (
          <Badge variant="outline">{DIFFICULTY_LABELS[song.difficulty]}</Badge>
        ) : null}
        {song.tuning ? (
          <span className="text-muted-foreground">Afinación: {song.tuning}</span>
        ) : null}
        {song.targetBpm ? (
          <span className="text-muted-foreground">BPM: {song.targetBpm}</span>
        ) : null}
      </section>

      {song.notes ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {song.notes}
        </p>
      ) : null}

      <section className="space-y-2">
        <Label>Etapa de aprendizaje</Label>
        <Select
          value={song.learningStage}
          onValueChange={(value) => {
            if (value) void handleStageChange(value as LearningStage);
          }}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue>
              {LEARNING_STAGE_LABELS[song.learningStage]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LEARNING_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {LEARNING_STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Criterios de dominio
        </h2>
        <ul className="space-y-3">
          {MASTERY_CRITERIA.map((criterion) => {
            const completed = SongMasteryService.getCriterionCompletion(
              criterion.id,
              checks,
              sessions,
            );
            return (
              <li key={criterion.id} className="flex items-start gap-3">
                <Checkbox
                  id={`criterion-${criterion.id}`}
                  checked={completed}
                  disabled={criterion.derived}
                  onCheckedChange={(checked) => {
                    if (criterion.derived) return;
                    void handleCriterionToggle(criterion.id, checked === true);
                  }}
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`criterion-${criterion.id}`}
                    className={cn(criterion.derived && "text-muted-foreground")}
                  >
                    {criterion.label}
                    {criterion.derived ? " (automático)" : null}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {criterion.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Técnicas</h2>
        {techniques.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay técnicas cargadas.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {techniques.map((technique) => {
              const selected = songTechniqueIds.includes(technique.id);
              return (
                <li key={technique.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tech-${technique.id}`}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      void handleTechniqueToggle(
                        technique.id,
                        checked === true,
                      );
                    }}
                  />
                  <Label htmlFor={`tech-${technique.id}`}>{technique.name}</Label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">
            Historial de práctica
          </h2>
          <Link
            href={`/practice/new?songId=${song.id}`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Añadir sesión
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay sesiones para esta canción.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formatDate(session.practicedAt, "d MMM yyyy · HH:mm")}
                  </p>
                  <p className="text-muted-foreground">
                    {LEARNING_STAGE_LABELS[session.stage]}
                    {session.isSatisfactoryFullPerformance
                      ? " · Interpretación satisfactoria"
                      : ""}
                  </p>
                  {session.notes ? (
                    <p className="mt-1 text-muted-foreground">{session.notes}</p>
                  ) : null}
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {formatDurationMinutes(session.durationMinutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
