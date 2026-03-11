import type { GameState } from "@/game/types";

export function TopNav(props: {
  state: GameState;
  onOpenMembers: () => void;
  onOpenAlbums: () => void;
  onOpenStats: () => void;
}) {
  const { state } = props;
  const name = state.group.groupName ?? "未命名";
  const ym = `${state.now.year}.${String(state.now.month).padStart(2, "0")}`;
  const comebackNo = state.comebackIndex;
  const albumType =
    state.phase === "phase0"
      ? "建团"
      : state.miniCountSinceFull >= 2
        ? "正规#"
        : "Mini#";

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-zinc-900">
            {name}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span>{ym}</span>
            <span>回归#{comebackNo}</span>
            <span>{albumType}</span>
            <span>合约剩余 {state.contractMonthsLeft} 月</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onOpenMembers}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm transition hover:bg-zinc-50"
            aria-label="成员"
            title="成员"
          >
            👤
          </button>
          <button
            type="button"
            onClick={props.onOpenAlbums}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm transition hover:bg-zinc-50"
            aria-label="专辑"
            title="专辑"
          >
            💿
          </button>
          <button
            type="button"
            onClick={props.onOpenStats}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm transition hover:bg-zinc-50"
            aria-label="数据"
            title="数据"
          >
            📊
          </button>
        </div>
      </div>
    </div>
  );
}

