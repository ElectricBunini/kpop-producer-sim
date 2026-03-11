import { createRng } from "@/game/rng";
import type {
  AlbumDraft,
  AlbumType,
  DramaEvent,
  FeedbackBundle,
  GameState,
  HotPost,
  HotPosts,
  Member,
  PersonalActivityType,
  PersonalPlan,
} from "@/game/types";

const albumConceptOptions = [
  { id: "darkTrap", label: "暗黑陷阱 (Dark Trap)", blurb: "浓烈氛围+攻击性鼓组，舞台冲击拉满。" },
  { id: "citypop", label: "霓虹怀旧 (City Pop)", blurb: "复古合成器+温暖旋律，路人缘提升。" },
  { id: "cyberEdm", label: "赛博电子 (Cyber EDM)", blurb: "未来感音色+强节奏 drop，视觉可塑性强。" },
  { id: "ethereal", label: "空灵艺术 (Ethereal)", blurb: "轻柔质感+高级留白，适合做口碑。" },
  { id: "streetHip", label: "街头嘻哈 (Street Hip)", blurb: "律动与态度，适合舞蹈队形与rap线。" },
  { id: "beast", label: "力量野兽 (Beast)", blurb: "硬核编舞+体能，舞台分数极容易起飞。" },
  { id: "retroSynth", label: "复古合成 (Retro Synth)", blurb: "80s 质感+抓耳 hook，适合短视频传播。" },
  { id: "lore", label: "世界观章节 (Lore Chapter)", blurb: "连续剧情，粉丝沉浸式追更。" },
];

const albumNameBank = [
  ["ECLIPSE", "月蚀"],
  ["FEVER", "狂热"],
  ["NOIR", "黑色"],
  ["AURA", "光环"],
  ["NEXUS", "纽带"],
  ["PRISM", "棱镜"],
  ["VENOM", "毒液"],
  ["DAWN", "破晓"],
  ["SAGA", "史诗"],
  ["WAVE", "浪潮"],
];

const titleStyleOptions = [
  {
    id: "hardstyle_trap",
    label: "Hardstyle + Trap",
    ref: "Gods Menu 式",
    tags: "重低音 / 攻击性 / 断点",
    desc: "舞台压迫感强，适合做新人代表作，但音源容错较低。",
  },
  {
    id: "synthpop_city",
    label: "Synth-pop / City Pop",
    ref: "Ditto 式",
    tags: "温暖 / 怀旧 / 旋律",
    desc: "路人友好，二创潜力高，舞台更吃表情管理。",
  },
  {
    id: "future_bass",
    label: "Future Bass",
    ref: "FEVER 式",
    tags: "空灵 / Drop / 情绪",
    desc: "氛围感强，适合做“口碑回归”。",
  },
  {
    id: "latin_reggaeton",
    label: "Latin Pop + Reggaeton",
    ref: "LALALA 式",
    tags: "律动 / 夏日 / 记忆点",
    desc: "短视频传播强，舞蹈需要统一气口和节奏。",
  },
  {
    id: "drum_bass",
    label: "Drum & Bass + Pop",
    ref: "疾走感式",
    tags: "速度 / 线条 / 爆发",
    desc: "舞台很帅，但唱跳稳定度是硬门槛。",
  },
];

const musicShows = ["音乐殿堂", "舞台中心", "Live星球", "周末音放", "TopBeat"];

export function nextAlbumType(miniCountSinceFull: number): AlbumType {
  return miniCountSinceFull >= 2 ? "full" : "mini";
}

export function genAlbumConceptChoices(state: GameState) {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 1337);
  return rng.shuffle(albumConceptOptions).slice(0, 4);
}

export function genAlbumNameChoices(state: GameState) {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 7331);
  const picks = rng.shuffle(albumNameBank).slice(0, 4);
  return picks.map(([en, zh]) => ({ id: en, label: `${en} (${zh})`, en, zh }));
}

export function genTitleStyleChoices(state: GameState) {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 9001);
  return rng.shuffle(titleStyleOptions).slice(0, 4);
}

function ratingClamp(n: number) {
  return Math.max(1, Math.min(5, Math.round(n * 10) / 10));
}

function growthStageFactor(state: GameState) {
  // Year 1~7 curve.
  const yearIndex = 8 - Math.ceil(state.contractMonthsLeft / 12); // 1..7
  if (yearIndex <= 1) return 0.6;
  if (yearIndex === 2) return 0.85;
  if (yearIndex === 3) return 1.05;
  if (yearIndex === 4) return 1.15;
  if (yearIndex === 5) return 1.1;
  if (yearIndex === 6) return 1.0;
  return 0.9;
}

