import {
  Guitar,
  Home,
  LayoutList,
  Settings,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/bands", label: "Bandas", icon: Guitar },
  { href: "/practice", label: "Práctica", icon: LayoutList },
  { href: "/statistics", label: "Estadísticas", icon: BarChart3 },
  { href: "/settings", label: "Ajustes", icon: Settings },
];
