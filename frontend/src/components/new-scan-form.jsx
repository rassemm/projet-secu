"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanService } from '@/services/api';
import { Search, Loader2, Zap, AlertCircle } from "lucide-react";

export default function NewScanForm({ onScanCreated }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await scanService.createScan(url);
      if (onScanCreated && res && res.scan_id) {
        onScanCreated(res.scan_id);
      }
      window.dispatchEvent(new Event('scanCreated'));
      setUrl("");
    } catch (error) {
      console.error('Erreur lors de la création du scan:', error);
      setError("Erreur lors de la création du scan. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="url" className="text-white text-base md:text-lg font-medium flex items-center">
          <Search className="w-5 h-5 mr-2 text-blue-400" />
          URL à scanner
        </Label>
        <div className="relative">
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="bg-white/20 border-white/30 text-white placeholder-white/60 text-sm md:text-lg h-12 pl-4 pr-12 focus:bg-white/25 focus:border-blue-400 transition-all duration-300"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Globe className="w-5 h-5 text-white/40" />
          </div>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm md:text-lg h-12 font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Création du scan...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Lancer le scan
            </>
          )}
        </Button>
        
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Le scan analysera automatiquement les vulnérabilités de sécurité
          </p>
        </div>
      </div>
    </form>
  );
}

// Composant Globe pour l'icône dans l'input
function Globe(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="m9 12 6 6 6-6" />
    </svg>
  );
}