export function genMemberFitTableMarkdown(members: Member[], styleId: string) {
  const styleBias =
    styleId === "hardstyle_trap"
      ? { vocal: -0.2, dance: 0.3 }
      : styleId === "drum_bass"
        ? { vocal: -0.1, dance: 0.2 }
        : styleId === "synthpop_city"
          ? { vocal: 0.2, dance: -0.1 }
          : styleId === "future_bass"
            ? { vocal: 0.1, dance: 0.0 }
            : { vocal: 0.0, dance: 0.0 };

  const rows = members.map((m) => {
    const vocalFit = m.growth.vocal + styleBias.vocal;
    const danceFit = m.growth.dance + styleBias.dance;
    const vocal = vocalFit >= 4 ? "✅" : vocalFit >= 3 ? "⚠️" : "❌";
    const dance = danceFit >= 4 ? "✅" : danceFit >= 3 ? "⚠️" : "❌";
    const overall =
      vocal === "✅" && dance === "✅"
        ? "核心输出"
        : vocal === "❌" && dance === "❌"
          ? "高风险"
          : "可用但需训练";
    return `| ${m.stageName} | ${vocal} | ${dance} | ${overall} |`;
  });

  return [
    "| 成员 | 唱功适配 | 舞蹈适配 | 整体 |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function genHotPostKr(rng: ReturnType<typeof createRng>, mood: "pos" | "mix" | "neg"): HotPost[] {
  const base = (badge: HotPost["badge"], up: number, down: number, comments: number, text: string): HotPost => ({
    badge,
    up,
    down,
    comments,
    text,
  });
  const pos = [
    base("HOT", rng.int(180, 1200), rng.int(5, 40), rng.int(60, 420), `이번 컴백 컨셉 진짜 미쳤다… 프로듀서 천재인가 ㅋㅋ`),
    base("HOT", rng.int(120, 900), rng.int(10, 60), rng.int(80, 520), `무대 퀄이 왜 이렇게 좋음?? 신인 맞아??`),
  ];
  const neg = [
    base("논란", rng.int(220, 1600), rng.int(150, 1200), rng.int(400, 2200), `나만 파트 분배 이상하다고 생각함?? 메인보컬인데 왜…`),
    base("논란", rng.int(300, 2000), rng.int(220, 1800), rng.int(600, 2800), `얼굴만 되는 거 아님?? 실력은… ㅠㅠ`),
  ];
  return mood === "pos"
    ? rng.shuffle([...pos, rng.pick(neg)]).slice(0, 3)
    : mood === "neg"
      ? rng.shuffle([...neg, rng.pick(pos)]).slice(0, 3)
      : rng.shuffle([...pos, ...neg]).slice(0, 3);
}

function genHotPostWeibo(rng: ReturnType<typeof createRng>, mood: "pos" | "mix" | "neg"): HotPost[] {
  const base = (badge: HotPost["badge"], reposts: number, likes: number, comments: number, text: string): HotPost => ({
    badge,
    reposts,
    likes,
    comments,
    text,
  });
  const pos = [
    base("热搜", rng.int(8000, 26000), rng.int(18000, 52000), rng.int(3000, 12000), `新专主打也太上头了救命😭 单曲循环三小时。`),
    base("超话", rng.int(300, 2000), rng.int(800, 6000), rng.int(120, 900), `舞台直拍杀疯了。姐妹们快去看。`),
  ];
  const neg = [
    base("路人", rng.int(2000, 14000), rng.int(8000, 32000), rng.int(1000, 8000), `认真问下，主唱part怎么这么少…合理吗。`),
    base("超话", rng.int(600, 5000), rng.int(1200, 10000), rng.int(400, 5000), `公司是不是资源分配有问题。别逼唯粉开麦🙂`),
  ];
  return mood === "pos"
    ? rng.shuffle([...pos, rng.pick(neg)]).slice(0, 3)
    : mood === "neg"
      ? rng.shuffle([...neg, rng.pick(pos)]).slice(0, 3)
      : rng.shuffle([...pos, ...neg]).slice(0, 3);
}

function genHotPostDoubanYu(rng: ReturnType<typeof createRng>, mood: "pos" | "mix" | "neg"): HotPost[] {
  const base = (badge: HotPost["badge"], up: number, down: number, comments: number, text: string): HotPost => ({
    badge,
    up,
    down,
    comments,
    text,
  });
  const pos = [
    base("分析", rng.int(120, 520), rng.int(10, 60), rng.int(80, 380), `客观来说这次b-side收歌品味在线，制作人有点东西。`),
    base("讨论", rng.int(150, 650), rng.int(10, 80), rng.int(90, 520), `舞台表现力进步明显，尤其队形和表情管理。`),
  ];
  const neg = [
    base("吐槽", rng.int(60, 380), rng.int(40, 260), rng.int(100, 600), `主打选得很迷。不是不好听，但不抓人。`),
    base("讨论", rng.int(80, 520), rng.int(30, 240), rng.int(120, 720), `练习期太短出道的人是不是该补课…`),
  ];
  return mood === "pos"
    ? rng.shuffle([...pos, rng.pick(neg)]).slice(0, 3)
    : mood === "neg"
      ? rng.shuffle([...neg, rng.pick(pos)]).slice(0, 3)
      : rng.shuffle([...pos, ...neg]).slice(0, 3);
}

function ensureJuhao(text: string) {
  // Force all sentences to end with "。", disallow ! ?
  const sanitized = text.replace(/[!?！？]/g, "。");
  const trimmed = sanitized.trim();
  return trimmed.endsWith("。") ? trimmed : `${trimmed}。`;
}

function genHotPostDoubanJuhao(rng: ReturnType<typeof createRng>, mood: "pos" | "mix" | "neg"): HotPost[] {
  const base = (badge: HotPost["badge"], up: number, comments: number, text: string): HotPost => ({
    badge,
    up,
    comments,
    text: ensureJuhao(text),
  });
  const pos = [
    base("日常", rng.int(500, 2600), rng.int(200, 1200), `好的。这次回归舞台确实有点东西。路人也能看下。`),
    base("日常", rng.int(600, 3200), rng.int(300, 1600), `唱功有进步。公司终于记得他们是来唱歌的了。`),
  ];
  const neg = [
    base("日常", rng.int(600, 3600), rng.int(300, 2000), `所以这个团的卖点到底是什么。我看了三天没看懂。脸确实可以。那没事了。`),
    base("日常", rng.int(700, 4200), rng.int(400, 2600), `看到了。谢谢。part分配还是那个味道。理解了。祝福。`),
  ];
  const mixed = rng.shuffle([...pos, ...neg]).slice(0, 3);
  return mood === "pos"
    ? rng.shuffle([...pos, rng.pick(neg)]).slice(0, 3)
    : mood === "neg"
      ? rng.shuffle([...neg, rng.pick(pos)]).slice(0, 3)
      : mixed;
}

export function genFeedback(state: GameState, draft: AlbumDraft): FeedbackBundle {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 4242);
  const factor = growthStageFactor(state);

  const stage = ratingClamp(2.8 + factor * 1.3 + rng.next() * 0.5);
  const fans = ratingClamp(3.0 + factor * 1.2 + rng.next() * 0.6);
  const exec = ratingClamp(2.6 + factor * 1.0 + rng.next() * 0.6);
  const buzz = ratingClamp(2.4 + factor * 1.1 + rng.next() * 0.8);

  const ratingsMarkdown = [
    "| 维度 | 得分 | 变动 |",
    "|---|---:|---|",
    `| 舞台表现力 | ${stage.toFixed(1)} | ${rng.pick(["▲+0.3", "▲+0.1", "—", "▼-0.2"])} |`,
    `| 粉丝满意度 | ${fans.toFixed(1)} | ${rng.pick(["▲+0.2", "—", "▼-0.1"])} |`,
    `| 高层满意度 | ${exec.toFixed(1)} | ${rng.pick(["▲+0.1", "—", "▼-0.1"])} |`,
    `| 公众话题度 | ${buzz.toFixed(1)} | ${rng.pick(["▲+0.4", "▲+0.1", "—", "▼-0.2"])} |`,
  ].join("\n");

  const peak = Math.max(1, Math.floor(80 - factor * 30 - rng.int(0, 10)));
  const mv72 = Math.round((factor * 900 + rng.int(300, 900)) / 10) * 10;
  const tiktok = rng.int(3, Math.floor(6 + factor * 12));

  const platformStatsMarkdown = [
    "| 数据项 | 数值 | 备注 |",
    "|---|---|---|",
    `| 🇰🇷 Melon 日榜最高 | #${Math.max(1, peak - rng.int(0, 10))} | — |`,
    `| 🇰🇷 Bugs | #${Math.max(1, peak - rng.int(5, 20))} | — |`,
    `| 🌏 Spotify Global 200 | ${factor > 0.75 ? `#${rng.int(70, 190)}` : "未入榜"} | ${factor > 0.75 ? "首次" : "—"} |`,
    `| 🇯🇵 Line Music | ${factor > 0.85 ? `#${rng.int(8, 40)}` : "未入榜"} | — |`,
    `| 🇺🇸 Billboard 200 | ${factor > 1.05 ? `#${rng.int(120, 200)}` : "未入榜"} | — |`,
    `| 🇨🇳 QQ音乐韩语榜 | #${rng.int(1, 10)} | — |`,
    `| 📺 MV 播放量(72h) | ${mv72}万 | — |`,
    `| 📱 TikTok 百万赞视频 | ${tiktok}个 | — |`,
  ].join("\n");

  const weeks = draft.promo?.weeks ?? rng.int(2, 4);
  const show = rng.pick(musicShows);
  const winWeek = factor > 0.9 && rng.next() > 0.45 ? rng.int(1, weeks) : null;
  const musicShowsMarkdown = [
    "| 节目（虚构） | 周次 | 排名 | 一位？ |",
    "|---|---:|---:|---|",
    ...Array.from({ length: weeks }).map((_, i) => {
      const w = i + 1;
      const rank = w === winWeek ? 1 : rng.int(2, 7);
      const win = w === winWeek ? "✅🏆" : "❌";
      return `| ${show} | W${w} | #${rank} | ${win} |`;
    }),
  ].join("\n");

  const mood: "pos" | "mix" | "neg" =
    stage + fans + exec + buzz >= 15.5 ? "pos" : stage + fans + exec + buzz <= 12.5 ? "neg" : "mix";

  const hotPosts: HotPosts = {
    kr: genHotPostKr(rng, mood),
    weibo: genHotPostWeibo(rng, mood),
    doubanYu: genHotPostDoubanYu(rng, mood),
    doubanJuhao: genHotPostDoubanJuhao(rng, mood),
  };

  return {
    ratingsMarkdown,
    platformStatsMarkdown,
    musicShowsMarkdown,
    hotPosts,
  };
}

