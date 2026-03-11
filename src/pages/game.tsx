import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadGame, resetGame, saveGame } from "@/game/storage";
import { createNewGame, applyPlayerChoice } from "@/game/state";
import type { GameState, PlayerAction, TraineeSortableKey } from "@/game/types";
import { TopNav } from "@/components/TopNav";
import { StoryPanel } from "@/components/StoryPanel";
import { ChoicePanel } from "@/components/ChoicePanel";
import { TimelinePanel } from "@/components/TimelinePanel";
import { ModalShell } from "@/components/ModalShell";

export default function GamePage() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window === "undefined") return createNewGame();
    const url = new URL(window.location.href);
    const isNew = url.searchParams.get("new") === "1";
    if (isNew) {
      resetGame({ keepRoute: true });
      const s = createNewGame();
      saveGame(s, { immediate: true });
      return s;
    }
    return loadGame() ?? createNewGame();
  });
  const [modal, setModal] = useState<"none" | "members" | "albums" | "stats">(
    "none",
  );

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const title = useMemo(() => {
    if (state.phase === "phase0") return "Phase 0 · 建团";
    if (state.phase === "ops") return "Phase 1–7 · 运营";
    return "终章";
  }, [state.phase]);

  const onAction = (a: PlayerAction) => {
    // UI-only helper actions (sorting) are encoded as chooseOption with a prefix.
    if (
      a.type === "chooseOption" &&
      a.optionId.startsWith("sort:") &&
      state.prompt.kind === "memberPick"
    ) {
      const k = a.optionId.slice("sort:".length) as TraineeSortableKey;
      setState((s) => {
        if (s.prompt.kind !== "memberPick") return s;
        const sameKey = s.prompt.sortKey === k;
        const nextDir = sameKey && s.prompt.sortDir === "desc" ? "asc" : "desc";
        return { ...s, prompt: { ...s.prompt, sortKey: k, sortDir: nextDir } };
      });
      return;
    }

    setState((s) => applyPlayerChoice(s, a));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <TopNav
        state={state}
        onOpenMembers={() => setModal("members")}
        onOpenAlbums={() => setModal("albums")}
        onOpenStats={() => setModal("stats")}
      />

      <div className="mx-auto w-full max-w-2xl px-4 py-5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div>{title}</div>
          <Link className="text-indigo-600 hover:underline" href="/">
            返回首页
          </Link>
        </div>

        <div className="mt-3 space-y-4">
          <StoryPanel state={state} onAction={onAction} />
          <ChoicePanel key={state.prompt.promptId} prompt={state.prompt} onAction={onAction} />
          <TimelinePanel state={state} />
        </div>
      </div>

      <ModalShell
        open={modal === "members"}
        title="👤 成员"
        onClose={() => setModal("none")}
      >
        {state.group.members?.length ? (
          <div className="space-y-3">
            {state.group.members.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="text-sm font-semibold text-zinc-900">
                  {m.stageName}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {m.koreanName} / {m.chineseName}
                  </span>
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  年龄 {m.age} · 身高 {m.fixed.heightCm}cm · 练习{" "}
                  {Math.floor(m.trainingMonths / 12)}年{m.trainingMonths % 12}月
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  位置：{m.debutPositions?.join("、") || "—"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-600">
            还未确认出道阵容。请先完成 Phase 0。
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={modal === "albums"}
        title="💿 专辑"
        onClose={() => setModal("none")}
      >
        <div className="text-sm text-zinc-600">
          运营阶段会在这里显示专辑历史与回归记录。
        </div>
      </ModalShell>

      <ModalShell
        open={modal === "stats"}
        title="📊 数据"
        onClose={() => setModal("none")}
      >
        <div className="text-sm text-zinc-600">
          运营阶段会在这里显示评分、音源、打歌成绩等总览。
        </div>
      </ModalShell>
    </div>
  );
}

