import { useMemo, useState } from "react";
import type { ChoicePrompt, PlayerAction } from "@/game/types";

function OptionCard(props: {
  label: string;
  description?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        props.disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      <div className="text-sm font-semibold text-zinc-900">{props.label}</div>
      {props.description ? (
        <div className="mt-1 text-xs leading-5 text-zinc-600">
          {props.description}
        </div>
      ) : null}
    </button>
  );
}

export function ChoicePanel(props: {
  prompt: ChoicePrompt;
  onAction: (a: PlayerAction) => void;
}) {
  const p = props.prompt;
  const [custom, setCustom] = useState("");
  const [input, setInput] = useState("");
  const [clickedId, setClickedId] = useState<string | null>(null);

  const optionIds = useMemo(() => {
    if (p.kind !== "options") return [];
    return p.options.map((o) => o.id);
  }, [p]);

  if (p.kind === "options") {
    const cols =
      p.options.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2";
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-zinc-500">{p.title}</div>
        {p.helperText ? (
          <div className="mt-1 text-xs text-zinc-500">{p.helperText}</div>
        ) : null}

        <div className={`mt-4 grid gap-3 ${cols}`}>
          {p.options.map((o) => {
            const disabled = clickedId !== null && clickedId !== o.id;
            return (
              <OptionCard
                key={o.id}
                label={o.label}
                description={o.description}
                disabled={disabled}
                onClick={() => {
                  setClickedId(o.id);
                  props.onAction({ type: "chooseOption", optionId: o.id });
                }}
              />
            );
          })}
        </div>

        {p.allowCustomInput ? (
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={p.customPlaceholder ?? "自定义输入"}
                className="h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                className="h-11 shrink-0 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={() => {
                  const text = custom.trim();
                  if (!text) return;
                  setClickedId(optionIds[0] ?? "custom");
                  props.onAction({
                    type: "chooseOption",
                    optionId: optionIds[0] ?? "custom",
                    customText: text,
                  });
                }}
              >
                确认
              </button>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              自定义会覆盖候选（仍需满足规则）。
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (p.kind === "input") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-zinc-500">{p.title}</div>
        {p.helperText ? (
          <div className="mt-1 text-xs text-zinc-500">{p.helperText}</div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={p.placeholder}
            inputMode={p.inputType === "number" ? "numeric" : undefined}
            className="h-11 w-full rounded-full border border-zinc-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="button"
            className="h-11 shrink-0 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            onClick={() => props.onAction({ type: "submitInput", value: input })}
          >
            {p.submitLabel ?? "确认"}
          </button>
        </div>
      </div>
    );
  }

  if (p.kind === "memberPick") {
    const isPoolView = p.promptId === "phase0.traineePool";
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-zinc-500">{p.title}</div>
        {p.helperText ? (
          <div className="mt-1 text-xs text-zinc-500">{p.helperText}</div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-900">
            {isPoolView ? `候选 ${p.trainees.length} 人` : `已选 ${p.selectedIds.length}/${p.memberCount}`}
          </div>
          <button
            type="button"
            className="h-11 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            onClick={() => props.onAction({ type: "confirmDebut" })}
          >
            {isPoolView ? "进入出道选择" : "确认阵容"}
          </button>
        </div>
      </div>
    );
  }

  // positions
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-zinc-500">{p.title}</div>
      {p.helperText ? (
        <div className="mt-1 text-xs text-zinc-500">{p.helperText}</div>
      ) : null}
      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          className="h-11 rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          onClick={() => props.onAction({ type: "confirmPositions" })}
        >
          确认并进入运营
        </button>
      </div>
    </div>
  );
}

