"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface KPI {
  value: number;
  delta: number;
}

interface AnalyticsData {
  kpis: {
    totalPublications: KPI;
    globalEngagement: KPI;
    avgLeadTime: KPI;
    topContent: {
      name: string;
      platform: string;
      interactions: number;
    };
  };
  platforms: string[];
  channelDistribution: Array<{ name: string; value: number }>;
}

export default function ComparePage() {
  const [mounted, setMounted] = useState(false);
  
  // Selection states
  const [monthA, setMonthA] = useState("2026-05");
  const [monthB, setMonthB] = useState("2026-04");

  const [dataA, setDataA] = useState<AnalyticsData | null>(null);
  const [dataB, setDataB] = useState<AnalyticsData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`${API_URL}/api/analytics?month=${monthA}`),
        fetch(`${API_URL}/api/analytics?month=${monthB}`)
      ]);

      if (!resA.ok || !resB.ok) {
        throw new Error("Erreur lors du chargement des données analytiques.");
      }

      const analyticsA = await resA.json();
      const analyticsB = await resB.json();

      setDataA(analyticsA);
      setDataB(analyticsB);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchComparison();
  }, [monthA, monthB]);

  if (!mounted) return null;

  const months = [
    { value: "2026-05", label: "Mai 2026" },
    { value: "2026-04", label: "Avril 2026" },
    { value: "2026-03", label: "Mars 2026" },
    { value: "2026-02", label: "Février 2026" },
    { value: "2026-01", label: "Janvier 2026" }
  ];

  // Helper to format month names in French
  const getMonthLabel = (mVal: string) => {
    const found = months.find(m => m.value === mVal);
    return found ? found.label : mVal;
  };

  // Merge platform distributions for side-by-side chart comparison
  const buildPlatformComparisonData = () => {
    if (!dataA || !dataB) return [];

    const platforms = Array.from(
      new Set([
        ...dataA.channelDistribution.map(c => c.name),
        ...dataB.channelDistribution.map(c => c.name)
      ])
    );

    const labelA = getMonthLabel(monthA);
    const labelB = getMonthLabel(monthB);

    return platforms.map(plat => {
      const interactionsA = dataA.channelDistribution.find(c => c.name === plat)?.value || 0;
      const interactionsB = dataB.channelDistribution.find(c => c.name === plat)?.value || 0;
      return {
        platform: plat,
        [labelA]: interactionsA,
        [labelB]: interactionsB
      };
    });
  };

  const chartData = buildPlatformComparisonData();

  // Diff calculations
  const getDiffPercent = (valA: number, valB: number) => {
    if (valB === 0) return valA > 0 ? 100 : 0;
    return parseFloat((((valA - valB) / valB) * 100).toFixed(1));
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/85 backdrop-blur px-6 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Activity className="h-6 w-6 stroke-[2.5]" />
            <span>PULSE</span>
          </Link>
          <nav className="hidden md:flex gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Vue d'ensemble</Link>
            <Link href="/deployments" className="hover:text-foreground transition-colors">Publications</Link>
            <Link href="/compare" className="text-foreground transition-colors">Comparateur</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchComparison}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-md hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="h-8 w-[1px] bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              AD
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">Workspace Prod</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Comparateur de Périodes</h1>
              <p className="text-sm text-muted-foreground">Comparez et analysez les performances opérationnelles de deux mois choisis.</p>
            </div>
          </div>

          {/* Month Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Période A:</span>
              <div className="relative">
                <select
                  value={monthA}
                  onChange={(e) => setMonthA(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-input bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 pointer-events-none text-muted-foreground" />
              </div>
            </div>

            <span className="text-muted-foreground text-sm font-bold">vs</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Période B:</span>
              <div className="relative">
                <select
                  value={monthB}
                  onChange={(e) => setMonthB(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-input bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && !dataA ? (
          <div className="flex flex-1 items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Comparaison en cours...</span>
            </div>
          </div>
        ) : dataA && dataB ? (
          <>
            {/* KPI Side-By-Side Comparison Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Card 1: Publications count */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Publications Totales</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 border-b border-border pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthA)}</span>
                    <span className="text-2xl font-bold">{dataA.kpis.totalPublications.value}</span>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthB)}</span>
                    <span className="text-2xl font-bold text-muted-foreground">{dataB.kpis.totalPublications.value}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {getDiffPercent(dataA.kpis.totalPublications.value, dataB.kpis.totalPublications.value) >= 0 ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                      +{getDiffPercent(dataA.kpis.totalPublications.value, dataB.kpis.totalPublications.value)}%
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <ArrowDownRight className="h-4 w-4" />
                      {getDiffPercent(dataA.kpis.totalPublications.value, dataB.kpis.totalPublications.value)}%
                    </span>
                  )}
                  <span className="text-muted-foreground">de variation relative</span>
                </div>
              </div>

              {/* Card 2: Engagement */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engagement Global</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 border-b border-border pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthA)}</span>
                    <span className="text-2xl font-bold">{dataA.kpis.globalEngagement.value.toLocaleString()}</span>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthB)}</span>
                    <span className="text-2xl font-bold text-muted-foreground">{dataB.kpis.globalEngagement.value.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {getDiffPercent(dataA.kpis.globalEngagement.value, dataB.kpis.globalEngagement.value) >= 0 ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                      +{getDiffPercent(dataA.kpis.globalEngagement.value, dataB.kpis.globalEngagement.value)}%
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <ArrowDownRight className="h-4 w-4" />
                      {getDiffPercent(dataA.kpis.globalEngagement.value, dataB.kpis.globalEngagement.value)}%
                    </span>
                  )}
                  <span className="text-muted-foreground">de variation relative</span>
                </div>
              </div>

              {/* Card 3: Avg Lead time */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temps Moyen (Lead Time)</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 border-b border-border pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthA)}</span>
                    <span className="text-2xl font-bold">{dataA.kpis.avgLeadTime.value} j</span>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-xs text-muted-foreground block truncate">{getMonthLabel(monthB)}</span>
                    <span className="text-2xl font-bold text-muted-foreground">{dataB.kpis.avgLeadTime.value} j</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {getDiffPercent(dataA.kpis.avgLeadTime.value, dataB.kpis.avgLeadTime.value) <= 0 ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                      <ArrowDownRight className="h-4 w-4" />
                      {getDiffPercent(dataA.kpis.avgLeadTime.value, dataB.kpis.avgLeadTime.value)}% (plus court)
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                      +{getDiffPercent(dataA.kpis.avgLeadTime.value, dataB.kpis.avgLeadTime.value)}% (plus long)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-Side platforms comparison chart */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Comparatif d'Engagement par Réseau Social
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Comparatif side-by-side de l'engagement total enregistré pour chaque réseau social.</p>
              
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="platform" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey={getMonthLabel(monthA)} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={getMonthLabel(monthB)} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        <p>
          © 2026 Pulse. Tous droits réservés. Build with love ❤️ by{" "}
          <a
            href="https://lussi.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary font-semibold"
          >
            Lussi
          </a>
        </p>
      </footer>
    </div>
  );
}
