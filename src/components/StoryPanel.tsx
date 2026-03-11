import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChoicePrompt, GameState, PlayerAction, TraineeSortableKey } from "@/game/types";
import { useState } from "react";

function RoleBadge({ role }: { role: "system" | "player" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        role === "system"
          ? "bg-zinc-100 text-zinc-700"
          : "bg-indigo-50 text-indigo-700"
      }`}
    >
      {role === "system" ? "系统" : "你"}
    </span>
  );
}

function StatPill(props: { label: string; value: number }) {
  const v = Math.max(1, Math.min(5, props.value));
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700">
      <span className="text-zinc-500">{props.label}</span>
      <span className="font-semibold">{v}</span>
    </span>
  );
}

function SortSelect(props: {
  value?: TraineeSortableKey;
  onChange: (k: TraineeSortableKey) => void;
}) {
  return (
    <select
      className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-800"
      value={props.value ?? "talent"}
      onChange={(e) => props.onChange(e.target.value as TraineeSortableKey)}
    >
      <option value="talent">才华</option>
      <option value="eq">情商</option>
      <option value="vocal">唱功</option>
      <option value="dance">跳舞</option>
      <option value="visual">外貌</option>
      <option value="age">年龄</option>
      <option value="trainingMonths">练习时长</option>
      <option value="heightCm">身高</option>
    </select>
  );
}

function TraineeTable(props: {
  prompt: Extract<ChoicePrompt, { kind: "memberPick" }>;
  onAction: (a: PlayerAction) => void;
}) {
  const { prompt } = props;
  const readOnly = prompt.promptId === "phase0.traineePool";
  const selected = new Set(prompt.selectedIds);

  const trainees = [...prompt.trainees].sort((a, b) => {
    const dir = prompt.sortDir === "asc" ? 1 : -1;
    const key = prompt.sortKey ?? "talent";
    const va =
      key === "age"
        ? a.age
        : key === "heightCm"
          ? a.fixed.heightCm
          : key === "trainingMonths"
            ? a.trainingMonths
            : key === "eq"
              ? a.fixed.eq
              : key === "vocal"
                ? a.growth.vocal
                : key === "dance"
                  ? a.growth.dance
                  : key === "visual"
                    ? a.growth.visual
                    : a.fixed.talent;
    const vb =
      key === "age"
        ? b.age
        : key === "heightCm"
          ? b.fixed.heightCm
          : key === "trainingMonths"
            ? b.trainingMonths
            : key === "eq"
              ? b.fixed.eq
              : key === "vocal"
                ? b.growth.vocal
                : key === "dance"
                  ? b.growth.dance
                  : key === "visual"
                    ? b.growth.visual
                    : b.fixed.talent;
    return (va - vb) * dir;
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-zinc-900">
          练习生候选池
          <span className="ml-2 text-xs font-normal text-zinc-500">
            已选 {prompt.selectedIds.length}/{prompt.memberCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SortSelect
            value={prompt.sortKey}
            onChange={(k) =>
              props.onAction({
                type: "chooseOption",
                optionId: `sort:${k}`,
              })
            }
          />
        </div>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 text-[11px] text-zinc-500">
              <th className="py-2 pr-3">选择</th>
              <th className="py-2 pr-3">韩文名</th>
              <th className="py-2 pr-3">中文名</th>
              <th className="py-2 pr-3">艺名</th>
              <th className="py-2 pr-3">年龄</th>
              <th className="py-2 pr-3">练习</th>
              <th className="py-2 pr-3">身高</th>
              <th className="py-2 pr-3">背景</th>
              <th className="py-2 pr-3">五维</th>
              <th className="py-2 pr-3">性格</th>
              <th className="py-2 pr-3">⚡评估</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map((t) => {
              const isSel = selected.has(t.id);
              const canAdd =
                readOnly ? false : isSel || prompt.selectedIds.length < prompt.memberCount;
              return (
                <tr
                  key={t.id}
                  className={`border-b border-zinc-100 align-top ${
                    isSel ? "bg-indigo-50/50" : ""
                  }`}
                >
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      disabled={readOnly || !canAdd}
                      onClick={() =>
                        props.onAction({ type: "toggleDebutMember", traineeId: t.id })
                      }
                      className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
                        readOnly
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
                          : isSel
                          ? "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                          : canAdd
                            ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                            : "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
                      }`}
                    >
                      {readOnly ? "查看" : isSel ? "已选" : "选择"}
                    </button>
                  </td>
                  <td className="py-2 pr-3 font-medium text-zinc-900">{t.koreanName}</td>
                  <td className="py-2 pr-3">{t.chineseName}</td>
                  <td className="py-2 pr-3 font-semibold tracking-wide">{t.stageName}</td>
                  <td className="py-2 pr-3">{t.age}</td>
                  <td className="py-2 pr-3">
                    {Math.floor(t.trainingMonths / 12)}年{t.trainingMonths % 12}月
                  </td>
                  <td className="py-2 pr-3">{t.fixed.heightCm}cm</td>
                  <td className="py-2 pr-3 text-zinc-600">{t.background.blurb}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      <StatPill label="情商" value={t.fixed.eq} />
                      <StatPill label="唱" value={t.growth.vocal} />
                      <StatPill label="舞" value={t.growth.dance} />
                      <StatPill label="才" value={t.fixed.talent} />
                      <StatPill label="貌" value={t.growth.visual} />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-zinc-600">{t.personality}</td>
                  <td className="py-2 pr-3 text-zinc-700">{t.oneLine}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StoryPanel(props: {
  state: GameState;
  onAction: (a: PlayerAction) => void;
}) {
  const prompt = props.state.prompt;
  const [hotTab, setHotTab] = useState<"kr" | "weibo" | "doubanYu" | "doubanJuhao">(
    "kr",
  );
  const hot = props.state.ops?.lastFeedback?.hotPosts;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="max-h-[52vh] overflow-auto p-5">
        <div className="space-y-4">
          {props.state.dialogueLog.map((d) => (
            <div key={d.id} className="space-y-2">
              <RoleBadge role={d.role} />
              <div className="md text-zinc-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.markdown}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        {prompt.kind === "memberPick" ? (
          <div className="mt-6">
            <TraineeTable prompt={prompt} onAction={props.onAction} />
          </div>
        ) : null}

        {prompt.kind === "positions" ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">位置分配</div>
            <div className="mt-3 space-y-3">
              {prompt.members.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-zinc-900">
                      {m.stageName}
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {m.koreanName} / {m.chineseName}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      当前：{(prompt.positionsByMemberId[m.id] ?? []).join("、") || "—"}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "队长",
                      "主唱",
                      "领唱",
                      "主舞",
                      "领舞",
                      "主rapper",
                      "副rapper",
                      "门面",
                      "忙内",
                    ].map((pos) => {
                      const cur = new Set(prompt.positionsByMemberId[m.id] ?? []);
                      const active = cur.has(pos);
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            const next = new Set(prompt.positionsByMemberId[m.id] ?? []);
                            if (next.has(pos)) next.delete(pos);
                            else next.add(pos);
                            props.onAction({
                              type: "setPositions",
                              memberId: m.id,
                              positions: Array.from(next),
                            });
                          }}
                          className={`h-8 rounded-full border px-3 text-xs font-semibold transition ${
                            active
                              ? "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                              : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                          }`}
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hot ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-900">多平台热帖</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {(
                  [
                    { id: "kr", label: "🇰🇷 韩国社区" },
                    { id: "weibo", label: "🇨🇳 微博" },
                    { id: "doubanYu", label: "🇨🇳 豆瓣韩娱组" },
                    { id: "doubanJuhao", label: "🇨🇳 豆瓣句号组" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHotTab(t.id)}
                    className={`h-9 rounded-full border px-3 font-semibold transition ${
                      hotTab === t.id
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {(hotTab === "kr"
                ? hot.kr
                : hotTab === "weibo"
                  ? hot.weibo
                  : hotTab === "doubanYu"
                    ? hot.doubanYu
                    : hot.doubanJuhao
              ).map((p, idx) => (
                <div
                  key={`${p.badge}_${idx}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
                    <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-zinc-700">
                      [{p.badge}]
                    </span>
                    {typeof p.up === "number" ? <span>👍 {p.up}</span> : null}
                    {typeof p.down === "number" ? <span>👎 {p.down}</span> : null}
                    {typeof p.comments === "number" ? <span>💬 {p.comments}</span> : null}
                    {typeof p.reposts === "number" ? <span>🔄 {p.reposts}</span> : null}
                    {typeof p.likes === "number" ? <span>❤️ {p.likes}</span> : null}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap leading-6">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500">
        {prompt.title}
      </div>
    </div>
  );
}

