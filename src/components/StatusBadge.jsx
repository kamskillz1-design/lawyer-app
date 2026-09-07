import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  blue: "bg-sky-50 text-sky-800 border-sky-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  stone: "bg-stone-100 text-stone-700 border-stone-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
};

const MAP = {
  new: "blue", awaiting_response: "blue", appointment_proposed: "amber", appointment_booked: "amber",
  consultation_completed: "violet", awaiting_engagement: "amber", converted: "green", not_proceeding: "stone",
  referred_elsewhere: "stone", closed: "stone",
  todo: "blue", in_progress: "amber", blocked: "red", done: "green",
  needed: "amber", uploaded: "blue", being_checked: "violet", accepted: "green", needs_correction: "red", not_required: "stone",
  urgent: "red", high: "amber", normal: "stone", low: "stone",
  received: "blue", draft: "stone", translation_pending: "amber", pending_review: "amber", lawyer_pending: "red", sent: "green", internal_note: "stone",
  draft_: "stone", paid: "green", overdue: "red", void: "stone",
  scheduled: "blue", confirmed: "green", completed: "stone", cancelled: "stone", no_show: "red",
  uploaded_: "blue", under_review: "violet", requested: "amber", not_requested: "stone",
  accepted_: "green", needs_correction_: "red", missing_page: "red", incorrect_document: "red",
  expired: "red", replaced: "stone", not_applicable: "stone", archived: "stone",
};

export default function StatusBadge({ value, label }) {
  const tone = TONES[MAP[value] || "stone"] || TONES.stone;
  return (
    <Badge variant="outline" className={cn("font-normal border", tone)}>
      {label || value}
    </Badge>
  );
}