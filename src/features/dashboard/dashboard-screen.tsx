"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/data/db";
import {
  CHALLENGE_STATUS_LABELS,
  SONG_STATUS_LABELS,
} from "@/domain/constants/labels";
import { LEARNING_STAGE_LABELS } from "@/domain/constants/mastery";
import { BandChallengeService } from "@/domain/services/band-challenge";
import { SongProgressService } from "@/domain/services/song-progress";
import { StatsService } from "@/domain/services/stats";
import { formatDate, formatDurationMinutes } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function DashboardScreen() {
  const bands = useLiveQuery(() => getDb().bands.toArray()) ?? [];
  const albums = useLiveQuery(() => getDb().albums.toArray()) ?? [];
  const songs = useLiveQuery(() => getDb().songs.toArray()) ?? [];
  const sessions =
    useLiveQuery(() =>
      getDb().practice_sessions.orderBy("practicedAt").reverse().toArray(),
    ) ?? [];
  const settings = useLiveQuery(() => getDb().app_settings.get("default"));

  const activeBand = bands.find((b) => b.id === settings?.activeBandId);
  const activeAlbums = activeBand
    ? albums.filter((a) => a.bandId === activeBand.id)
    : [];
  const activeAlbumIds = new Set(activeAlbums.map((a) => a.id));
  const activeSongs = songs.filter((s) => activeAlbumIds.has(s.albumId));

  const currentSong = activeBand
    ? SongProgressService.findCurrentLearningSong(activeSongs, activeAlbums)
    : SongProgressService.findCurrentLearningSong(songs, albums);

  const stats = StatsService.calculateDashboardStats(
    activeBand ? activeSongs : songs,
    sessions,
  );

  const bandProgress = BandChallengeService.calculateBandProgress(activeSongs);

  const recentSessions = sessions.slice(0, 5);
  const songTitleById = new Map(songs.map((s) => [s.id, s.title]));

  const albumsChronological = [...activeAlbums].sort((a, b) => {
    if (a.releaseYear !== b.releaseYear) return a.releaseYear - b.releaseYear;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inicio"
        description="Tu progreso de aprendizaje y la siguiente canción a practicar."
        actions={
          currentSong ? (
            <Link
              href={`/practice/new?songId=${currentSong.id}`}
              className={cn(buttonVariants())}
            >
              Practicar ahora
            </Link>
          ) : (
            <Link href="/bands" className={cn(buttonVariants())}>
              Elegir banda
            </Link>
          )
        }
      />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Challenge activo
        </h2>
        {activeBand ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/bands/${activeBand.id}`}
              className="font-heading text-xl font-semibold hover:underline"
            >
              {activeBand.name}
            </Link>
            <Badge variant="secondary">
              {CHALLENGE_STATUS_LABELS[activeBand.challengeStatus]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {bandProgress.masteredSongs}/{bandProgress.totalSongs} dominadas ·{" "}
              {bandProgress.percent}%
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay challenge activo.{" "}
            <Link href="/bands" className="text-primary underline-offset-4 hover:underline">
              Activa una banda
            </Link>{" "}
            para empezar.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Canción actual
        </h2>
        {currentSong ? (
          <div className="space-y-2">
            <Link
              href={`/songs/${currentSong.id}`}
              className="font-heading text-lg font-semibold hover:underline"
            >
              {currentSong.title}
            </Link>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {SONG_STATUS_LABELS[currentSong.status]}
              </Badge>
              <span>{LEARNING_STAGE_LABELS[currentSong.learningStage]}</span>
            </div>
            <Link
              href={`/practice/new?songId=${currentSong.id}`}
              className={cn(buttonVariants({ size: "sm" }), "inline-flex")}
            >
              Nueva sesión
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay canciones pendientes. ¡Discografía completa!
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Dominadas" value={String(stats.masteredSongs)} />
        <Kpi label="En progreso" value={String(stats.inProgressSongs)} />
        <Kpi
          label="Tiempo total"
          value={formatDurationMinutes(stats.totalPracticeMinutes)}
        />
        <Kpi label="Progreso" value={`${stats.overallProgressPercent}%`} />
      </section>

      {activeBand && albumsChronological.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">
            Discografía · {activeBand.name}
          </h2>
          <ul className="space-y-4">
            {albumsChronological.map((album) => {
              const albumSongs = songs.filter((s) => s.albumId === album.id);
              const progress =
                BandChallengeService.calculateBandProgress(albumSongs);
              return (
                <li key={album.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/albums/${album.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {album.name}{" "}
                      <span className="text-muted-foreground">
                        ({album.releaseYear})
                      </span>
                    </Link>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {progress.masteredSongs}/{progress.totalSongs} ·{" "}
                      {progress.percent}%
                    </span>
                  </div>
                  <Progress value={progress.percent} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">
            Sesiones recientes
          </h2>
          <Link
            href="/practice"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todas
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay sesiones de práctica.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentSessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {songTitleById.get(session.songId) ?? "Canción eliminada"}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(session.practicedAt, "d MMM yyyy · HH:mm")} ·{" "}
                    {LEARNING_STAGE_LABELS[session.stage]}
                  </p>
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
