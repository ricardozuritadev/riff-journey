"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/data/db";
import { createAlbum } from "@/data/repositories/album-repository";
import {
  deleteBandCascade,
  pauseActiveBand,
  setActiveBand,
} from "@/data/repositories/band-repository";
import { CHALLENGE_STATUS_LABELS } from "@/domain/constants/labels";
import {
  albumFormSchema,
  type AlbumFormValues,
} from "@/domain/schemas";
import { BandChallengeService } from "@/domain/services/band-challenge";
import { formatDate, nowIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function BandDetailScreen({ bandId }: { bandId: string }) {
  const router = useRouter();
  const [albumOpen, setAlbumOpen] = useState(false);

  const band = useLiveQuery(async () => {
    const row = await getDb().bands.get(bandId);
    return row ?? null;
  }, [bandId]);
  const albums =
    useLiveQuery(
      () => getDb().albums.where("bandId").equals(bandId).toArray(),
      [bandId],
    ) ?? [];
  const songs = useLiveQuery(() => getDb().songs.toArray()) ?? [];
  const settings = useLiveQuery(() => getDb().app_settings.get("default"));

  const sortedAlbums = [...albums].sort((a, b) => {
    if (a.releaseYear !== b.releaseYear) return a.releaseYear - b.releaseYear;
    return a.sortOrder - b.sortOrder;
  });

  const albumIds = new Set(albums.map((a) => a.id));
  const bandSongs = songs.filter((s) => albumIds.has(s.albumId));
  const progress = BandChallengeService.calculateBandProgress(bandSongs);
  const canComplete =
    progress.totalSongs > 0 &&
    progress.percent === 100 &&
    band?.challengeStatus === "active";
  const isActive = settings?.activeBandId === bandId;

  const albumForm = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema) as Resolver<AlbumFormValues>,
    defaultValues: {
      name: "",
      releaseYear: new Date().getFullYear(),
      description: "",
      artworkUrl: "",
    },
  });

  async function handleActivate() {
    try {
      await setActiveBand(bandId);
      toast.success("Challenge activado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo activar",
      );
    }
  }

  async function handlePause() {
    try {
      await pauseActiveBand(bandId);
      toast.success("Challenge pausado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo pausar",
      );
    }
  }

  async function handleComplete() {
    if (!band) return;
    try {
      const next = BandChallengeService.prepareCompleteChallenge(
        band,
        progress,
        nowIso(),
      );
      await getDb().bands.put(next);
      toast.success("¡Challenge completado!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo completar",
      );
    }
  }

  async function handleDelete() {
    try {
      await deleteBandCascade(bandId);
      toast.success("Banda eliminada");
      router.push("/bands");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar",
      );
    }
  }

  async function onCreateAlbum(values: AlbumFormValues) {
    try {
      const album = await createAlbum({
        bandId,
        name: values.name,
        releaseYear: values.releaseYear,
        description: values.description || undefined,
        artworkUrl: values.artworkUrl || undefined,
      });
      toast.success("Álbum creado");
      albumForm.reset({
        name: "",
        releaseYear: new Date().getFullYear(),
        description: "",
        artworkUrl: "",
      });
      setAlbumOpen(false);
      router.push(`/albums/${album.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear el álbum",
      );
    }
  }

  if (band === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!band) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Banda no encontrada.</p>
        <Link href="/bands" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver a bandas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={band.name}
        description={band.description}
        actions={
          <>
            <Link
              href={`/bands/${bandId}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Editar
            </Link>
            {band.challengeStatus === "active" ? (
              <Button variant="outline" onClick={() => void handlePause()}>
                Pausar
              </Button>
            ) : band.challengeStatus !== "completed" ? (
              <Button onClick={() => void handleActivate()}>
                {band.challengeStatus === "paused"
                  ? "Reanudar challenge"
                  : "Activar challenge"}
              </Button>
            ) : null}
            {canComplete ? (
              <Button variant="secondary" onClick={() => void handleComplete()}>
                Completar challenge
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" />}
              >
                Eliminar
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar banda?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se borrarán todos los álbumes, canciones y sesiones
                    asociadas. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => void handleDelete()}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <section className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant={isActive ? "default" : "secondary"}>
          {CHALLENGE_STATUS_LABELS[band.challengeStatus]}
        </Badge>
        {band.challengeStartedAt ? (
          <span className="text-muted-foreground">
            Inicio: {formatDate(band.challengeStartedAt)}
          </span>
        ) : null}
        {band.challengeCompletedAt ? (
          <span className="text-muted-foreground">
            Completado: {formatDate(band.challengeCompletedAt)}
          </span>
        ) : null}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso del challenge</span>
          <span className="tabular-nums">
            {progress.masteredSongs}/{progress.totalSongs} · {progress.percent}%
          </span>
        </div>
        <Progress value={progress.percent} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">Álbumes</h2>
          <Dialog open={albumOpen} onOpenChange={setAlbumOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              Nuevo álbum
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo álbum</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-3"
                onSubmit={albumForm.handleSubmit((v) =>
                  void onCreateAlbum(v),
                )}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="album-name">Nombre</Label>
                  <Input id="album-name" {...albumForm.register("name")} />
                  {albumForm.formState.errors.name ? (
                    <p className="text-xs text-destructive">
                      {albumForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="album-year">Año</Label>
                  <Input
                    id="album-year"
                    type="number"
                    {...albumForm.register("releaseYear")}
                  />
                  {albumForm.formState.errors.releaseYear ? (
                    <p className="text-xs text-destructive">
                      {albumForm.formState.errors.releaseYear.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="album-desc">Descripción</Label>
                  <Textarea
                    id="album-desc"
                    rows={2}
                    {...albumForm.register("description")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="album-art">URL de imagen</Label>
                  <Input
                    id="album-art"
                    type="url"
                    {...albumForm.register("artworkUrl")}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={albumForm.formState.isSubmitting}
                >
                  Crear álbum
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {sortedAlbums.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Esta banda aún no tiene álbumes.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sortedAlbums.map((album) => {
              const albumSongs = songs.filter((s) => s.albumId === album.id);
              const albumProgress =
                BandChallengeService.calculateBandProgress(albumSongs);
              return (
                <li key={album.id} className="py-3">
                  <Link
                    href={`/albums/${album.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 hover:underline"
                  >
                    <span className="font-medium">
                      {album.name}{" "}
                      <span className="text-muted-foreground">
                        ({album.releaseYear})
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {albumProgress.masteredSongs}/{albumProgress.totalSongs} ·{" "}
                      {albumProgress.percent}%
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
