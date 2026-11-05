"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/data/db";
import {
  createBand,
  updateBand,
} from "@/data/repositories/band-repository";
import {
  bandFormSchema,
  type BandFormValues,
} from "@/domain/schemas";

export function BandForm({ bandId }: { bandId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(bandId);
  const band = useLiveQuery(async () => {
    if (!bandId) return null;
    const row = await getDb().bands.get(bandId);
    return row ?? null;
  }, [bandId]);

  const form = useForm<BandFormValues>({
    resolver: zodResolver(bandFormSchema) as Resolver<BandFormValues>,
    defaultValues: {
      name: "",
      description: "",
      artworkUrl: "",
    },
  });

  useEffect(() => {
    if (band) {
      form.reset({
        name: band.name,
        description: band.description ?? "",
        artworkUrl: band.artworkUrl ?? "",
      });
    }
  }, [band, form]);

  async function onSubmit(values: BandFormValues) {
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        artworkUrl: values.artworkUrl || undefined,
      };
      if (isEdit && bandId) {
        await updateBand(bandId, payload);
        toast.success("Banda actualizada");
        router.push(`/bands/${bandId}`);
      } else {
        const created = await createBand(payload);
        toast.success("Banda creada");
        router.push(`/bands/${created.id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo guardar la banda",
      );
    }
  }

  if (isEdit && band === undefined) {
    return <p className="text-sm text-muted-foreground">Cargando banda…</p>;
  }

  if (isEdit && band === null) {
    return (
      <p className="text-sm text-muted-foreground">Banda no encontrada.</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title={isEdit ? "Editar banda" : "Nueva banda"}
        description={
          isEdit
            ? "Actualiza los datos de la banda."
            : "Añade una banda para iniciar un nuevo challenge."
        }
      />

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => void onSubmit(values))}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" {...form.register("name")} autoFocus />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" rows={3} {...form.register("description")} />
          {form.formState.errors.description ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="artworkUrl">URL de imagen (opcional)</Label>
          <Input
            id="artworkUrl"
            type="url"
            placeholder="https://"
            {...form.register("artworkUrl")}
          />
          {form.formState.errors.artworkUrl ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.artworkUrl.message}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Crear banda"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
