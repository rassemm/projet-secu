"use client";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Trash } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { scanService } from "@/services/api";

export default function RecentScans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInProgress, setHasInProgress] = useState(false);
  const [deletingScan, setDeletingScan] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  // Fonction de récupération des scans
  const fetchScans = async () => {
    try {
      const data = await scanService.getAllScans();
      setScans(data);
      // Vérifie s'il y a des scans en cours ou  en attent
      setHasInProgress(
        data.some(
          (scan) => scan.status === "in_progress" || scan.status === "pending"
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de suppression d'un scan individuel
  const handleDeleteScan = async (scanId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce scan ?")) {
      return;
    }
    
    setDeletingScan(scanId);
    try {
      await scanService.deleteScan(scanId);
      await fetchScans(); // Recharger la liste
    } catch (err) {
      alert("Erreur lors de la suppression du scan : " + err.message);
    } finally {
      setDeletingScan(null);
    }
  };

  // Fonction de suppression de tous les scans
  const handleDeleteAllScans = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer TOUS les scans ? Cette action est irréversible.")) {
      return;
    }
    
    setDeletingAll(true);
    try {
      await scanService.deleteAllScans();
      await fetchScans(); // Recharger la liste
    } catch (err) {
      alert("Erreur lors de la suppression de tous les scans : " + err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  useEffect(() => {
    fetchScans();

    const handleScanCreated = () => {
      fetchScans();
      setHasInProgress(true);
    };
    window.addEventListener("scanCreated", handleScanCreated);

    const intervalId = setInterval(() => {
      if (hasInProgress) {
        fetchScans();
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("scanCreated", handleScanCreated);
    };
  }, [hasInProgress]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="space-y-4">
      {/* Bouton de suppression de tous les scans */}
      {scans.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleDeleteAllScans}
            disabled={deletingAll}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            {deletingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            {deletingAll ? "Suppression..." : "Supprimer tous les scans"}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white text-sm md:text-lg">URL</TableHead>
              <TableHead className="text-white text-sm md:text-lg">
                Statut
              </TableHead>
              <TableHead className="text-white text-sm md:text-lg hidden md:table-cell">
                Date
              </TableHead>
              <TableHead className="text-white text-sm md:text-lg">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium text-white text-sm md:text-base">
                    {scan.target}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        scan.status === "completed"
                          ? "outline"
                          : scan.status === "in_progress"
                          ? ""
                          : scan.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs md:text-sm whitespace-nowrap"
                    >
                      {scan.status === "pending"
                        ? "En attente"
                        : scan.status === "in_progress"
                        ? "En cours"
                        : scan.status === "failed"
                        ? "Échoué"
                        : "Terminé"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white text-sm md:text-base hidden md:table-cell">
                    {scan.created_at}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {scan.status === "completed" && (
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="text-xs md:text-sm"
                        >
                          <Link
                            href={{
                              pathname: "/scan",
                              query: {
                                id: scan.id,
                              },
                            }}
                          >
                            Voir Détails
                          </Link>
                        </Button>
                      )}
                      {scan.status === "in_progress" ? (
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-white" />
                      ) : (
                        <Button
                          onClick={() => handleDeleteScan(scan.id)}
                          disabled={deletingScan === scan.id}
                          variant="destructive"
                          size="sm"
                          className="text-xs md:text-sm"
                        >
                          {deletingScan === scan.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
