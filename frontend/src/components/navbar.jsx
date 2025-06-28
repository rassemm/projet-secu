"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, FileText, Menu, X, Settings, BarChart3, Zap, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="w-[90%] mt-6 bg-white/10 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 text-white group">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
            <span className="font-bold text-xl md:text-2xl">
              Scanner de Vulnérabilités
            </span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <NavLinks />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-48 mt-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-4 pt-4 border-t border-white/10">
            <NavLinks />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLinks() {
  return (
    <>
      <NavLink href="/" icon={<Shield className="h-5 w-5" />} text="Accueil" />
      <NavLink
        href="/statistiques"
        icon={<BarChart3 className="h-5 w-5 text-blue-400" />}
        text="Statistiques"
      />
      <NavLink
        href="/scan"
        icon={<Zap className="h-5 w-5 text-yellow-400" />}
        text="Scan"
      />
      <NavLink
        href="/historique"
        icon={<History className="h-5 w-5 text-indigo-400" />}
        text="Historique"
      />
      <NavLink
        href="/documentation"
        icon={<FileText className="h-5 w-5" />}
        text="Documentation"
      />
      <NavLink
        href="/settings"
        icon={<Settings className="h-5 w-5" />}
        text="Paramètres"
      />
    </>
  );
}

function NavLink({ href, icon, text }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 text-white hover:text-blue-300 transition-all duration-200 p-2 rounded-lg hover:bg-white/5 group"
    >
      <div className="group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <span className="text-lg font-medium">{text}</span>
    </Link>
  );
}
