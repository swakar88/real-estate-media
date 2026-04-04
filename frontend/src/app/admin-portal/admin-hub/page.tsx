"use client";

import Link from "next/link";
import { Image as ImageIcon, DollarSign, Mail, FileText, Settings, FolderGit2, ArrowUpRight, BookMarked, Shield } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ScrollReveal";

const hubTiles = [
  {
    title: "Site Media",
    description: "Manage hero backgrounds, feature videos, and branding assets displayed on the public site.",
    href: "/admin-portal/site-media",
    icon: ImageIcon,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  {
    title: "Pricing & Packages",
    description: "Control all service rates, package configurations, and add-on pricing.",
    href: "/admin-portal/pricing",
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    title: "Email Config",
    description: "Configure the outgoing SMTP email server used for all transactional emails.",
    href: "/admin-portal/email-config",
    icon: Mail,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    title: "Email Templates",
    description: "Customise the content of system-generated emails sent to clients and photographers.",
    href: "/admin-portal/email-templates",
    icon: FileText,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    title: "Site Settings",
    description: "Manage global settings — site name, logo, referral reward configuration, and admin alerts.",
    href: "/admin-portal/site-settings",
    icon: Settings,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    title: "Portfolio Gallery",
    description: "Upload and manage the portfolio images shown in the public gallery.",
    href: "/admin-portal/gallery",
    icon: FolderGit2,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
  {
    title: "Email Audit Log",
    description: "View the full history of all outgoing emails — sent, failed, and their trigger events.",
    href: "/admin-portal/email-log",
    icon: BookMarked,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
  },
  {
    title: "Manage Admins",
    description: "Invite and manage admin accounts with access to this portal.",
    href: "/admin-portal/admins",
    icon: Shield,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
];

export default function AdminHubPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <ScrollReveal>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight italic">
            Admin <span className="text-primary italic">Hub</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Configuration and setup pages for site content, pricing, email, and settings.
          </p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <StaggerItem key={tile.href}>
              <Link
                href={tile.href}
                className={`group relative flex flex-col bg-card/80 backdrop-blur-sm border ${tile.border} rounded-[2.5rem] p-8 shadow-gold hover:shadow-gold-heavy transition-all hover:-translate-y-1 h-full`}
              >
                <div className={`w-14 h-14 rounded-2xl ${tile.bg} ${tile.color} flex items-center justify-center mb-6 shadow-inner`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black mb-2 text-foreground group-hover:text-primary transition-colors">
                  {tile.title}
                </h2>
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                  {tile.description}
                </p>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className={`w-5 h-5 ${tile.color}`} />
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
