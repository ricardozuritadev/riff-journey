"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/data/db";
import { setActiveBand } from "@/data/repositories/band-repository";
import { CHALLENGE_STATUS_LABELS } from "@/domain/constants/labels";
import { BandChallengeService } from "@/domain/services/band-challenge";
import { cn } from "@/lib/utils";

export function BandsScreen() {
  const bands = useLiveQuery(() => getDb().bands.orderBy("createdAt").reverse().toArray()) ?? [];
  const albums = useLiveQuery(() => getDb().albums.toArray()) ?? [];
  const songs = useLiveQuery(() => getDb().songs.toArray()) ?? [];
  const settings = useLiveQuery(() => getDb().app_settings.get("default"));

  async function handleActivate(bandId: string) {
    try {
      await setActiveBand(bandId);
      toast.success("Challenge activado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo activar el challenge",
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bandas"
        description="Elige un challenge y sigue el dominio de su discografía."
        actions={
          <Link href="/bands/new" className={cn(buttonVariants())}>
            Nueva banda
          </Link>
        }
      />

      {bands.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay bandas. Crea la primera para empezar tu journey.
        </p>
      ) : (
        <ul className="space-y-6">
          {bands.map((band) => {
            const bandAlbumIds = new Set(
              albums.filter((a) => a.bandId === band.id).map((a) => a.id),
            );
            const bandSongs = songs.filter((s) => bandAlbumIds.has(s.albumId));
            const progress = BandChallengeService.calculateBandProgress(bandSongs);
            const isActive = settings?.activeBandId === band.id;

            return (
              <li key={band.id} className="space-y-2 border-t border-border pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/bands/${band.id}`}
                        className="font-heading text-lg font-semibold hover:underline"
                      >
                        {band.name}
                      </Link>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {CHALLENGE_STATUS_LABELS[band.challengeStatus]}
                      </Badge>
                      {isActive ? (
                        <Badge variant="outline">Activa</Badge>
                      ) : null}
                    </div>
                    {band.description ? (
                      <p className="max-w-xl text-sm text-muted-foreground">
                        {band.description}
                      </p>
                    ) : null}
                  </div>
                  {band.challengeStatus === "paused" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleActivate(band.id)}
                    >
                      Reanudar
                    </Button>
                  ) : band.challengeStatus === "not_started" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleActivate(band.id)}
                    >
                      Activar challenge
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {progress.masteredSongs}/{progress.totalSongs} canciones
                    dominadas
                  </span>
                  <span className="tabular-nums">{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
