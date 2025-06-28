import { History } from "lucide-react";
import RecentScans from "@/components/recent-scans";
import Link from "next/link";

export default function HistoriquePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-5xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
          <History className="w-8 h-8 inline mr-3 text-indigo-400" />
          Historique des Scans
        </h1>
        <p className="text-gray-400 text-lg mb-10 text-center">
          Consultez vos analyses précédentes et leurs résultats
        </p>
        <div className="w-full">
          <RecentScans />
        </div>
        <Link href="/" className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
} 