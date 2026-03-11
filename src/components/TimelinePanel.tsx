import { useMemo, useState } from "react";
import type { GameState, TimelineEntry, TimelineType } from "@/game/types";

const typeLabels: Record<TimelineType, { icon: string; label: string }> = {
  build: { icon: "🏗️", label: "建团" },
  album: { icon: "💿", label: "专辑" },
  data: { icon: "📊", label: "数据" },
  opinion: { icon: "📢", label: "舆论" },
  member: { icon: "👤", label: "个人" },
  drama: { icon: "⚡", label: "Drama" },
  milestone: { icon: "🏆", label: "里程碑" },
  negative: { icon: "💔", label: "负面" },
};

function entryTitle(e: TimelineEntry) {
  const ym = `${e.ym.year}.${String(e.ym.month).padStart(2, "0")}`;
  return `${ym} ${typeLabels[e.type].icon} ${e.summary}`;
}

export function TimelinePanel(props: { state: GameState }) {
  const [expanded, setExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | TimelineType>("all");

  const entries = useMemo(() => {
    const all = [...props.state.timeline].sort((a, b) => b.at - a.at);
    const filtered =
      typeFilter === "all" ? all : all.filter((e) => e.type === typeFilter);
    return expanded ? filtered : filtered.slice(0, 4);
  }, [props.state.timeline, expanded, typeFilter]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">大事记</div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-800"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | TimelineType)
            }
          >
            <option value="all">全部</option>
            <option value="build">🏗️ 建团</option>
            <option value="album">💿 专辑</option>
            <option value="data">📊 数据</option>
            <option value="member">👤 个人</option>
            <option value="drama">⚡ Drama</option>
          </select>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            {expanded ? "折叠" : "展开"}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
            还没有大事记记录。
          </div>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className={`rounded-xl border border-zinc-200 bg-white p-3 text-xs ${
                e.highlight ? "font-semibold text-zinc-900" : "text-zinc-700"
              }`}
              title={entryTitle(e)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">{entryTitle(e)}</div>
                  {e.playerChoice ? (
                    <div className="mt-1 text-[11px] text-zinc-500">
                      选择：{e.playerChoice}
                    </div>
                  ) : null}
                  {e.result ? (
                    <div className="mt-1 text-[11px] text-zinc-500">
                      结果：{e.result}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