export function genPersonalActivityChoices(): Array<{
  id: PersonalActivityType;
  label: string;
  desc: string;
}> {
  return [
    { id: "影视", label: "🎬 影视", desc: "网剧/电影/短片，提升知名度与镜头口碑。" },
    { id: "时尚", label: "👔 时尚", desc: "代言/画报，商业价值与外貌评价变化。" },
    { id: "MC", label: "🎙️ MC", desc: "音乐MC/电台，国民度与好感度提升。" },
    { id: "个人音乐", label: "🎵 个人音乐", desc: "solo/ost/feat，唱功认可与个人粉增长。" },
    { id: "进修", label: "📚 进修", desc: "声乐/舞蹈/演技/语言，维度小幅增长。" },
    { id: "外貌管理", label: "💪 外貌管理", desc: "健身/造型/医美（有风险），外貌变化。" },
    { id: "休息", label: "🛑 休息", desc: "无活动，恢复状态，降低倦怠。" },
  ];
}

export function resolvePersonalPlan(state: GameState, member: Member, activity: PersonalActivityType): PersonalPlan {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 6161 ^ member.id.length);
  const good = rng.next() > 0.35;
  const delta = () => (good ? rng.int(1, 3) : rng.int(-2, 1)) / 10;

  const result = (() => {
    switch (activity) {
      case "进修":
        return `进修反馈：唱功${delta() >= 0 ? "▲" : "▼"}、舞蹈${delta() >= 0 ? "▲" : "▼"}（小幅变化）。`;
      case "外貌管理":
        return good
          ? "外貌管理效果明显：镜头感提升，口碑偏正向。"
          : "外貌管理引发争议：过度医美质疑出现，舆论两极。";
      case "MC":
        return good ? "综艺/MC 表现讨喜：国民度上升。"
          : "MC 发挥一般：存在冷场与尴尬剪辑。";
      case "影视":
        return good ? "影视资源带来路人盘：镜头表现意外好。"
          : "影视表现被挑刺：'爱豆跳板'话题上升。";
      case "个人音乐":
        return good ? "个人音乐获得好评：音色与稳定度被认可。"
          : "个人音乐反响平平：存在选曲与唱功争议。";
      case "时尚":
        return good ? "时尚资源曝光拉满：商业价值上升。"
          : "时尚表现被吐槽：造型与气质不匹配。";
      case "休息":
        return "休息期：状态恢复，后续舞台稳定性提升（隐性加成）。";
    }
  })();

  return {
    memberId: member.id,
    activity,
    resultMarkdown: `**${member.stageName}** · ${activity}\n\n${result}`,
  };
}

