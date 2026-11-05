"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/data/db";
import { deleteAlbumCascade } from "@/data/repositories/album-repository";
import {
  createSong,
  deleteSongCascade,
  reorderSongs,
  updateSong,
} from "@/data/repositories/song-repository";
import {
  DIFFICULTY_LABELS,
  SONG_STATUS_LABELS,
} from "@/domain/constants/labels";
import { LEARNING_STAGE_LABELS } from "@/domain/constants/mastery";
import {
  songFormSchema,
  type SongFormValues,
} from "@/domain/schemas";
import type { DifficultyLevel, Song } from "@/domain/types";
import { cn } from "@/lib/utils";

export function AlbumDetailScreen({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [songOpen, setSongOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const album = useLiveQuery(async () => {
    const row = await getDb().albums.get(albumId);
    return row ?? null;
  }, [albumId]);
  const band = useLiveQuery(async () => {
    if (!album) return null;
    const row = await getDb().bands.get(album.bandId);
    return row ?? null;
  }, [album]);
  const songs =
    useLiveQuery(async () => {
      const list = await getDb().songs.where("albumId").equals(albumId).toArray();
      return list.sort((a, b) => a.trackNumber - b.trackNumber);
    }, [albumId]) ?? [];

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema) as Resolver<SongFormValues>,
    defaultValues: defaultSongValues(songs.length + 1),
  });

  function openCreate() {
    setEditingSong(null);
    form.reset(defaultSongValues(songs.length + 1));
    setSongOpen(true);
  }

  function openEdit(song: Song) {
    setEditingSong(song);
    form.reset({
      title: song.title,
      trackNumber: song.trackNumber,
      durationSeconds: song.durationSeconds,
      tuning: song.tuning ?? "",
      targetBpm: song.targetBpm,
      difficulty: song.difficulty,
      notes: song.notes ?? "",
    });
    setSongOpen(true);
  }

  async function onSubmitSong(values: SongFormValues) {
    try {
      if (editingSong) {
        await updateSong(editingSong.id, {
          title: values.title,
          trackNumber: values.trackNumber,
          durationSeconds: values.durationSeconds,
          tuning: values.tuning || undefined,
          targetBpm: values.targetBpm,
          difficulty: values.difficulty,
          notes: values.notes || undefined,
        });
        toast.success("Canción actualizada");
      } else {
        const created = await createSong({
          albumId,
          title: values.title,
          trackNumber: values.trackNumber,
          durationSeconds: values.durationSeconds,
          tuning: values.tuning || undefined,
          targetBpm: values.targetBpm,
          difficulty: values.difficulty,
          notes: values.notes || undefined,
        });
        toast.success("Canción creada");
        setSongOpen(false);
        router.push(`/songs/${created.id}`);
        return;
      }
      setSongOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar la canción",
      );
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= songs.length) return;
    const ordered = songs.map((s) => s.id);
    const tmp = ordered[index]!;
    ordered[index] = ordered[target]!;
    ordered[target] = tmp;
    try {
      await reorderSongs(albumId, ordered);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo reordenar",
      );
    }
  }

  async function handleDeleteSong(songId: string) {
    try {
      await deleteSongCascade(songId);
      toast.success("Canción eliminada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar",
      );
    }
  }

  async function handleDeleteAlbum() {
    if (!album) return;
    try {
      const bandId = album.bandId;
      await deleteAlbumCascade(albumId);
      toast.success("Álbum eliminado");
      router.push(`/bands/${bandId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar el álbum",
      );
    }
  }

  if (album === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!album) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Álbum no encontrado.</p>
        <Link href="/bands" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={album.name}
        description={
          band
            ? `${band.name} · ${album.releaseYear}`
            : String(album.releaseYear)
        }
        actions={
          <>
            {band ? (
              <Link
                href={`/bands/${band.id}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Ver banda
              </Link>
            ) : null}
            <Button size="sm" onClick={openCreate}>
              Nueva canción
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                Eliminar álbum
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar álbum?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se borrarán todas las canciones y sesiones de este álbum.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => void handleDeleteAlbum()}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      {album.description ? (
        <p className="text-sm text-muted-foreground">{album.description}</p>
      ) : null}

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">Canciones</h2>
        {songs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este álbum aún no tiene canciones.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {songs.map((song, index) => (
              <li
                key={song.id}
                className="flex flex-wrap items-center gap-2 py-3"
              >
                <span className="w-6 text-xs tabular-nums text-muted-foreground">
                  {song.trackNumber}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <Link
                    href={`/songs/${song.id}`}
                    className="font-medium hover:underline"
                  >
                    {song.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {SONG_STATUS_LABELS[song.status]}
                    </Badge>
                    <span>{LEARNING_STAGE_LABELS[song.learningStage]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Subir"
                    disabled={index === 0}
                    onClick={() => void handleReorder(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Bajar"
                    disabled={index === songs.length - 1}
                    onClick={() => void handleReorder(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(song)}
                  >
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button size="sm" variant="ghost" />}
                    >
                      Borrar
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar canción?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se borrarán las sesiones y el progreso de dominio de «
                          {song.title}».
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => void handleDeleteSong(song.id)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={songOpen}
        onOpenChange={(open) => {
          setSongOpen(open);
          if (!open) setEditingSong(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSong ? "Editar canción" : "Nueva canción"}
            </DialogTitle>
          </DialogHeader>
          <SongFields form={form} onSubmit={onSubmitSong} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function defaultSongValues(trackNumber: number): SongFormValues {
  return {
    title: "",
    trackNumber,
    durationSeconds: undefined,
    tuning: "",
    targetBpm: undefined,
    difficulty: undefined,
    notes: "",
  };
}

function SongFields({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<SongFormValues, unknown, SongFormValues>>;
  onSubmit: (values: SongFormValues) => Promise<void>;
}) {
  const difficulty = form.watch("difficulty");

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit((v) => void onSubmit(v))}
    >
      <div className="space-y-1.5">
        <Label htmlFor="song-title">Título</Label>
        <Input id="song-title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="song-track">Pista</Label>
          <Input
            id="song-track"
            type="number"
            {...form.register("trackNumber")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="song-duration">Duración (s)</Label>
          <Input
            id="song-duration"
            type="number"
            {...form.register("durationSeconds")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="song-tuning">Afinación</Label>
          <Input id="song-tuning" {...form.register("tuning")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="song-bpm">BPM objetivo</Label>
          <Input id="song-bpm" type="number" {...form.register("targetBpm")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Dificultad</Label>
        <Select
          value={difficulty ?? "none"}
          onValueChange={(value) => {
            if (value === null || value === "none") {
              form.setValue("difficulty", undefined);
              return;
            }
            form.setValue("difficulty", value as DifficultyLevel);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin definir">
              {difficulty ? DIFFICULTY_LABELS[difficulty] : "Sin definir"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin definir</SelectItem>
            {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {DIFFICULTY_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="song-notes">Notas</Label>
        <Textarea id="song-notes" rows={2} {...form.register("notes")} />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
