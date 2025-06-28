"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { scanService } from "@/services/api";
import { Zap, Shield, AlertTriangle, CheckCircle, Info, Bug, Lock, Globe, Eye, Key, Database, Loader2 } from "lucide-react";
import NewScanForm from "@/components/new-scan-form";
import Link from "next/link";

// Liste des vulnérabilités disponibles avec leurs icônes
const vulnerabilityTypes = [
  { type: "authentication", name: "Authentification", icon: <Lock className="w-4 h-4" />, color: "text-yellow-400" },
  { type: "component_version", name: "Versions des composants", icon: <Database className="w-4 h-4" />, color: "text-blue-400" },
  { type: "csrf", name: "CSRF", icon: <Key className="w-4 h-4" />, color: "text-pink-400" },
  { type: "force_browsing", name: "Force Browsing", icon: <Eye className="w-4 h-4" />, color: "text-purple-400" },
  { type: "information_leakage", name: "Fuites d'information", icon: <Info className="w-4 h-4" />, color: "text-cyan-400" },
  { type: "least_privilege", name: "Principe du moindre privilège", icon: <Shield className="w-4 h-4" />, color: "text-green-400" },
  { type: "password_form_security", name: "Sécurité des formulaires", icon: <Lock className="w-4 h-4" />, color: "text-orange-400" },
  { type: "security_monitoring", name: "Monitoring de sécurité", icon: <Bug className="w-4 h-4" />, color: "text-gray-400" },
  { type: "injection", name: "Injection SQL", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
  { type: "ssl_security", name: "Sécurité SSL", icon: <Shield className="w-4 h-4" />, color: "text-blue-400" },
  { type: "ssrf", name: "SSRF", icon: <Globe className="w-4 h-4" />, color: "text-indigo-400" },
  { type: "xss", name: "XSS", icon: <Bug className="w-4 h-4" />, color: "text-red-400" },
  { type: "xxe", name: "XXE", icon: <Bug className="w-4 h-4" />, color: "text-pink-400" },
];

const vulnIcons = {
  authentication: <Lock className="w-5 h-5 text-yellow-400 inline mr-2" />,
  component_version: <Database className="w-5 h-5 text-blue-400 inline mr-2" />,
  csrf: <Key className="w-5 h-5 text-pink-400 inline mr-2" />,
  force_browsing: <Eye className="w-5 h-5 text-purple-400 inline mr-2" />,
  information_leakage: <Info className="w-5 h-5 text-cyan-400 inline mr-2" />,
  least_privilege: <Shield className="w-5 h-5 text-green-400 inline mr-2" />,
  password_form_security: <Lock className="w-5 h-5 text-orange-400 inline mr-2" />,
  security_monitoring: <Bug className="w-5 h-5 text-gray-400 inline mr-2" />,
  injection: <AlertTriangle className="w-5 h-5 text-red-400 inline mr-2" />,
  ssl_security: <Shield className="w-5 h-5 text-blue-400 inline mr-2" />,
  ssrf: <Globe className="w-5 h-5 text-indigo-400 inline mr-2" />,
  configuration: <Info className="w-5 h-5 text-gray-400 inline mr-2" />,
  xxe: <Bug className="w-5 h-5 text-pink-400 inline mr-2" />,
  xss: <Bug className="w-5 h-5 text-red-400 inline mr-2" />,
};

function isVulnerable(description) {
  // Heuristique simple : cherche "vulnerable": true ou "vulnerable": false dans le JSON
  try {
    if (typeof description === "string") description = JSON.parse(description);
    if (Array.isArray(description)) {
      return description.some((item) => isVulnerable(item));
    }
    if (typeof description === "object" && description !== null) {
      if (description.vulnerable === true) return true;
      if (description.vulnerable === false) return false;
      for (const key in description) {
        if (isVulnerable(description[key])) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

function renderVulnDescription(desc) {
  // Affichage lisible pour les descriptions JSON ou texte
  if (!desc) return <span className="italic text-gray-400">Aucune information</span>;
  let parsed = desc;
  try {
    parsed = typeof desc === "string" ? JSON.parse(desc) : desc;
  } catch {
    return <span>{desc}</span>;
  }
  if (typeof parsed === "string") return <span>{parsed}</span>;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return <span className="italic text-gray-400">Aucune vulnérabilité détectée.</span>;
    // Si c'est un tableau d'objets, afficher chaque objet de façon lisible
    return (
      <ul className="list-disc ml-6">
        {parsed.map((item, idx) => (
          <li key={idx} className="mb-1 text-sm text-gray-200">
            {typeof item === "object" ? (
              <span>{Object.entries(item).map(([k, v]) => (
                <span key={k}><span className="font-semibold text-white">{k}</span>: <span className="text-gray-300">{String(v)}</span> </span>
              ))}</span>
            ) : (
              <span>{item}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof parsed === "object") {
    // Afficher les champs clés de façon lisible
    const keysToShow = [
      "url", "base_url", "status_code", "accessible", "vulnerable", "findings", "recommendations", "tls_version", "cipher_suite", "certificate_info", "validation_status", "vulnerabilities", "forms_analyzed", "register_pages_found"
    ];
    const entries = Object.entries(parsed).filter(([k]) => keysToShow.includes(k) || typeof parsed[k] === "object");
    if (entries.length === 0) {
      // Si aucun champ clé, afficher tout l'objet de façon lisible
      return (
        <ul className="list-disc ml-6">
          {Object.entries(parsed).map(([k, v]) => (
            <li key={k} className="mb-1 text-sm text-gray-200">
              <span className="font-semibold text-white">{k}</span>: <span className="text-gray-300">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <ul className="list-disc ml-6">
        {entries.map(([k, v]) => (
          <li key={k} className="mb-1 text-sm text-gray-200">
            <span className="font-semibold text-white">{k}</span>: <span className="text-gray-300">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <span>{String(parsed)}</span>;
}

function ScanDetails() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("id");

  const [scan, setScan] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!scanId) return;

      try {
        const fetchedScan = await scanService.getScan(scanId);
        const fetchedReport = await scanService.getReport(scanId);
        setScan(fetchedScan);
        setReport(fetchedReport);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError("Impossible de charger les données pour ce scan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scanId]);

  if (!scanId) {
    return (
      <div className="text-center text-white">
        Aucun identifiant de scan fourni dans l&apos;URL.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-white">
        Chargement des détails du scan...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Erreur : {error}</div>;
  }

  if (!scan || !report) {
    return (
      <div className="text-center text-white">
        Aucun détail disponible pour ce scan.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Cible : {scan.target}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 md:col-span-2">
              <div className="text-sm text-gray-300">Cible</div>
              <div className="font-mono font-semibold break-all">{scan.target}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-300">Date de début</div>
              <div className="font-semibold">{new Date(scan.created_at).toLocaleString('fr-FR')}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-300">Date de fin</div>
              <div className="font-semibold">
                {scan.completed_at ? new Date(scan.completed_at).toLocaleString('fr-FR') : "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Vulnérabilités détectées ({report.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-semibold">Aucune vulnérabilité détectée</p>
              <p className="text-gray-400 text-sm">Le scan n'a révélé aucun problème de sécurité</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.map((vulnerability, index) => {
                let descriptionData = {};
                try {
                  descriptionData = JSON.parse(vulnerability.description);
                } catch (error) {
                  console.error("Erreur lors de l'analyse de la description :", error);
                }

                const isVuln = isVulnerable(descriptionData);

                return (
                  <div key={index} className={`rounded-lg p-4 border ${isVuln ? "bg-red-900/30 border-red-500" : "bg-green-900/20 border-green-500"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {vulnIcons[vulnerability.vulnerability_type] || <Bug className="w-5 h-5 text-gray-400" />}
                        <h3 className="font-bold text-lg text-white">{vulnerability.vulnerability_name}</h3>
                      </div>
                      {isVuln ? (
                        <Badge variant="destructive" className="text-xs">Vulnérabilité détectée</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Aucun problème</Badge>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-300">Type : </span>
                      <span className="text-white font-medium">{vulnerability.vulnerability_type}</span>
                    </div>
                    <div className="mb-3">
                      {renderVulnDescription(vulnerability.description)}
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`item-${index}`} className="border-none">
                        <AccordionTrigger className="text-blue-300 hover:text-blue-200 text-sm">
                          Voir les détails techniques
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="bg-black/40 rounded p-3 text-xs text-gray-200 overflow-x-auto max-h-60">
                            {JSON.stringify(descriptionData, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScanResult({ scanId }) {
  const [scan, setScan] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedVulns, setCompletedVulns] = useState([]);

  useEffect(() => {
    if (!scanId) return;
    let intervalId;
    const fetchData = async () => {
      try {
        const fetchedScan = await scanService.getScan(scanId);
        setScan(fetchedScan);
        
        if (fetchedScan.status === "completed") {
          const fetchedReport = await scanService.getReport(scanId);
          setReport(fetchedReport);
          // Extraire les types de vulnérabilités terminées
          const completedTypes = fetchedReport.map(r => r.vulnerability_type);
          setCompletedVulns(completedTypes);
          setLoading(false);
          clearInterval(intervalId);
        } else if (fetchedScan.status === "failed") {
          setError("Le scan a échoué.");
          setLoading(false);
          clearInterval(intervalId);
        } else {
          setLoading(true);
          // Simuler la progression des vulnérabilités pendant le scan
          if (report && report.length > 0) {
            const completedTypes = report.map(r => r.vulnerability_type);
            setCompletedVulns(completedTypes);
          }
        }
      } catch (err) {
        setError("Erreur lors de la récupération du résultat du scan.");
        setLoading(false);
        clearInterval(intervalId);
      }
    };
    fetchData();
    intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, [scanId, report]);

  if (loading) {
    return (
      <div className="w-full mt-8 space-y-6">
        <VulnerabilityProgress completedVulns={completedVulns} />
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Scan en cours...</p>
          <p className="text-sm text-gray-400 mt-2">Analyse des vulnérabilités en cours</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }
  
  if (!scan || !report) {
    return null;
  }
  
  return (
    <div className="w-full mt-8 space-y-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Résultat du Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 md:col-span-2">
              <div className="text-sm text-gray-300">Cible</div>
              <div className="font-mono font-semibold break-all">{scan.target}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-300">Date de début</div>
              <div className="font-semibold">{new Date(scan.created_at).toLocaleString('fr-FR')}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm text-gray-300">Date de fin</div>
              <div className="font-semibold">{scan.completed_at ? new Date(scan.completed_at).toLocaleString('fr-FR') : "-"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Vulnérabilités détectées ({report.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 font-semibold">Aucune vulnérabilité détectée</p>
              <p className="text-gray-400 text-sm">Le scan n'a révélé aucun problème de sécurité</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.map((vuln, idx) => {
                const isVuln = isVulnerable(vuln.description);
                return (
                  <div key={idx} className={`rounded-lg p-4 border ${isVuln ? "bg-red-900/30 border-red-500" : "bg-green-900/20 border-green-500"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {vulnIcons[vuln.vulnerability_type] || <Bug className="w-5 h-5 text-gray-400" />}
                        <span className="font-bold text-lg text-white">{vuln.vulnerability_name}</span>
                      </div>
                      {isVuln ? (
                        <Badge variant="destructive" className="text-xs">Vulnérabilité détectée</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Aucun problème</Badge>
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-300">Type : </span>
                      <span className="text-white font-medium">{vuln.vulnerability_type}</span>
                    </div>
                    <div className="mb-3">
                      {renderVulnDescription(vuln.description)}
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`item-${idx}`} className="border-none">
                        <AccordionTrigger className="text-blue-300 hover:text-blue-200 text-sm">
                          Voir les détails techniques
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="bg-black/40 rounded p-3 text-xs text-gray-200 overflow-x-auto max-h-60">
                            {typeof vuln.description === "string" ? vuln.description : JSON.stringify(vuln.description, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant de barre de progression pour les vulnérabilités
function VulnerabilityProgress({ completedVulns = [] }) {
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Simuler une progression aléatoire pour les vulnérabilités non terminées
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = { ...prev };
        vulnerabilityTypes.forEach(vuln => {
          if (!completedVulns.includes(vuln.type)) {
            // Progression aléatoire entre 0 et 90% pour les vulnérabilités en cours
            if (!newProgress[vuln.type] || Math.random() > 0.7) {
              newProgress[vuln.type] = Math.min(90, (newProgress[vuln.type] || 0) + Math.random() * 20);
            }
          } else {
            // Vulnérabilité terminée
            newProgress[vuln.type] = 100;
          }
        });
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completedVulns]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          Progression du scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vulnerabilityTypes.map((vuln) => {
            const currentProgress = progress[vuln.type] || 0;
            const isCompleted = completedVulns.includes(vuln.type);
            const isInProgress = currentProgress > 0 && currentProgress < 100;
            
            return (
              <div key={vuln.type} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={vuln.color}>{vuln.icon}</span>
                    <span className="text-white font-medium text-sm">{vuln.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {isInProgress && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
                    <span className="text-white text-sm font-mono">
                      {Math.round(currentProgress)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={currentProgress} 
                  className="h-2"
                  style={{
                    '--progress-background': isCompleted ? '#10b981' : isInProgress ? '#f59e0b' : '#6b7280'
                  }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScanPage() {
  const searchParams = useSearchParams();
  const existingScanId = searchParams.get("id");
  const [scanId, setScanId] = useState(null);

  // Si un ID de scan existant est fourni, afficher ses détails
  if (existingScanId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
        <div className="max-w-4xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            <Zap className="w-8 h-8 inline mr-3 text-yellow-400" />
            Détails du Scan
          </h1>
          <ScanDetails />
          <Link href="/historique" className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
            Retour à l&apos;historique
          </Link>
        </div>
      </div>
    );
  }

  // Sinon, afficher le formulaire de nouveau scan
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
          <Zap className="w-8 h-8 inline mr-3 text-yellow-400" />
          Lancer un Scan
        </h1>
        <NewScanForm onScanCreated={setScanId} />
        {scanId && <ScanResult scanId={scanId} />}
      </div>
    </div>
  );
}
