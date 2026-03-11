import Link from "next/link";
import { useState } from "react";
import { loadGame } from "@/game/storage";

export default function Home() {
  const [hasSave] = useState(() => Boolean(loadGame()));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-zinc-700">
              K-POP Producer Sim
            </div>
            <div className="text-xs text-zinc-500">Local save</div>
          </div>

          <div className="mt-6">
            <div className="text-2xl font-semibold tracking-tight">
              男团制作人模拟
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              你是韩国娱乐公司新人制作人。从零打造一个虚构但韩味十足的男团。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              href="/game?new=1"
            >
              开始新游戏
            </Link>
            <Link
              className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition ${
                hasSave
                  ? "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                  : "pointer-events-none border-zinc-200 bg-zinc-50 text-zinc-400"
              }`}
              href="/game"
              aria-disabled={!hasSave}
              tabIndex={hasSave ? 0 : -1}
            >
              继续游戏
            </Link>
            <div className="text-xs text-zinc-500">
              未配置任何 API Key 也可以游玩（会自动使用 mock）。
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
