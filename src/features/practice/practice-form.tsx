"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createSession,
  updateSession,
} from "@/data/repositories/practice-repository";
import {
  LEARNING_STAGES,
  LEARNING_STAGE_LABELS,
} from "@/domain/constants/mastery";
import {
  practiceSessionFormSchema,
  type PracticeSessionFormValues,
} from "@/domain/schemas";
import type { LearningStage } from "@/domain/types";
import { nowIso } from "@/lib/dates";

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PracticeForm({
  songId: prefillSongId,
  sessionId,
}: {
  songId?: string;
  sessionId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(sessionId);

  const songs =
    useLiveQuery(() =>
      getDb()
        .songs.toArray()
        .then((list) =>
          list.sort((a, b) => a.title.localeCompare(b.title, "es")),
        ),
    ) ?? [];
  const techniques =
    useLiveQuery(() => getDb().techniques.orderBy("name").toArray()) ?? [];
  const existing = useLiveQuery(async () => {
    if (!sessionId) return null;
    const row = await getDb().practice_sessions.get(sessionId);
    return row ?? null;
  }, [sessionId]);

  const form = useForm<PracticeSessionFormValues>({
    resolver: zodResolver(
      practiceSessionFormSchema,
    ) as Resolver<PracticeSessionFormValues>,
    defaultValues: {
      songId: prefillSongId ?? "",
      practicedAt: toDatetimeLocalValue(nowIso()),
      durationMinutes: 20,
      stage: "learning",
      bpmAchieved: undefined,
      notes: "",
      difficultSections: "",
      techniquesPracticed: [],
      isSatisfactoryFullPerformance: false,
    },
  });

  useEffect(() => {
    if (prefillSongId && !sessionId) {
      form.setValue("songId", prefillSongId);
    }
  }, [prefillSongId, sessionId, form]);

  useEffect(() => {
    if (existing) {
      form.reset({
        songId: existing.songId,
        practicedAt: toDatetimeLocalValue(existing.practicedAt),
        durationMinutes: existing.durationMinutes,
        stage: existing.stage,
        bpmAchieved: existing.bpmAchieved,
        notes: existing.notes ?? "",
        difficultSections: existing.difficultSections ?? "",
        techniquesPracticed: existing.techniquesPracticed,
        isSatisfactoryFullPerformance: existing.isSatisfactoryFullPerformance,
      });
    }
  }, [existing, form]);

  const selectedTechniques = form.watch("techniquesPracticed");
  const stage = form.watch("stage");
  const songId = form.watch("songId");
  const isSatisfactory = form.watch("isSatisfactoryFullPerformance");

  async function onSubmit(values: PracticeSessionFormValues) {
    try {
      const payload = {
        songId: values.songId,
        practicedAt: values.practicedAt,
        durationMinutes: values.durationMinutes,
        stage: values.stage,
        bpmAchieved: values.bpmAchieved,
        notes: values.notes || undefined,
        difficultSections: values.difficultSections || undefined,
        techniquesPracticed: values.techniquesPracticed,
        isSatisfactoryFullPerformance: values.isSatisfactoryFullPerformance,
      };

      if (isEdit && sessionId) {
        await updateSession(sessionId, payload);
        toast.success("Sesión actualizada");
      } else {
        await createSession(payload);
        toast.success("Sesión registrada");
      }
      router.push(`/songs/${values.songId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar la sesión",
      );
    }
  }

  if (isEdit && existing === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando sesión…</p>;
  }

  if (isEdit && existing === null) {
    return (
      <p className="text-sm text-muted-foreground">Sesión no encontrada.</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title={isEdit ? "Editar sesión" : "Nueva sesión"}
        description="Registra el tiempo y el foco de tu práctica."
      />

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => void onSubmit(values))}
      >
        <div className="space-y-2">
          <Label>Canción</Label>
          <Select
            value={songId || undefined}
            onValueChange={(value) => {
              if (value) form.setValue("songId", value, { shouldValidate: true });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una canción">
                {songs.find((s) => s.id === songId)?.title ??
                  "Selecciona una canción"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {songs.map((song) => (
                <SelectItem key={song.id} value={song.id}>
                  {song.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.songId ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.songId.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="practicedAt">Fecha y hora</Label>
            <Input
              id="practicedAt"
              type="datetime-local"
              {...form.register("practicedAt")}
            />
            {form.formState.errors.practicedAt ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.practicedAt.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duración (min)</Label>
            <Input
              id="durationMinutes"
              type="number"
              {...form.register("durationMinutes")}
            />
            {form.formState.errors.durationMinutes ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.durationMinutes.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Etapa</Label>
          <Select
            value={stage}
            onValueChange={(value) => {
              if (value) {
                form.setValue("stage", value as LearningStage, {
                  shouldValidate: true,
                });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{LEARNING_STAGE_LABELS[stage]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {LEARNING_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEARNING_STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bpmAchieved">BPM alcanzado</Label>
          <Input
            id="bpmAchieved"
            type="number"
            {...form.register("bpmAchieved")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="satisfactory"
            checked={isSatisfactory}
            onCheckedChange={(checked) => {
              form.setValue("isSatisfactoryFullPerformance", checked === true);
            }}
          />
          <Label htmlFor="satisfactory">
            Interpretación completa satisfactoria
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Técnicas practicadas</Label>
          <ul className="grid gap-2 sm:grid-cols-2">
            {techniques.map((technique) => {
              const checked = selectedTechniques.includes(technique.id);
              return (
                <li key={technique.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`session-tech-${technique.id}`}
                    checked={checked}
                    onCheckedChange={(value) => {
                      const next =
                        value === true
                          ? [...selectedTechniques, technique.id]
                          : selectedTechniques.filter(
                              (id) => id !== technique.id,
                            );
                      form.setValue("techniquesPracticed", next);
                    }}
                  />
                  <Label htmlFor={`session-tech-${technique.id}`}>
                    {technique.name}
                  </Label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficultSections">Secciones difíciles</Label>
          <Textarea
            id="difficultSections"
            rows={2}
            {...form.register("difficultSections")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Registrar sesión"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