export function maybeDrama(state: GameState, members: Member[], personalPlans: PersonalPlan[]): DramaEvent | null {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 8088);
  const chanceBase = 0.25;
  const hasHighRisk = members.some((m) => m.fixed.eq <= 2 || m.trainingMonths <= 10);
  const chance = chanceBase + (hasHighRisk ? 0.15 : 0);
  if (rng.next() > chance) return null;

  const riskMembers = members.filter((m) => m.fixed.eq <= 2 || m.trainingMonths <= 10 || m.fixed.talent <= 2);
  const target = (riskMembers.length ? rng.pick(riskMembers) : rng.pick(members))!;

  const pool = [
    {
      id: "liveSlip",
      title: "直播失言风波",
      desc: "直播中一句话被截成热帖扩散，粉黑大战升级。",
      rule: target.fixed.eq <= 2,
    },
    {
      id: "flowerDebate",
      title: "花瓶争议",
      desc: "路人认为他靠脸站位，业务短板被放大审判。",
      rule: target.growth.visual >= 4 && target.fixed.talent <= 2,
    },
    {
      id: "shortcutSuspicion",
      title: "走后门质疑",
      desc: "练习期过短被翻旧账，对家黑稿带节奏。",
      rule: target.trainingMonths <= 10,
    },
    {
      id: "actorJump",
      title: "跳板当演员？",
      desc: "个人资源过多引发团粉不满，'不务正业'话题发酵。",
      rule: personalPlans.some((p) => p.memberId === target.id && p.activity === "影视"),
    },
  ];
  const candidates = pool.filter((p) => p.rule);
  const picked = (candidates.length ? rng.pick(candidates) : rng.pick(pool))!;

  const options = [
    { id: "denySue", label: "声明否认 + 提告", desc: "强硬路线，撕裂风险高但能震慑黑稿。" },
    { id: "apology", label: "道歉并暂停活动", desc: "止损路线，短期低迷但利于长期口碑。" },
    { id: "silence", label: "冷处理", desc: "赌热度过去，可能被解读为心虚。" },
    { id: "varietyCover", label: "用舞台/综艺反击", desc: "用表现扭转舆论，但需要稳定输出。" },
  ];

  return {
    id: `dr_${state.seed.toString(16)}_${state.comebackIndex + 1}`,
    memberId: target.id,
    title: picked.title,
    descriptionMarkdown: `**事件**：${picked.desc}\n\n涉及成员：**${target.stageName}**（情商 ${target.fixed.eq} / 练习 ${Math.floor(target.trainingMonths / 12)}年${target.trainingMonths % 12}月）`,
    options,
  };
}

