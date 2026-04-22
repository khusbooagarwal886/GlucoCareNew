import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MedicationAdherenceSummary } from "@/lib/medication-adherence";

type MedicationAdherenceSummaryCardProps = {
  title: string;
  summary: MedicationAdherenceSummary;
  emptyMessage: string;
};

const MedicationAdherenceSummaryCard = ({
  title,
  summary,
  emptyMessage,
}: MedicationAdherenceSummaryCardProps) => {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.totalExpected === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Adherence</p>
                <p className="text-2xl font-bold text-success">{summary.adherenceRate}%</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Taken</p>
                <p className="text-2xl font-bold">{summary.taken}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-warning">{summary.late}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-danger">{summary.skipped}</p>
              </div>
            </div>

            <div className="space-y-2">
              {summary.byDay.slice(-7).reverse().map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="font-medium">{day.date}</p>
                    <p className="text-xs text-muted-foreground">
                      Taken {day.taken}, late {day.late}, skipped {day.skipped}, pending {day.pending}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{day.adherenceRate}%</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationAdherenceSummaryCard;
