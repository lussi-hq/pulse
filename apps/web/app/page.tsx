"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Layers,
  Clock,
  TrendingUp,
  FileText,
  BarChart3,
  Calendar,
  Share2,
  PieChart as PieIcon,
  RefreshCw,
  Plus,
  X,
  ChevronDown
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
} from "recharts";
import Link from "next/link";

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
  timeline: Array<{ date: string; [platform: string]: any }>;
  channelDistribution: Array<{ name: string; value: number }>;
  platformPerformance: Array<{ eventName: string; [platform: string]: any }>;
  globalImpactDistribution: Array<{ eventName: string; value: number }>;
}

interface CampaignEvent {
  id: string;
  name: string;
  type: string;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month selector
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  // Modals state
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPubModal, setShowPubModal] = useState(false);

  // Forms state
  const [newEvent, setNewEvent] = useState({ name: "", type: "Externe" });
  const [newPub, setNewPub] = useState({
    eventId: "",
    platform: "LinkedIn",
    customPlatform: "",
    publishedAt: new Date().toISOString().split("T")[0],
    leadTimeDays: "3",
    interactions: "100"
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async (month = selectedMonth) => {
    setLoading(true);
    setError(null);
    try {
      const [resAnalytics, resEvents] = await Promise.all([
        fetch(`${API_URL}/api/analytics?month=${month}`),
        fetch(`${API_URL}/api/events`)
      ]);

      if (!resAnalytics.ok || !resEvents.ok) {
        throw new Error("Erreur lors de la récupération des données du serveur API.");
      }

      const analyticsData = await resAnalytics.json();
      const eventsData = await resEvents.json();

      setAnalytics(analyticsData);
      setEvents(eventsData);

      // Pre-select first event in form if available
      if (eventsData.length > 0 && !newPub.eventId) {
        setNewPub(prev => ({ ...prev, eventId: eventsData[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Impossible de se connecter à l'API backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData(selectedMonth);
  }, [selectedMonth]);

  if (!mounted) return null;

  const COLORS = [
    "var(--primary, oklch(0.488 0.243 264.376))",
    "var(--chart-2, oklch(0.623 0.214 259.815))",
    "var(--chart-1, oklch(0.809 0.105 251.813))",
    "var(--chart-3, oklch(0.546 0.245 262.881))",
    "var(--chart-5, oklch(0.424 0.199 265.638))"
  ];

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement de l'activité.");
      
      const created = await res.json();
      setNewEvent({ name: "", type: "Externe" });
      setShowEventModal(false);
      setNewPub(prev => ({ ...prev, eventId: created.id }));
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erreur de connexion.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const platformName = newPub.platform === "Autre" ? newPub.customPlatform : newPub.platform;
    if (!platformName) {
      setFormError("Veuillez spécifier le nom du réseau social.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/publications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: newPub.eventId,
          platform: platformName,
          publishedAt: newPub.publishedAt,
          leadTimeDays: Number(newPub.leadTimeDays),
          interactions: Number(newPub.interactions)
        })
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement de la publication.");
      
      setNewPub(prev => ({
        ...prev,
        customPlatform: "",
        interactions: "100"
      }));
      setShowPubModal(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Erreur de connexion.");
    } finally {
      setFormLoading(false);
    }
  };

  const months = [
    { value: "2026-05", label: "Mai 2026 (En cours)" },
    { value: "2026-04", label: "Avril 2026" },
    { value: "2026-03", label: "Mars 2026" },
    { value: "2026-02", label: "Février 2026" },
    { value: "2026-01", label: "Janvier 2026" }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground transition-colors duration-250">
      {/* Header bar matching dashboard-01 */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/85 backdrop-blur px-6 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Activity className="h-6 w-6 stroke-[2.5]" />
            <span>PULSE</span>
          </Link>
          <nav className="hidden md:flex gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/" className="text-foreground transition-colors">Vue d'ensemble</Link>
            <Link href="/deployments" className="hover:text-foreground transition-colors">Publications</Link>
            <Link href="/compare" className="hover:text-foreground transition-colors">Comparateur</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchData()}
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

      {/* Main Layout Area */}
      <main className="flex flex-1 flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tableau Opérationnel</h1>
            <p className="text-sm text-muted-foreground">Analysez et pilotez les lancements et l'impact social en temps réel.</p>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            {/* Month Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-input bg-card text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 pointer-events-none text-muted-foreground" />
            </div>

            <button
              onClick={() => { setFormError(null); setShowEventModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-all"
            >
              <Plus className="h-4 w-4" />
              Créer Campagne
            </button>
            <button
              onClick={() => {
                setFormError(null);
                if (events.length === 0) {
                  setError("Veuillez d'abord créer une campagne/activité avant d'enregistrer une publication.");
                  return;
                }
                setShowPubModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              Enregistrer Publication
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="underline text-xs font-semibold hover:opacity-85">Fermer</button>
          </div>
        )}

        {loading && !analytics ? (
          <div className="flex flex-1 items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Chargement des données...</span>
            </div>
          </div>
        ) : analytics ? (
          <>
            {/* KPI Cards Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Publications */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Publications du mois</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{analytics.kpis.totalPublications.value}</span>
                  <span className={`text-xs font-semibold ${analytics.kpis.totalPublications.delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {analytics.kpis.totalPublications.delta >= 0 ? "+" : ""}{analytics.kpis.totalPublications.delta}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs mois précédent</p>
              </div>

              {/* Global Engagement */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Engagement Global</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">
                    {analytics.kpis.globalEngagement.value.toLocaleString()}
                  </span>
                  <span className={`text-xs font-semibold ${analytics.kpis.globalEngagement.delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {analytics.kpis.globalEngagement.delta >= 0 ? "+" : ""}{analytics.kpis.globalEngagement.delta}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Interactions totales</p>
              </div>

              {/* Average Lead Time */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Temps Moyen de Publication</span>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{analytics.kpis.avgLeadTime.value} j</span>
                  <span className={`text-xs font-semibold ${analytics.kpis.avgLeadTime.delta <= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {analytics.kpis.avgLeadTime.delta >= 0 ? "+" : ""}{analytics.kpis.avgLeadTime.delta}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Délai d'exécution</p>
              </div>

              {/* Top Performing Content */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Campagne</span>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="truncate">
                  <span className="text-base font-bold tracking-tight block truncate">
                    {analytics.kpis.topContent.name}
                  </span>
                  <span className="text-xs text-primary font-semibold uppercase tracking-wider block">
                    {analytics.kpis.topContent.platform} • {analytics.kpis.topContent.interactions.toLocaleString()} int.
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Meilleure performance</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Chart 1: Timeline de l'Engagement */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1 pb-4">
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Timeline de l'Engagement (Interactions)
                  </h3>
                  <p className="text-xs text-muted-foreground">Tendance quotidienne d'interaction par réseau social.</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                        labelStyle={{ fontWeight: "bold" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      {analytics.platforms.map((platform, idx) => (
                        <Line
                          key={platform}
                          type="monotone"
                          dataKey={platform}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Répartition par Canal */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1 pb-4">
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-primary" />
                    Répartition par Canal
                  </h3>
                  <p className="text-xs text-muted-foreground">Contribution globale de chaque plateforme à l'engagement.</p>
                </div>
                <div className="h-[280px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.channelDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.channelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                      />
                      <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Performance par Plateforme */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1 pb-4">
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Performance par Plateforme
                  </h3>
                  <p className="text-xs text-muted-foreground">Comparaison côte-à-côte de l'engagement par campagne.</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.platformPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="eventName" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      {analytics.platforms.map((platform, idx) => (
                        <Bar
                          key={platform}
                          dataKey={platform}
                          fill={COLORS[idx % COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Répartition de l'impact global */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1 pb-4">
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Impact Global par Campagne
                  </h3>
                  <p className="text-xs text-muted-foreground">Part relative de chaque événement dans l'engagement total.</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.globalImpactDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ eventName, percent }) => `${eventName.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                        nameKey="eventName"
                      >
                        {analytics.globalImpactDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Modal 1: Create Campaign Event */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowEventModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">Créer une Campagne / Activité</h3>
            <p className="text-xs text-muted-foreground mb-6">Ajouter un thème de campagne ou de publication.</p>
            {formError && <p className="mb-4 text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nom de l'Activité</label>
                <input
                  type="text" required placeholder="ex: Séminaire Cybersécurité RDC"
                  value={newEvent.name} onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Type de Zone</label>
                <select value={newEvent.type} onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Interne">Interne</option>
                  <option value="Externe">Externe</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted">Annuler</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">{formLoading ? "Enregistrement..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Publication / Record Performance */}
      {showPubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowPubModal(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">Enregistrer une Publication</h3>
            <p className="text-xs text-muted-foreground mb-6">Ajouter un post et renseigner ses performances initiales.</p>
            {formError && <p className="mb-4 text-xs text-destructive bg-destructive/10 p-2 rounded">{formError}</p>}
            <form onSubmit={handleCreatePublication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Activité / Thème</label>
                <select value={newPub.eventId} required onChange={(e) => setNewPub(prev => ({ ...prev, eventId: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Réseau Social</label>
                <select value={newPub.platform} onChange={(e) => setNewPub(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Facebook">Facebook</option>
                  <option value="X">X (Twitter)</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Autre">Autre Réseau</option>
                </select>
                {newPub.platform === "Autre" && (
                  <input type="text" required placeholder="Nom du réseau" value={newPub.customPlatform} onChange={(e) => setNewPub(prev => ({ ...prev, customPlatform: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Date de publication</label>
                  <input type="date" required value={newPub.publishedAt} onChange={(e) => setNewPub(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Lead Time (Jours)</label>
                  <input type="number" required min="0" step="0.1" value={newPub.leadTimeDays} onChange={(e) => setNewPub(prev => ({ ...prev, leadTimeDays: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Engagement (Interactions)</label>
                <input type="number" required min="0" value={newPub.interactions} onChange={(e) => setNewPub(prev => ({ ...prev, interactions: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPubModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted">Annuler</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">{formLoading ? "Enregistrement..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground mt-auto">
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