export function resolveDrama(state: GameState, drama: DramaEvent, optionId: string): DramaEvent {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 9099);
  const good = rng.next() > 0.5;
  const outcome =
    optionId === "apology"
      ? good
        ? "诚意道歉后舆论降温，路人好感回升，但粉丝情绪短期受挫。"
        : "道歉被质疑公关模板，反复拉扯，热帖持续。"
      : optionId === "denySue"
        ? good
          ? "强硬声明震慑部分黑稿，但也激化对立，舆论两极。"
          : "提告反噬：更多旧料被翻出，话题扩大。"
        : optionId === "silence"
          ? good
            ? "热度自然下降，事件逐渐被新话题覆盖。"
            : "冷处理被当成默认：负面印象固化。"
          : good
            ? "靠舞台表现反转部分口碑，热帖出现'真香'走向。"
            : "舞台失误叠加事件：负面加倍扩散。";

  return {
    ...drama,
    chosenOptionId: optionId,
    outcomeMarkdown: `处理方案：**${drama.options.find((o) => o.id === optionId)?.label ?? optionId}**\n\n${outcome}`,
  };
}

export function advanceTimeForNextComeback(state: GameState) {
  const rng = createRng(state.seed ^ (state.comebackIndex + 1) * 1111);
  const months = rng.pick([4, 4, 5, 6]); // ~2-3 comebacks/year
  let year = state.now.year;
  let month = state.now.month + months;
  while (month > 12) {
    year += 1;
    month -= 12;
  }
  return { months, now: { year, month } };
}

