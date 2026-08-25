import { useState } from "react";
import { PHOTO_SPECS, CATEGORIES } from "@/constants/specs";
import { PhotoSpec } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Ruler } from "lucide-react";

interface SpecSelectorProps {
  selected: PhotoSpec;
  onChange: (spec: PhotoSpec) => void;
}

export default function SpecSelector({ selected, onChange }: SpecSelectorProps) {
  const [activeCategory, setActiveCategory] = useState("Pakistan Official");

  const filtered =
    activeCategory === "All"
      ? PHOTO_SPECS
      : PHOTO_SPECS.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              activeCategory === cat
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Spec Grid */}
      <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
        {filtered.map((spec) => (
          <button
            key={spec.id}
            onClick={() => onChange(spec)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 group",
              selected.id === spec.id
                ? "bg-cyan-500/15 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <span className="text-2xl flex-shrink-0">{spec.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-semibold truncate",
                    selected.id === spec.id ? "text-cyan-300" : "text-white"
                  )}
                >
                  {spec.name}
                </p>
                {selected.id === spec.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Ruler className="w-3 h-3 text-slate-500" />
                <p className="text-xs text-slate-500 truncate">{spec.description}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500">{spec.width}×{spec.height}</p>
              <p className="text-xs text-slate-600">px</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
