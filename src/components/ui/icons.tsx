import {
  Briefcase,
  CalendarHeart,
  Camera,
  ClipboardCheck,
  ConciergeBell,
  DoorOpen,
  FileText,
  House,
  KeyRound,
  PartyPopper,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icons the owner can choose for a service (labels shown in the admin). */
export const SERVICE_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  key: { label: "Clé", icon: KeyRound },
  door: { label: "Porte", icon: DoorOpen },
  search: { label: "Contrôle", icon: ClipboardCheck },
  bell: { label: "Conciergerie", icon: ConciergeBell },
  file: { label: "Document", icon: FileText },
  briefcase: { label: "Mallette", icon: Briefcase },
  calendar: { label: "Événement", icon: CalendarHeart },
  party: { label: "Fête", icon: PartyPopper },
  trophy: { label: "Sport", icon: Trophy },
  home: { label: "Maison", icon: House },
  camera: { label: "Photo", icon: Camera },
  users: { label: "Personnes", icon: Users },
  sparkles: { label: "Étincelles", icon: Sparkles },
};

export function ServiceIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const entry = SERVICE_ICONS[name];
  if (!entry) return null;
  const Icon = entry.icon;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.5} />;
}
