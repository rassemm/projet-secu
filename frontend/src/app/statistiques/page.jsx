"use client";

import { useEffect, useState } from "react";
import { BarChart3, Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { scanService } from "@/services/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart as RechartsBarChart, Bar
} from "recharts";

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "-";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}m ${sec}s`;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff6b6b", "#00bcd4", "#a3e635", "#f59e42", "#e11d48"];

function groupByDay(items, dateField) {
  const map = {};
  items.forEach(item => {
    const date = new Date(item[dateField]);
    if (isNaN(date)) return;
    const key = date.toISOString().slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState({
    inProgress: 0,
    completed: 0,
    vulnerabilities: 0,
    avgTime: 0,
    scans: [],
    reports: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const scans = await scanService.getAllScans();
      const reports = await scanService.getAllReports();
      const inProgress = scans.filter(s => s.status === "in_progress").length;
      const completed = scans.filter(s => s.status === "completed").length;
      const vulnerabilities = reports.filter(r => {
        try {
          if (!r.description) return false;
          const desc = typeof r.description === "string" ? JSON.parse(r.description) : r.description;
          if (Array.isArray(desc)) return desc.length > 0 && desc.some(item => JSON.stringify(item).toLowerCase().includes("vuln"));
          if (typeof desc === "object" && desc !== null) return JSON.stringify(desc).toLowerCase().includes("vuln");
          return false;
        } catch {
          return false;
        }
      }).length;
      const completedScans = scans.filter(s => s.status === "completed" && s.created_at && s.completed_at);
      const avgTime = completedScans.length > 0 ?
        completedScans.map(s => (new Date(s.completed_at) - new Date(s.created_at)) / 1000)
          .reduce((a, b) => a + b, 0) / completedScans.length : 0;
      setStats({ inProgress, completed, vulnerabilities, avgTime, scans, reports });
      setLoading(false);
    } catch (err) {
      setError("Erreur lors de la récupération des statistiques.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Préparation des données pour les graphiques
  // 1. Courbe d'évolution du nombre de scans par jour
  const scansByDay = groupByDay(stats.scans, "created_at");
  const scansPerDayData = Object.entries(scansByDay).map(([date, arr]) => ({ date, scans: arr.length }));

  // 2. Courbe d'évolution du temps moyen des scans par jour
  const avgTimePerDayData = Object.entries(scansByDay).map(([date, arr]) => {
    const completed = arr.filter(s => s.status === "completed" && s.completed_at);
    const avg = completed.length > 0 ? completed.map(s => (new Date(s.completed_at) - new Date(s.created_at)) / 1000).reduce((a, b) => a + b, 0) / completed.length : 0;
    return { date, avgTime: Math.round(avg) };
  });

  // 3. Courbe d'évolution du nombre de vulnérabilités détectées par jour
  const reportsByDay = groupByDay(stats.reports, "created_at");
  const vulnsPerDayData = Object.entries(reportsByDay).map(([date, arr]) => ({ date, vulns: arr.length }));

  // 4. Camembert de répartition des statuts de scans
  const statusPieData = [
    { name: "En cours", value: stats.inProgress },
    { name: "Terminés", value: stats.completed },
    { name: "Autres", value: stats.scans.length - stats.inProgress - stats.completed }
  ];

  // 5. Histogramme du nombre de vulnérabilités par type
  const vulnTypeCount = {};
  stats.reports.forEach(r => {
    if (!vulnTypeCount[r.vulnerability_type]) vulnTypeCount[r.vulnerability_type] = 0;
    vulnTypeCount[r.vulnerability_type]++;
  });
  const vulnTypeBarData = Object.entries(vulnTypeCount).map(([type, count]) => ({ type, count }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-6xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
          <BarChart3 className="w-8 h-8 inline mr-3 text-blue-400" />
          Statistiques
        </h1>
        <p className="text-gray-400 text-lg mb-10 text-center">
          Vue d&apos;ensemble de vos analyses de sécurité
        </p>
        {loading ? (
          <div className="text-white text-lg">Chargement des statistiques...</div>
        ) : error ? (
          <div className="text-red-400 text-lg">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
              <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-xl p-6 flex flex-col items-center">
                <div className="p-3 bg-blue-500/20 rounded-full mb-2">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stats.inProgress}</h3>
                <p className="text-gray-300">Scans en Cours</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-xl p-6 flex flex-col items-center">
                <div className="p-3 bg-green-500/20 rounded-full mb-2">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stats.completed}</h3>
                <p className="text-gray-300">Scans Terminés</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-xl p-6 flex flex-col items-center">
                <div className="p-3 bg-red-500/20 rounded-full mb-2">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stats.vulnerabilities}</h3>
                <p className="text-gray-300">Vulnérabilités Détectées</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border-white/20 rounded-xl p-6 flex flex-col items-center">
                <div className="p-3 bg-purple-500/20 rounded-full mb-2">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{formatDuration(stats.avgTime)}</h3>
                <p className="text-gray-300">Temps Moyen</p>
              </div>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Évolution du nombre de scans par jour</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={scansPerDayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#fff" fontSize={12} />
                    <YAxis stroke="#fff" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="scans" stroke="#8884d8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Évolution du temps moyen des scans (s)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={avgTimePerDayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#fff" fontSize={12} />
                    <YAxis stroke="#fff" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="#a3e635" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Évolution des vulnérabilités détectées par jour</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={vulnsPerDayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#fff" fontSize={12} />
                    <YAxis stroke="#fff" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="vulns" stroke="#ff6b6b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Répartition des statuts de scans</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {statusPieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Histogramme du nombre de vulnérabilités par type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RechartsBarChart data={vulnTypeBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" stroke="#fff" fontSize={12} />
                  <YAxis stroke="#fff" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ff6b6b" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        <Link href="/" className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
} 