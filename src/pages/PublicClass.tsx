import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiService, type Student, type LastUpdateEntry } from "@/services/api";
import StudentTable from "@/components/dashboard/StudentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const PublicClass = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiService.getAvailableTables();
        if (!active) return;
        setAvailable(res.tables || []);
        const q = (searchParams.get("class") || "").trim();
        const initial = q && res.tables.includes(q) ? q : res.tables[0] || "";
        setSelected(initial);
        if (initial) {
          try {
            const updates = await apiService.getLastUpdatesCached();
            if (!active) return;
            const latest = computeLatestChangedAt(initial, updates);
            setLastChangedAt(latest);
          } catch {}
          const d = await apiService.getStudentData(initial, { useCachedLastUpdate: true });
          if (!active) return;
          setData(d);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const onChangeClass = async (val: string) => {
    setSelected(val);
    setSearchParams((sp) => {
      const n = new URLSearchParams(sp);
      n.set("class", val);
      return n;
    });
    setLoading(true);
    try {
      try {
        const updates = await apiService.getLastUpdatesCached();
        const latest = computeLatestChangedAt(val, updates);
        setLastChangedAt(latest);
      } catch {}
  const d = await apiService.getStudentData(val, { useCachedLastUpdate: true });
      setData(d);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const lastUpdatedText = useMemo(() => {
    if (!lastChangedAt) return "—";
    const now = Date.now();
    const diff = Math.max(0, now - lastChangedAt);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let rel = `${mins}m ago`;
    if (mins >= 60 && hours < 24) rel = `${hours}h ago`;
    if (hours >= 24) rel = `${days}d ago`;
    const abs = new Date(lastChangedAt).toLocaleString();
    return `${rel} (${abs})`;
  }, [lastChangedAt]);

  function computeLatestChangedAt(tableName: string, entries: LastUpdateEntry[]): number | null {
    const base = tableName.toLowerCase().replace(/_data$/i, "");
    const candidates = entries
      .filter((e) => {
        const t = e.table_name.toLowerCase();
        return t === base || t === `${base}_data`;
      })
      .map((e) => new Date(e.changed_at).getTime())
      .filter((t) => Number.isFinite(t));
    if (candidates.length === 0) return null;
    return Math.max(...candidates);
  }

  return (
    <div className="min-h-screen bg-dashboard-content p-4">
      <Card className="max-w-6xl mx-auto bg-gradient-card border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Class Overview</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Select Class</span>
                <Select value={selected} onValueChange={onChangeClass}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Data updates approximately every 12 hours. This is a read-only view.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last update: {lastUpdatedText}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-6">{error}</div>
          ) : (
            <StudentTable
              students={data}
              onOpenGithubDetails={() => {}}
              onOpenLeetcodeDetails={() => {}}
              readOnly
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicClass;
