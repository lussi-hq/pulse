"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  ChevronDown,
  RefreshCw,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch, removeAuthToken, getAuthToken, getAuthUsername, getApiUrl } from "../lib/auth";

interface Deployment {
  id: string;
  activityName: string;
  type: string;
  platform: string;
  publishedAt: string;
  leadTimeDays: number;
  interactions: number;
}

interface CampaignEvent {
  id: string;
  name: string;
  type: string;
}

export default function DeploymentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Larger display for standalone page

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

  const API_URL = getApiUrl();

  const fetchData = async () => {
    if (!getAuthToken()) return;
    setLoading(true);
    setError(null);
    try {
      const [resDeployments, resEvents] = await Promise.all([
        authenticatedFetch(`${API_URL}/api/deployments`),
        authenticatedFetch(`${API_URL}/api/events`)
      ]);

      if (!resDeployments.ok || !resEvents.ok) {
        throw new Error("Erreur lors de la récupération des données.");
      }

      const deploymentsData = await resDeployments.json();
      const eventsData = await resEvents.json();

      setDeployments(deploymentsData);
      setEvents(eventsData);

      if (eventsData.length > 0 && !newPub.eventId) {
        setNewPub(prev => ({ ...prev, eventId: eventsData[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger les publications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchData();
  }, [router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  if (!mounted) return null;

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await authenticatedFetch(`${API_URL}/api/events`, {
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
      const res = await authenticatedFetch(`${API_URL}/api/publications`, {
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

  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch = d.activityName.toLowerCase().includes(searchTerm.toLowerCase()) || d.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || d.type === filterType;
    return matchesSearch && matchesType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeployments = filteredDeployments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeployments.length / itemsPerPage);

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
            <Link href="/deployments" className="text-foreground transition-colors">Publications</Link>
            <Link href="/compare" className="hover:text-foreground transition-colors">Comparateur</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-md hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="h-8 w-[1px] bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm uppercase">
              {getAuthUsername() ? getAuthUsername().slice(0, 2) : "AD"}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">
              {getAuthUsername() || "Workspace Prod"}
            </span>
          </div>
          <button
            onClick={() => {
              removeAuthToken();
              router.push("/login");
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border transition-all duration-200 text-xs font-medium"
            title="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Se déconnecter</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Registre des Publications</h1>
              <p className="text-sm text-muted-foreground">Historique complet des publications et des performances associées.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-border gap-4 bg-muted/20">
            <h3 className="font-bold text-base">Publications ({filteredDeployments.length})</h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-[180px] sm:w-[220px] rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {/* Filter Select */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="All">Tous les types</option>
                  <option value="Interne">Interne</option>
                  <option value="Externe">Externe</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  <th className="p-4 pl-6">Activité / Campagne</th>
                  <th className="p-4">Zone</th>
                  <th className="p-4">Plateforme</th>
                  <th className="p-4">Date de Publication</th>
                  <th className="p-4">Lead Time (Jours)</th>
                  <th className="p-4 pr-6 text-right">Engagement (Int.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {currentDeployments.length > 0 ? (
                  currentDeployments.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 pl-6 font-semibold">{d.activityName}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.type === "Interne" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        }`}>
                          {d.type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs">{d.platform}</td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(d.publishedAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </td>
                      <td className="p-4 text-muted-foreground">{d.leadTimeDays} jours</td>
                      <td className="p-4 pr-6 text-right font-semibold font-mono">{d.interactions.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Aucune publication ne correspond à vos filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10 text-sm">
              <div className="text-muted-foreground">
                Affichage de <span className="font-semibold">{indexOfFirstItem + 1}</span> à{" "}
                <span className="font-semibold">
                  {Math.min(indexOfLastItem, filteredDeployments.length)}
                </span>{" "}
                sur <span className="font-semibold">{filteredDeployments.length}</span> publications
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border bg-background text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-muted-foreground font-medium px-2">
                  Page <span className="font-semibold text-foreground">{currentPage}</span> sur{" "}
                  <span className="font-semibold text-foreground">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border bg-background text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
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
