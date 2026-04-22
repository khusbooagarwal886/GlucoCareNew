import type {
  MedicationAdherenceLogDoc,
  MedicationAdherenceStatus,
  MedicationScheduleEntry,
} from "@/lib/firestore";

export type MedicationAdherenceDay = {
  date: string;
  total: number;
  taken: number;
  late: number;
  skipped: number;
  pending: number;
  adherenceRate: number;
};

export type MedicationAdherenceSummary = {
  totalExpected: number;
  logged: number;
  taken: number;
  late: number;
  skipped: number;
  pending: number;
  adherenceRate: number;
  byDay: MedicationAdherenceDay[];
};

export function getStatusBadgeClasses(status: MedicationAdherenceStatus): string {
  if (status === "taken") return "bg-success/10 text-success border-success/30";
  if (status === "late") return "bg-warning/10 text-warning border-warning/30";
  return "bg-danger/10 text-danger border-danger/30";
}

export function buildMedicationAdherenceSummary(
  scheduleEntries: MedicationScheduleEntry[],
  logs: MedicationAdherenceLogDoc[]
): MedicationAdherenceSummary {
  const logByKey = new Map(logs.map((log) => [`${log.scheduleDate}_${log.slot}`, log]));
  const byDayMap = new Map<string, MedicationAdherenceDay>();

  for (const entry of scheduleEntries) {
    const key = `${entry.scheduleDate}_${entry.slot}`;
    const log = logByKey.get(key);
    const day = byDayMap.get(entry.scheduleDate) ?? {
      date: entry.scheduleDate,
      total: 0,
      taken: 0,
      late: 0,
      skipped: 0,
      pending: 0,
      adherenceRate: 0,
    };

    day.total += 1;
    if (!log) {
      day.pending += 1;
    } else if (log.status === "taken") {
      day.taken += 1;
    } else if (log.status === "late") {
      day.late += 1;
    } else {
      day.skipped += 1;
    }

    day.adherenceRate = day.total > 0 ? Math.round(((day.taken + day.late) / day.total) * 100) : 0;
    byDayMap.set(entry.scheduleDate, day);
  }

  const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const totalExpected = byDay.reduce((sum, day) => sum + day.total, 0);
  const taken = byDay.reduce((sum, day) => sum + day.taken, 0);
  const late = byDay.reduce((sum, day) => sum + day.late, 0);
  const skipped = byDay.reduce((sum, day) => sum + day.skipped, 0);
  const pending = byDay.reduce((sum, day) => sum + day.pending, 0);

  return {
    totalExpected,
    logged: taken + late + skipped,
    taken,
    late,
    skipped,
    pending,
    adherenceRate: totalExpected > 0 ? Math.round(((taken + late) / totalExpected) * 100) : 0,
    byDay,
  };
}
