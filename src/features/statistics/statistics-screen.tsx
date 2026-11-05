"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "@/components/layout/page-header";
import { getDb } from "@/data/db";
import { StatsService } from "@/domain/services/stats";
import { formatDurationMinutes } from "@/lib/dates";

export function StatisticsScreen() {
  const bands = useLiveQuery(() => getDb().bands.toArray()) ?? [];
  const albums = useLiveQuery(() => getDb().albums.toArray()) ?? [];
  const songs = useLiveQuery(() => getDb().songs.toArray()) ?? [];
  const sessions = useLiveQuery(() => getDb().practice_sessions.toArray()) ?? [];
  const techniques = useLiveQuery(() => getDb().techniques.toArray()) ?? [];

  const stats = StatsService.calculateAppStats({
    bands,
    albums,
    songs,
    sessions,
    techniques,
  });

  const maxMonth = Math.max(1, ...stats.masteredPerMonth.map((m) => m.count));
  const maxActivity = Math.max(
    1,
    ...stats.practiceActivity.map((d) => d.minutes),
  );
  const maxTechnique = Math.max(1, ...stats.topTechniques.map((t) => t.count));

  const recentActivity = stats.practiceActivity.slice(-14);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estadísticas"
        description="Resumen de tu progreso y hábitos de práctica."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Dominadas" value={String(stats.masteredSongs)} />
        <Kpi label="En progreso" value={String(stats.inProgressSongs)} />
        <Kpi
          label="Tiempo total"
          value={formatDurationMinutes(stats.totalPracticeMinutes)}
        />
        <Kpi
          label="Media por sesión"
          value={`${stats.averageSessionMinutes} min`}
        />
      </section>

      <BarSection
        title="Progreso por banda"
        empty="Todavía no hay bandas."
        items={stats.progressByBand.map((b) => ({
          key: b.bandId,
          label: b.bandName,
          detail: `${b.mastered}/${b.total} · ${b.percent}%`,
          percent: b.percent,
        }))}
      />

      <BarSection
        title="Dominadas por mes"
        empty="Aún no hay canciones dominadas."
        items={stats.masteredPerMonth.map((m) => ({
          key: m.month,
          label: m.month,
          detail: String(m.count),
          percent: Math.round((m.count / maxMonth) * 100),
        }))}
      />

      <BarSection
        title="Actividad reciente (14 días)"
        empty="Sin sesiones registradas."
        items={recentActivity.map((d) => ({
          key: d.date,
          label: d.date,
          detail: formatDurationMinutes(d.minutes),
          percent: Math.round((d.minutes / maxActivity) * 100),
        }))}
      />

      <BarSection
        title="Técnicas más practicadas"
        empty="Ninguna técnica registrada en sesiones."
        items={stats.topTechniques.map((t) => ({
          key: t.techniqueId,
          label: t.name,
          detail: String(t.count),
          percent: Math.round((t.count / maxTechnique) * 100),
        }))}
      />
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

function BarSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    key: string;
    label: string;
    detail: string;
    percent: number;
  }>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {item.detail}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
