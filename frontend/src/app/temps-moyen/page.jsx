import { Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TempsMoyenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-md w-full">
        <div className="p-4 bg-purple-500/20 rounded-full mb-6">
          <Clock className="w-16 h-16 text-purple-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">Temps Moyen</h1>
        <p className="text-gray-300 mb-6 text-center">Temps moyen d&apos;exécution des scans réalisés.</p>
        <div className="text-6xl font-extrabold text-white mb-8">0</div>
        <Link href="/" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
} 