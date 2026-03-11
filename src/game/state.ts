import { generateGroupNameCandidates, generateTraineePool, pickConceptOptions } from "@/game/generators";
import { createRng, randomSeed } from "@/game/rng";
import type {
  AlbumDraft,
  ChoicePrompt,
  GameState,
  GroupConcept,
  Member,
  PersonalActivityType,
  PersonalPlan,
  PlayerAction,
  Trainee,
} from "@/game/types";
import {
  advanceTimeForNextComeback,
  genAlbumConceptChoices,
  genAlbumNameChoices,
  genFeedback,
  genMemberFitTableMarkdown,
  genPersonalActivityChoices,
  genTitleStyleChoices,
  maybeDrama,
  nextAlbumType,
  resolveDrama,
  resolvePersonalPlan,
} from "@/game/opsGenerators";

export const STATE_VERSION = 2;

function uid(prefix: string, seed: number) {
  return `${prefix}_${seed.toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

function ymToString(now: { year: number; month: number }) {
  return `${now.year}.${String(now.month).padStart(2, "0")}`;
}

function pushSystem(state: GameState, markdown: string): GameState {
  return {
    ...state,
    dialogueLog: [
      ...state.dialogueLog,
      { id: uid("dlg", state.seed), at: Date.now(), role: "system", markdown },
    ],
  };
}

function pushPlayer(state: GameState, markdown: string): GameState {
  return {
    ...state,
    dialogueLog: [
      ...state.dialogueLog,
      { id: uid("dlg", state.seed), at: Date.now(), role: "player", markdown },
    ],
  };
}

function timelineAdd(
  state: GameState,
  params: {
    type: GameState["timeline"][number]["type"];
    summary: string;
    playerChoice?: string;
    result?: string;
    highlight?: boolean;
    memberIds?: string[];
  },
): GameState {
  return {
    ...state,
    timeline: [
      ...state.timeline,
      {
        id: uid("tl", state.seed),
        at: Date.now(),
        ym: state.now,
        type: params.type,
        summary: params.summary,
        playerChoice: params.playerChoice,
        result: params.result,
        highlight: params.highlight,
        memberIds: params.memberIds,
      },
    ],
  };
}

function timelineBuild(state: GameState, summary: string, playerChoice?: string): GameState {
  return timelineAdd(state, { type: "build", summary, playerChoice });
}

function conceptPrompt(seed: number): ChoicePrompt {
  const concepts = pickConceptOptions(seed, 10);
  return {
    kind: "options",
    promptId: "phase0.concept",
    title: "Phase 0 · Step 1：确定团体概念/定位",
    helperText: "请选择一个概念方向。每局会随机给出不同候选。",
    options: concepts.map((c) => ({
      id: c.id,
      label: `${c.name} (${c.enName})`,
      description: c.blurb,
    })),
  };
}

export function createNewGame(seed = randomSeed()): GameState {
  const state: GameState = {
    version: STATE_VERSION,
    seed,
    now: { year: 2025, month: 3 },
    contractMonthsLeft: 84,
    comebackIndex: 0,
    miniCountSinceFull: 0,
    phase: "phase0",
    phase0Step: "concept" as const,
    prompt: conceptPrompt(seed),
    group: {},
    dialogueLog: [],
    timeline: [],
  };

  const intro = [
    "欢迎来到 **K-POP 男团制作人模拟**。",
    "",
    `当前时间：**${ymToString(state.now)}**  合约：**${state.contractMonthsLeft} 个月**`,
    "",
    "你将从零打造一个虚构男团。系统不会替你做决定；每一步都会给你选项或输入框。",
  ].join("\n");

  return pushSystem(state, intro);
}

function findConceptById(seed: number, id: string): GroupConcept | undefined {
  return conceptBankLookup(seed).find((c) => c.id === id);
}

function conceptBankLookup(seed: number) {
  // Keep consistent with prompt options.
  return pickConceptOptions(seed, 10);
}

function groupNamePrompt(concept: GroupConcept, seed: number): ChoicePrompt {
  const candidates = generateGroupNameCandidates(concept, seed);
  return {
    kind: "options",
    promptId: "phase0.groupName",
    title: "Phase 0 · Step 2：确定团名",
    helperText: "规则：候选团名为 **一个英文单词**。你也可以自定义输入。",
    options: candidates.map((w) => ({ id: w, label: w })),
    allowCustomInput: true,
    customPlaceholder: "自定义团名（一个英文单词）",
  };
}

function memberCountPrompt(): ChoicePrompt {
  return {
    kind: "input",
    promptId: "phase0.memberCount",
    title: "Phase 0 · Step 3：确定团体人数",
    helperText: "最少 3 人，无上限。",
    inputType: "number",
    min: 3,
    placeholder: "例如：5",
    submitLabel: "确认人数",
  };
}

function traineePoolPrompt(state: GameState, trainees: Trainee[]): ChoicePrompt {
  return {
    kind: "memberPick",
    promptId: "phase0.traineePool",
    title: "Phase 0 · Step 4：练习生候选池",
    helperText: "你可以按维度筛选/排序（UI 会提供）。确认后进入出道成员选择。",
    memberCount: state.group.targetMemberCount!,
    trainees,
    selectedIds: [],
    sortKey: "talent",
    sortDir: "desc",
  };
}

function debutSelectPrompt(state: GameState): ChoicePrompt {
  const trainees = state.group.trainees ?? [];
  const count = state.group.targetMemberCount ?? 3;
  return {
    kind: "memberPick",
    promptId: "phase0.debutSelect",
    title: "Phase 0 · Step 5：选定出道成员",
    helperText: `从候选池中选满 **${count} 人**，再点击确认。`,
    memberCount: count,
    trainees,
    selectedIds: [],
    sortKey: "visual",
    sortDir: "desc",
  };
}

const defaultPositions = [
  "队长",
  "主唱",
  "主舞",
  "主rapper",
  "门面",
  "忙内",
  "领唱",
  "领舞",
  "副唱",
  "副rapper",
];

function positionsPrompt(members: Member[]): ChoicePrompt {
  const rng = createRng(members.length * 999);
  const positionsByMemberId: Record<string, string[]> = {};
  for (const m of members) {
    const suggested = rng.shuffle(defaultPositions).slice(0, 2);
    positionsByMemberId[m.id] = suggested;
  }
  return {
    kind: "positions",
    promptId: "phase0.positions",
    title: "Phase 0 · 阵容确认：分配位置",
    helperText:
      "可调整每位成员的位置标签（主唱/主舞/主rapper/门面/忙内等）。确认后进入运营阶段。",
    members,
    positionsByMemberId,
  };
}

function sanitizeGroupName(raw: string) {
  const trimmed = raw.trim();
  const word = trimmed.split(/\s+/)[0] ?? "";
  const upper = word.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return upper;
}

export function applyPlayerChoice(state: GameState, action: PlayerAction): GameState {
  if (action.type === "reset") return createNewGame();

  if (state.phase === "ops") return applyOpsChoice(state, action);
  if (state.phase === "end") return state;

  switch (state.phase0Step) {
    case "concept": {
      if (action.type !== "chooseOption") return state;
      const concept = findConceptById(state.seed, action.optionId);
      if (!concept) return state;

      let next = pushPlayer(state, `我选择概念：**${concept.name}**`);
      next = timelineBuild(next, "确定概念", concept.name);
      next = {
        ...next,
        group: { ...next.group, concept },
        phase0Step: "groupName" as const,
        prompt: groupNamePrompt(concept, state.seed),
      };

      const sys = [
        `已确认概念：**${concept.name} (${concept.enName})**`,
        "",
        "下一步：请选择团名候选（一个英文单词），或自定义输入。",
      ].join("\n");
      return pushSystem(next, sys);
    }

    case "groupName": {
      if (action.type !== "chooseOption") return state;
      const concept = state.group.concept;
      if (!concept) return state;

      const chosen = action.customText?.trim()
        ? sanitizeGroupName(action.customText)
        : sanitizeGroupName(action.optionId);
      if (!chosen) return state;

      let next = pushPlayer(state, `团名：**${chosen}**`);
      next = timelineBuild(next, "确定团名", chosen);
      next = {
        ...next,
        group: { ...next.group, groupName: chosen },
        phase0Step: "memberCount" as const,
        prompt: memberCountPrompt(),
      };

      return pushSystem(
        next,
        `团名已确认：**${chosen}**。\n\n下一步：输入团体人数（≥3）。`,
      );
    }

    case "memberCount": {
      if (action.type !== "submitInput") return state;
      const n = Number(action.value);
      if (!Number.isFinite(n) || n < 3) {
        return pushSystem(state, "人数无效：请输入 ≥ 3 的整数。");
      }

      let next = pushPlayer(state, `团体人数：**${n}** 人`);
      next = timelineBuild(next, "确定人数", String(n));
      next = { ...next, group: { ...next.group, targetMemberCount: n } };

      const { trainees, poolSize } = generateTraineePool({
        seed: state.seed,
        targetMemberCount: n,
      });

      next = {
        ...next,
        group: { ...next.group, trainees },
        phase0Step: "traineePool" as const,
        prompt: traineePoolPrompt(next, trainees),
      };

      const sys = [
        `已生成练习生候选池：**${poolSize} 人**（约为人数×2.5~3）。`,
        "",
        "下一步：进入出道成员选择。",
      ].join("\n");
      return pushSystem(next, sys);
    }

    case "traineePool": {
      // UI uses this prompt to show pool table; a confirm just moves forward.
      if (action.type === "confirmDebut") {
        const next = {
          ...state,
          phase0Step: "debutSelect" as const,
          prompt: debutSelectPrompt(state),
        };
        return pushSystem(next, "请从候选池中选择出道成员。");
      }
      return state;
    }

    case "debutSelect": {
      if (state.prompt.kind !== "memberPick") return state;
      const count = state.prompt.memberCount;

      if (action.type === "toggleDebutMember") {
        const selected = new Set(state.prompt.selectedIds);
        if (selected.has(action.traineeId)) selected.delete(action.traineeId);
        else {
          if (selected.size >= count) return state;
          selected.add(action.traineeId);
        }
        return {
          ...state,
          prompt: { ...state.prompt, selectedIds: Array.from(selected) },
        };
      }

      if (action.type === "confirmDebut") {
        if (state.prompt.selectedIds.length !== count) {
          return pushSystem(state, `人数未满：需要选择 ${count} 人。`);
        }

        const byId = new Map((state.group.trainees ?? []).map((t) => [t.id, t]));
        const members: Member[] = state.prompt.selectedIds
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map((t) => ({ ...t!, debutPositions: [] }));

        let next = pushPlayer(state, `确认出道阵容：${members.map((m) => `**${m.stageName}**`).join(" / ")}`);
        next = timelineBuild(next, "确认出道阵容", members.map((m) => m.stageName).join(", "));
        next = {
          ...next,
          group: { ...next.group, members },
          phase0Step: "positions" as const,
          prompt: positionsPrompt(members),
        };

        return pushSystem(
          next,
          "阵容已锁定。下一步：为每位成员分配位置标签（主唱/主舞/主rapper/门面/忙内等）。",
        );
      }

      return state;
    }

    case "positions": {
      const prompt = state.prompt;
      if (prompt.kind !== "positions") return state;
      if (action.type === "setPositions") {
        return {
          ...state,
          prompt: {
            ...prompt,
            positionsByMemberId: {
              ...prompt.positionsByMemberId,
              [action.memberId]: action.positions,
            },
          },
        };
      }

      if (action.type === "confirmPositions") {
        const members = (state.group.members ?? []).map((m) => ({
          ...m,
          debutPositions: prompt.positionsByMemberId[m.id] ?? [],
        }));

        let next = timelineBuild(state, "分配位置", "完成");
        next = startOps({
          ...next,
          group: { ...next.group, members },
        });
        return pushSystem(next, "Phase 0 完成。运营阶段开始：准备首次回归。");
      }

      return state;
    }

    default:
      return state;
  }
}

function startOps(state: GameState): GameState {
  const albumType = nextAlbumType(state.miniCountSinceFull);
  const draft: AlbumDraft = { albumType };
  const prompt = opsAlbumConceptPrompt(state);
  return {
    ...state,
    phase: "ops",
    opsStep: "albumConcept" as const,
    prompt,
    ops: {
      current: draft,
      lastFeedback: undefined,
      personalPlans: [],
      personalCursor: { memberIndex: 0 },
      pendingDrama: null,
      history: [],
    },
  };
}

function opsAlbumConceptPrompt(state: GameState): ChoicePrompt {
  const choices = genAlbumConceptChoices(state);
  return {
    kind: "options",
    promptId: "ops.albumConcept",
    title: "专辑制作 Step 1：专辑概念",
    helperText: "请选择 1 个概念方向（每次回归随机）。也可自定义输入。",
    options: choices.map((c) => ({ id: c.id, label: c.label, description: c.blurb })),
    allowCustomInput: true,
    customPlaceholder: "自定义概念（例如：Neo Noir）",
  };
}

function opsAlbumNamePrompt(state: GameState): ChoicePrompt {
  const choices = genAlbumNameChoices(state);
  return {
    kind: "options",
    promptId: "ops.albumName",
    title: "专辑制作 Step 2：专辑名称",
    helperText: "请选择 1 个候选（英文 + 中文翻译），或自定义输入。",
    options: choices.map((c) => ({ id: c.id, label: c.label })),
    allowCustomInput: true,
    customPlaceholder: "自定义专辑名（英文单词） / 中文翻译（可写在对话里）",
  };
}

function opsTrackCountPrompt(state: GameState): ChoicePrompt {
  const type = state.ops?.current?.albumType ?? "mini";
  const hint = type === "mini" ? "Mini 建议 4–6 首" : "正规建议 8–12 首";
  return {
    kind: "input",
    promptId: "ops.trackCount",
    title: "专辑制作 Step 3：收录曲数量",
    helperText: hint,
    inputType: "number",
    min: type === "mini" ? 4 : 8,
    max: type === "mini" ? 6 : 12,
    placeholder: type === "mini" ? "例如：5" : "例如：10",
    submitLabel: "确认数量",
  };
}

function opsTitleStylePrompt(state: GameState): ChoicePrompt {
  const choices = genTitleStyleChoices(state);
  return {
    kind: "options",
    promptId: "ops.titleStyle",
    title: "专辑制作 Step 4：主打歌风格",
    helperText: "选择主打风格（含参考作品与标签）。",
    options: choices.map((c) => ({
      id: c.id,
      label: `${c.label} · ${c.ref}`,
      description: `${c.tags} — ${c.desc}`,
    })),
  };
}

function opsContinuePrompt(id: string, title: string, helperText?: string): ChoicePrompt {
  return {
    kind: "options",
    promptId: id,
    title,
    helperText,
    options: [{ id: "continue", label: "继续" }],
  };
}

function opsTitleCountPrompt(): ChoicePrompt {
  return {
    kind: "input",
    promptId: "ops.titleCount",
    title: "专辑制作 Step 6：主打歌数量",
    helperText: "范围 1–3（仅影响打歌内容）。",
    inputType: "number",
    min: 1,
    max: 3,
    placeholder: "例如：1",
    submitLabel: "确认",
  };
}

function opsMvCountPrompt(): ChoicePrompt {
  return {
    kind: "input",
    promptId: "ops.mvCount",
    title: "专辑制作 Step 7：MV 拍摄支数",
    helperText: "范围 1–3。",
    inputType: "number",
    min: 1,
    max: 3,
    placeholder: "例如：1",
    submitLabel: "确认",
  };
}

function opsPromoPrompt(state: GameState): ChoicePrompt {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 2020);
  const shows = rng.shuffle(["音乐殿堂", "舞台中心", "Live星球", "周末音放", "TopBeat"]);
  return {
    kind: "options",
    promptId: "ops.promoPeriod",
    title: "专辑制作 Step 8：打歌周期",
    helperText: "请选择一个打歌方案（几周 + 虚构节目名）。",
    options: [
      { id: "pkgA", label: `2周 · ${shows[0]}` },
      { id: "pkgB", label: `3周 · ${shows[1]}` },
      { id: "pkgC", label: `4周 · ${shows[2]}` },
      { id: "pkgD", label: `3周 · ${shows[3]}` },
    ],
  };
}

function opsFeedbackPrompt(state: GameState): ChoicePrompt {
  const canSkipPersonal = state.comebackIndex === 1; // after 1st comeback can skip
  const options = [
    { id: "toPersonal", label: "进入个人发展" },
    ...(canSkipPersonal ? [{ id: "skipPersonal", label: "跳过个人发展（仅本次）" }] : []),
    { id: "reviewHotPosts", label: "再看一遍热帖" },
    { id: "nextComeback", label: "准备下一次回归" },
  ].slice(0, 4);

  return {
    kind: "options",
    promptId: "ops.feedback",
    title: "反馈与舆论",
    helperText: canSkipPersonal
      ? "第 1 次回归后个人发展可跳过；第 2 次起将强制安排。"
      : "第 2 次回归起个人发展将强制安排。",
    options,
  };
}

function opsPersonalPromptForMember(state: GameState, member: Member): ChoicePrompt {
  const choices = genPersonalActivityChoices();
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 3030 ^ member.id.length);
  const opts = rng.shuffle(choices).slice(0, 4);
  return {
    kind: "options",
    promptId: "ops.personal_activity",
    title: `成员个人发展：${member.stageName}`,
    helperText: "为该成员安排 1 项资源（每回归间隔 1–2 项，此处先做 1 项）。",
    options: opts.map((o) => ({ id: o.id, label: o.label, description: o.desc })),
  };
}

function opsDramaPrompt(drama: NonNullable<GameState["ops"]>["pendingDrama"]): ChoicePrompt {
  return {
    kind: "options",
    promptId: "ops.drama",
    title: `⚡ Drama：${drama!.title}`,
    helperText: "选择处理方案（不会替你决定）。",
    options: drama!.options.map((o) => ({ id: o.id, label: o.label, description: o.desc })),
  };
}

function applyOpsChoice(state: GameState, action: PlayerAction): GameState {
  const ops = state.ops;
  if (!ops || !state.opsStep) return startOps(state);
  const draft = ops.current ?? { albumType: nextAlbumType(state.miniCountSinceFull) };
  const members = state.group.members ?? [];

  const endIfNeeded = (s: GameState) => {
    if (s.contractMonthsLeft > 0) return s;
    const report = [
      "# 七年总结报告",
      "",
      `团名：**${s.group.groupName ?? "—"}**`,
      `概念：**${s.group.concept?.name ?? "—"}**`,
      "",
      `总回归次数：**${s.comebackIndex}**`,
      "",
      "（此处将继续补齐：总成就、成员走向、续约/解散分支与最终评分。）",
    ].join("\n");
    const next = pushSystem(
      {
        ...s,
        phase: "end",
        opsStep: "endReport" as const,
        prompt: opsContinuePrompt("end.done", "游戏结束", "感谢游玩。"),
      },
      report,
    );
    return timelineAdd(next, { type: "milestone", summary: "合约到期 · 七年总结", highlight: true });
  };

  switch (state.opsStep) {
    case "albumConcept": {
      if (action.type !== "chooseOption") return state;
      const chosenLabel =
        action.customText?.trim() ||
        genAlbumConceptChoices(state).find((c) => c.id === action.optionId)?.label ||
        action.optionId;
      const nextDraft: AlbumDraft = { ...draft, concept: { id: action.optionId, label: chosenLabel, blurb: "" } };
      let next = pushPlayer(state, `专辑概念：**${chosenLabel}**`);
      next = timelineAdd(next, { type: "album", summary: "专辑概念", playerChoice: chosenLabel });
      next = {
        ...next,
        ops: { ...ops, current: nextDraft },
        opsStep: "albumName" as const,
        prompt: opsAlbumNamePrompt(state),
      };
      return pushSystem(next, "下一步：选择专辑名称。");
    }

    case "albumName": {
      if (action.type !== "chooseOption") return state;
      const chosen = action.customText?.trim()
        ? sanitizeGroupName(action.customText)
        : action.optionId;
      const lookup = genAlbumNameChoices(state).find((c) => c.id === action.optionId);
      const en = sanitizeGroupName(lookup?.en ?? chosen);
      const zh = lookup?.zh ?? "（自定义）";
      const nextDraft: AlbumDraft = { ...draft, name: { en, zh } };
      let next = pushPlayer(state, `专辑名：**${en}**（${zh}）`);
      next = timelineAdd(next, { type: "album", summary: "专辑名称", playerChoice: `${en} (${zh})` });
      next = {
        ...next,
        ops: { ...ops, current: nextDraft },
        opsStep: "trackCount" as const,
        prompt: opsTrackCountPrompt({ ...state, ops: { ...ops, current: nextDraft } }),
      };
      return pushSystem(next, "下一步：设置收录曲数量。");
    }

    case "trackCount": {
      if (action.type !== "submitInput") return state;
      const n = Number(action.value);
      const min = draft.albumType === "mini" ? 4 : 8;
      const max = draft.albumType === "mini" ? 6 : 12;
      if (!Number.isFinite(n) || n < min || n > max) {
        return pushSystem(state, `数量无效：${draft.albumType === "mini" ? "Mini" : "正规"} 需要 ${min}–${max} 首。`);
      }
      const nextDraft: AlbumDraft = { ...draft, trackCount: n };
      let next = pushPlayer(state, `收录曲数量：**${n}**`);
      next = timelineAdd(next, { type: "album", summary: "收录曲数量", playerChoice: String(n) });
      next = {
        ...next,
        ops: { ...ops, current: nextDraft },
        opsStep: "titleStyle" as const,
        prompt: opsTitleStylePrompt(state),
      };
      return pushSystem(next, "下一步：选择主打歌风格。");
    }

    case "titleStyle": {
      if (action.type !== "chooseOption") return state;
      const style = genTitleStyleChoices(state).find((c) => c.id === action.optionId);
      const chosenLabel = style ? style.label : action.optionId;
      const nextDraft: AlbumDraft = {
        ...draft,
        titleStyle: style
          ? { id: style.id, label: style.label, ref: style.ref, tags: style.tags, desc: style.desc }
          : { id: action.optionId, label: action.optionId, ref: "—", tags: "—", desc: "—" },
      };

      const fit = members.length
        ? genMemberFitTableMarkdown(members, nextDraft.titleStyle!.id)
        : "（成员未就绪）";
      nextDraft.memberFitTableMarkdown = fit;

      let next = pushPlayer(state, `主打风格：**${chosenLabel}**`);
      next = timelineAdd(next, { type: "album", summary: "主打风格", playerChoice: chosenLabel });
      next = pushSystem(
        {
          ...next,
          ops: { ...ops, current: nextDraft },
          opsStep: "memberFit" as const,
          prompt: opsContinuePrompt("ops.memberFit", "成员适配度", "仅影响舞台评价，不阻止发行。"),
        },
        `成员适配度（仅影响舞台评价）：\n\n${fit}`,
      );
      return next;
    }

    case "memberFit": {
      if (action.type !== "chooseOption" || action.optionId !== "continue") return state;
      return {
        ...state,
        opsStep: "titleCount" as const,
        prompt: opsTitleCountPrompt(),
      };
    }

    case "titleCount": {
      if (action.type !== "submitInput") return state;
      const n = Number(action.value);
      if (!Number.isFinite(n) || n < 1 || n > 3) return pushSystem(state, "主打歌数量无效：范围 1–3。");
      const nextDraft: AlbumDraft = { ...draft, titleTrackCount: n };
      let next = pushPlayer(state, `主打歌数量：**${n}**`);
      next = timelineAdd(next, { type: "album", summary: "主打歌数量", playerChoice: String(n) });
      next = {
        ...next,
        ops: { ...ops, current: nextDraft },
        opsStep: "mvCount" as const,
        prompt: opsMvCountPrompt(),
      };
      return pushSystem(next, "下一步：设置 MV 拍摄支数。");
    }

    case "mvCount": {
      if (action.type !== "submitInput") return state;
      const n = Number(action.value);
      if (!Number.isFinite(n) || n < 1 || n > 3) return pushSystem(state, "MV 支数无效：范围 1–3。");
      const nextDraft: AlbumDraft = { ...draft, mvCount: n };
      let next = pushPlayer(state, `MV 支数：**${n}**`);
      next = timelineAdd(next, { type: "album", summary: "MV 支数", playerChoice: String(n) });
      next = {
        ...next,
        ops: { ...ops, current: nextDraft },
        opsStep: "promoPeriod" as const,
        prompt: opsPromoPrompt(state),
      };
      return pushSystem(next, "下一步：选择打歌周期。");
    }

    case "promoPeriod": {
      if (action.type !== "chooseOption") return state;
      const pkg = action.optionId;
      const map: Record<string, { weeks: number; show: string }> = {
        pkgA: { weeks: 2, show: state.prompt.kind === "options" ? state.prompt.options[0]?.label.split(" · ")[1] ?? "音乐殿堂" : "音乐殿堂" },
        pkgB: { weeks: 3, show: state.prompt.kind === "options" ? state.prompt.options[1]?.label.split(" · ")[1] ?? "舞台中心" : "舞台中心" },
        pkgC: { weeks: 4, show: state.prompt.kind === "options" ? state.prompt.options[2]?.label.split(" · ")[1] ?? "Live星球" : "Live星球" },
        pkgD: { weeks: 3, show: state.prompt.kind === "options" ? state.prompt.options[3]?.label.split(" · ")[1] ?? "周末音放" : "周末音放" },
      };
      const chosen = map[pkg] ?? { weeks: 3, show: "音乐殿堂" };
      const nextDraft: AlbumDraft = { ...draft, promo: { weeks: chosen.weeks, shows: [chosen.show] } };
      let next = pushPlayer(state, `打歌周期：**${chosen.weeks} 周** · ${chosen.show}`);
      next = timelineAdd(next, { type: "album", summary: "打歌周期", playerChoice: `${chosen.weeks}周 · ${chosen.show}` });

      const feedback = genFeedback(state, nextDraft);
      const feedbackMd = [
        "## 综合评分（5分制）",
        "",
        feedback.ratingsMarkdown,
        "",
        "## 音源数据播报",
        "",
        feedback.platformStatsMarkdown,
        "",
        "## 打歌成绩",
        "",
        feedback.musicShowsMarkdown,
      ].join("\n");

      next = pushSystem(next, feedbackMd);
      next = timelineAdd(next, { type: "data", summary: "回归反馈与数据" });

      next = {
        ...next,
        comebackIndex: state.comebackIndex + 1,
        miniCountSinceFull:
          draft.albumType === "full" ? 0 : Math.min(2, state.miniCountSinceFull + 1),
        opsStep: "feedback" as const,
        prompt: opsFeedbackPrompt({ ...state, comebackIndex: state.comebackIndex + 1 }),
        ops: {
          ...ops,
          current: nextDraft,
          lastFeedback: feedback,
          personalPlans: [],
          personalCursor: { memberIndex: 0 },
          pendingDrama: null,
        },
      };
      return pushSystem(next, "回归完成。你要先处理个人发展，还是直接进入下一次回归？");
    }

    case "feedback": {
      if (action.type !== "chooseOption") return state;
      if (action.optionId === "reviewHotPosts") {
        return pushSystem(state, "热帖区已在剧情区内展示（可切换 Tab）。");
      }
      if (action.optionId === "toPersonal" || action.optionId === "skipPersonal") {
        const canSkip = state.comebackIndex === 1;
        if (action.optionId === "skipPersonal" && !canSkip) {
          return pushSystem(state, "现在起个人发展为强制项目，无法跳过。");
        }
        if (action.optionId === "skipPersonal") {
          const next = timelineAdd(state, { type: "member", summary: "个人发展", playerChoice: "跳过" });
          return startDramaOrNext(next, []);
        }
        // toPersonal
        const idx = 0;
        const member = members[idx];
        if (!member) return pushSystem(state, "成员未就绪：请先完成 Phase 0。");
        return {
          ...state,
          opsStep: "personal_activity" as const,
          prompt: opsPersonalPromptForMember(state, member),
          ops: { ...ops, personalPlans: [], personalCursor: { memberIndex: 0 } },
        };
      }
      if (action.optionId === "nextComeback") {
        // If comebackIndex >=2, personal is mandatory; enforce.
        if (state.comebackIndex >= 2) {
          return pushSystem(state, "第 2 次回归起个人发展强制。请先安排个人发展。");
        }
        return startDramaOrNext(state, []);
      }
      return state;
    }

    case "personal_activity": {
      if (action.type !== "chooseOption") return state;
      const cursor = ops.personalCursor ?? { memberIndex: 0 };
      const member = members[cursor.memberIndex];
      if (!member) return state;
      const activity = action.optionId as PersonalActivityType;
      const plan = resolvePersonalPlan(state, member, activity);
      let next = pushPlayer(state, plan.resultMarkdown);
      next = timelineAdd(next, { type: "member", summary: "个人发展", playerChoice: `${member.stageName} · ${activity}` });

      const plans = [...(ops.personalPlans ?? []), plan];
      const nextIndex = cursor.memberIndex + 1;
      if (nextIndex < members.length) {
        const nextMember = members[nextIndex]!;
        return {
          ...next,
          opsStep: "personal_activity" as const,
          prompt: opsPersonalPromptForMember(state, nextMember),
          ops: { ...ops, personalPlans: plans, personalCursor: { memberIndex: nextIndex } },
        };
      }
      return startDramaOrNext(
        { ...next, ops: { ...ops, personalPlans: plans, personalCursor: { memberIndex: nextIndex } } },
        plans,
      );
    }

    case "drama": {
      if (action.type !== "chooseOption") return state;
      const drama = ops.pendingDrama;
      if (!drama) return state;
      const resolved = resolveDrama(state, drama, action.optionId);
      let next = pushSystem(state, resolved.outcomeMarkdown ?? "处理完成。");
      next = timelineAdd(next, { type: "drama", summary: resolved.title, playerChoice: resolved.options.find((o) => o.id === action.optionId)?.label });
      return goNextComeback({ ...next, ops: { ...ops, pendingDrama: resolved } });
    }

    case "nextComeback":
    default:
      return state;
  }

  function startDramaOrNext(s: GameState, plans: PersonalPlan[]) {
    const drama = maybeDrama(s, members, plans);
    if (drama) {
      const next = pushSystem(s, `## ⚡ Drama\n\n${drama.descriptionMarkdown}`);
      return {
        ...next,
        opsStep: "drama" as const,
        prompt: opsDramaPrompt(drama),
        ops: { ...(s.ops ?? ops), pendingDrama: drama, personalPlans: plans },
      };
    }
    return goNextComeback({ ...s, ops: { ...(s.ops ?? ops), pendingDrama: null, personalPlans: plans } });
  }

  function goNextComeback(s: GameState) {
    const adv = advanceTimeForNextComeback(s);
    const nextNow = adv.now;
    const nextContract = Math.max(0, s.contractMonthsLeft - adv.months);
    const base = {
      ...s,
      now: nextNow,
      contractMonthsLeft: nextContract,
    };

    const feedback = s.ops?.lastFeedback;
    const historyItem = feedback
      ? {
      comebackIndex: s.comebackIndex,
      ym: s.now,
      draft: draft,
        feedback,
        personalPlans: s.ops?.personalPlans ?? [],
      drama: s.ops?.pendingDrama ?? null,
      }
      : null;

    const updatedOps = {
      ...(base.ops ?? ops),
      history: [...(base.ops?.history ?? []), ...(historyItem ? [historyItem] : [])],
      lastFeedback: base.ops?.lastFeedback,
      pendingDrama: null,
      personalPlans: [],
      personalCursor: { memberIndex: 0 },
      current: { albumType: nextAlbumType(base.miniCountSinceFull) },
    };

    const next = {
      ...base,
      ops: updatedOps,
      opsStep: "albumConcept" as const,
      prompt: opsAlbumConceptPrompt(base),
    };

    return endIfNeeded(pushSystem(next, `下一次回归筹备开始：当前时间 **${ymToString(next.now)}**。`));
  }
}

