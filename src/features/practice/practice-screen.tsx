"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/data/db";
import { LEARNING_STAGE_LABELS } from "@/domain/constants/mastery";
import { formatDate, formatDurationMinutes } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function PracticeScreen() {
  const sessions =
    useLiveQuery(() =>
      getDb()
        .practice_sessions.orderBy("practicedAt")
        .reverse()
        .toArray(),
    ) ?? [];
  const songs = useLiveQuery(() => getDb().songs.toArray()) ?? [];
  const songTitleById = new Map(songs.map((s) => [s.id, s.title]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Práctica"
        description="Historial global de sesiones de ensayo."
        actions={
          <Link href="/practice/new" className={cn(buttonVariants())}>
            Nueva sesión
          </Link>
        }
      />

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no has registrado sesiones. Empieza con una canción del
          challenge activo.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-baseline justify-between gap-3 py-3"
            >
              <div className="space-y-1">
                <Link
                  href={`/songs/${session.songId}`}
                  className="font-medium hover:underline"
                >
                  {songTitleById.get(session.songId) ?? "Canción eliminada"}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {formatDate(session.practicedAt, "d MMM yyyy · HH:mm")}
                  </span>
                  <Badge variant="outline">
                    {LEARNING_STAGE_LABELS[session.stage]}
                  </Badge>
                  {session.isSatisfactoryFullPerformance ? (
                    <Badge variant="secondary">Satisfactoria</Badge>
                  ) : null}
                </div>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatDurationMinutes(session.durationMinutes)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
