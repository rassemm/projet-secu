import { Shield, Zap, BarChart3, Play, History } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center">
        <div className="p-4 bg-blue-500/20 rounded-full mb-6">
          <Shield className="w-16 h-16 text-blue-400" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
          Scanner de Vulnérabilités Web
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-6 text-center">
          Protégez vos applications web grâce à une solution moderne de détection automatique des vulnérabilités. Simple, rapide et efficace pour tous vos besoins en cybersécurité.
        </p>
        <ul className="text-gray-200 mb-8 space-y-2 text-base md:text-lg">
          <li>✔️ Analyse automatisée des failles courantes (XSS, SQLi, etc.)</li>
          <li>✔️ Interface intuitive et résultats clairs</li>
          <li>✔️ Statistiques et historique détaillés</li>
        </ul>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/scan" className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-all duration-200">
            <Zap className="w-5 h-5 mr-2" /> Lancer un Scan
          </Link>
          <Link href="/statistiques" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
            <BarChart3 className="w-5 h-5 mr-2" /> Statistiques
          </Link>
          <Link href="/historique" className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200">
            <History className="w-5 h-5 mr-2" /> Historique
          </Link>
        </div>
      </div>
    </div>
  );
}
