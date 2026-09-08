import React from "react";
import { Search } from "lucide-react";

export default function ClientSearch({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 h-9 px-3 rounded-xl border bg-card w-full sm:w-64">
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm w-full min-w-0"
      />
    </div>
  );
}