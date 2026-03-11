import { createRng, type Rng } from "@/game/rng";
import type {
  Background,
  Economy,
  Family,
  GroupConcept,
  Region,
  SpecialBackground,
  Trainee,
} from "@/game/types";

export function conceptBank(): GroupConcept[] {
  return [
    {
      id: "darkAesthetic",
      name: "暗黑美学",
      enName: "Dark Aesthetic",
      blurb: "哥特、暗黑童话、视觉冲击。",
      tags: ["dark", "visual", "dramatic"],
    },
    {
      id: "youthNarrative",
      name: "少年成长叙事",
      enName: "Youth Narrative",
      blurb: "青春、成长痛、校园感。",
      tags: ["youth", "story", "warm"],
    },
    {
      id: "streetCulture",
      name: "街头潮流",
      enName: "Street Culture",
      blurb: "嘻哈、涂鸦、城市感。",
      tags: ["hiphop", "street", "swag"],
    },
    {
      id: "cyberFuturism",
      name: "未来赛博",
      enName: "Cyber Futurism",
      blurb: "科幻世界观、电子乐。",
      tags: ["cyber", "sci-fi", "electronic"],
    },
    {
      id: "etherealElegance",
      name: "高级柔美",
      enName: "Ethereal Elegance",
      blurb: "柔光、古典、艺术感。",
      tags: ["elegant", "soft", "art"],
    },
    {
      id: "beastIdol",
      name: "野兽派力量",
      enName: "Beast Idol",
      blurb: "硬核、力量、强编舞。",
      tags: ["power", "performance", "dance"],
    },
    {
      id: "boyNextDoor",
      name: "邻家治愈",
      enName: "Boy Next Door",
      blurb: "清新、亲和、恋爱感。",
      tags: ["fresh", "friendly", "romance"],
    },
    {
      id: "retroWave",
      name: "复古浪潮",
      enName: "Retro Wave",
      blurb: "80/90年代、怀旧。",
      tags: ["retro", "citypop", "nostalgia"],
    },
    {
      id: "loreBased",
      name: "世界观叙事",
      enName: "Lore-based",
      blurb: "虚构宇宙、连续剧式。",
      tags: ["lore", "series", "worldbuilding"],
    },
    {
      id: "avantGarde",
      name: "实验先锋",
      enName: "Avant-garde",
      blurb: "打破边界、艺术跨界。",
      tags: ["experimental", "art", "boundary"],
    },
    {
      id: "neoNoir",
      name: "霓虹黑色电影",
      enName: "Neon Noir",
      blurb: "都市霓虹、暧昧危险、电影感。",
      tags: ["noir", "neon", "cinematic"],
    },
    {
      id: "sportyEnergy",
      name: "运动热血",
      enName: "Sporty Energy",
      blurb: "竞技感、团魂、明快节奏。",
      tags: ["sporty", "team", "bright"],
    },
    {
      id: "minimalChic",
      name: "极简高级",
      enName: "Minimal Chic",
      blurb: "留白、线条、克制质感。",
      tags: ["minimal", "chic", "clean"],
    },
    {
      id: "mythicFantasy",
      name: "神话奇幻",
      enName: "Mythic Fantasy",
      blurb: "神话意象、史诗氛围、仪式感。",
      tags: ["myth", "epic", "fantasy"],
    },
  ];
}

export function pickConceptOptions(seed: number, minCount = 10) {
  const rng = createRng(seed ^ 0xa11ce);
  const bank = rng.shuffle(conceptBank());
  return bank.slice(0, Math.max(minCount, 10));
}

export function generateGroupNameCandidates(concept: GroupConcept, seed: number) {
  const rng = createRng(seed ^ 0xb0a7);
  const basesByTag: Record<string, string[]> = {
    dark: ["VENOM", "ECLIPSE", "NOIR", "SHADE", "RAVEN", "VORTEX"],
    youth: ["SPARK", "GROW", "DAWN", "BLOOM", "CAMPUS", "GLIDE"],
    hiphop: ["HUSTLE", "GRIT", "RHYME", "FLEX", "URBAN", "DRIP"],
    cyber: ["NEON", "NEXUS", "PIXEL", "CYBER", "VECTOR", "ION"],
    elegant: ["AURA", "VELVET", "IVORY", "SILK", "MUSE", "HALO"],
    power: ["TITAN", "FORGE", "PRIME", "BEAST", "BLADE", "RIOT"],
    fresh: ["BREEZE", "CLOVER", "HONEY", "SMILE", "LUCID", "SUNNY"],
    retro: ["WAVE", "VINYL", "FLASH", "SATURN", "ARCADE", "COSMO"],
    lore: ["ORBIT", "SAGA", "LEGEND", "ATLAS", "AETHER", "RUNE"],
    experimental: ["NOVA", "VOID", "PRISM", "GLITCH", "KERNEL", "MIRROR"],
    noir: ["NIGHT", "PHANTOM", "SIREN", "SMOKE", "ALIBI", "DUSK"],
    sporty: ["ACE", "BOOST", "ROOKIE", "PULSE", "RUNNER", "STRIKE"],
    minimal: ["LINE", "FORM", "MONO", "TONE", "PLAIN", "CLEAN"],
    myth: ["ODYSSEY", "CROWN", "ARCANA", "DRAGON", "TEMPLE", "FABLE"],
  };

  const tag = concept.tags[0] ?? "dark";
  const pool = basesByTag[tag] ?? basesByTag.dark;

  const set = new Set<string>();
  while (set.size < 4) set.add(rng.pick(pool));

  return Array.from(set).map((w) => w.replace(/[^A-Z]/g, ""));
}

const familyNames = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
  "서",
  "신",
  "권",
  "황",
];

const givenNames = [
  "시우",
  "도현",
  "민재",
  "지훈",
  "현우",
  "준서",
  "서준",
  "태양",
  "지성",
  "우진",
  "민규",
  "하준",
  "건우",
  "도윤",
  "태현",
  "승민",
  "재윤",
  "은찬",
  "유찬",
  "진우",
  "성훈",
  "규민",
];

const chineseNames = [
  "朴诗宇",
  "金道贤",
  "李珉在",
  "崔智勋",
  "郑贤宇",
  "姜俊书",
  "尹叙俊",
  "张泰阳",
  "林志成",
  "韩宇镇",
  "吴珉奎",
  "徐河俊",
  "申健宇",
  "权道允",
  "黄泰贤",
  "赵胜敏",
  "柳在允",
  "长恩灿",
  "朴有灿",
  "金振宇",
  "李成勋",
  "崔奎民",
];

const stageBases = [
  "SIWOO",
  "DOHYUN",
  "MINJAE",
  "JIHUN",
  "HYUNWOO",
  "JUNSEO",
  "SEOJUN",
  "TAEYANG",
  "JISEONG",
  "WOOJIN",
  "MINGYU",
  "HAJUN",
  "GEONWOO",
  "DOYUN",
  "TAEHYUN",
  "SEUNGMIN",
  "JAEYUN",
  "EUNCHAN",
  "YUCHAN",
  "JINWOO",
  "SEONGHUN",
  "GYUMIN",
];

function uniqueNameTriplet(
  rng: Rng,
  usedKo: Set<string>,
  usedZh: Set<string>,
  usedStage: Set<string>,
) {
  for (let tries = 0; tries < 5000; tries++) {
    const ko = `${rng.pick(familyNames)}${rng.pick(givenNames)}`;
    const zh = rng.pick(chineseNames);
    const stage = rng.pick(stageBases);
    if (usedKo.has(ko) || usedZh.has(zh) || usedStage.has(stage)) continue;
    usedKo.add(ko);
    usedZh.add(zh);
    usedStage.add(stage);
    return { koreanName: ko, chineseName: zh, stageName: stage };
  }
  // fallback: suffix stage to guarantee uniqueness
  const ko = `${rng.pick(familyNames)}${rng.pick(givenNames)}`;
  const zh = rng.pick(chineseNames);
  const stage = `${rng.pick(stageBases)}${rng.int(2, 99)}`;
  usedKo.add(ko);
  usedZh.add(zh);
  usedStage.add(stage);
  return { koreanName: ko, chineseName: zh, stageName: stage };
}

function personalityOf(rng: Rng) {
  const pros = ["开朗", "细腻", "稳重", "自律", "外向", "温柔", "机灵", "热血"];
  const cons = ["冲动", "敏感", "固执", "拖延", "嘴硬", "社恐", "好胜心强", "玻璃心"];
  const pro = rng.pick(pros);
  let con = rng.pick(cons);
  if (con === pro) con = rng.pick(cons);
  return `${pro}/${con}`;
}

function backgroundOf(rng: Rng): Background {
  const regions: Region[] = ["首尔", "京畿", "釜山", "大邱", "大田", "光州", "济州", "地方小城", "海外侨胞"];
  const economies: Economy[] = ["财阀级", "富裕", "中产", "工薪", "贫困"];
  const families: Family[] = ["独生子", "兄弟姐妹", "单亲", "祖父母抚养"];
  const specials: SpecialBackground[] = ["无", "艺人后代", "军人家庭", "童星", "选秀落选", "他社转来", "海外长大"];

  const region = rng.pick(regions);
  const economy = rng.pick(economies);
  const family = rng.pick(families);
  const special = rng.pick(specials);

  const parts = [
    `${region}${economy === "财阀级" ? "豪门" : economy}出身`,
    family === "兄弟姐妹" ? "有兄弟姐妹" : family,
    special !== "无" ? `经历：${special}` : "",
  ].filter(Boolean);

  return {
    region,
    economy,
    family,
    special,
    blurb: parts.join("，") + "。",
  };
}

function oneLineEval(t: Omit<Trainee, "oneLine">) {
  const strongDance = t.growth.dance >= 4;
  const strongVocal = t.growth.vocal >= 4;
  const lowEq = t.fixed.eq <= 2;
  const lowTraining = t.trainingMonths <= 10;

  if (strongDance && !strongVocal) return "舞蹈天赋亮眼但声乐偏薄，需要打磨稳定度。";
  if (strongVocal && !strongDance) return "音色条件好，舞台需要靠训练补齐体能与线条。";
  if (lowEq) return "业务并不差，但情商短板可能带来直播/采访风险。";
  if (lowTraining) return "练习期偏短，容易被质疑走捷径，但可塑性高。";
  if (t.growth.visual >= 4 && t.fixed.talent <= 2) return "外形吸睛但花瓶争议风险高，必须尽快补业务。";
  return "综合均衡，适合做团内稳定输出或多面手培养。";
}

export function generateTraineePool(params: {
  seed: number;
  targetMemberCount: number;
}): { trainees: Trainee[]; poolSize: number } {
  const rng = createRng(params.seed ^ 0x7a411); // xor salt
  const ratio = 2.5 + rng.next() * 0.5; // 2.5~3.0
  const poolSize = Math.ceil(params.targetMemberCount * ratio);

  const usedKo = new Set<string>();
  const usedZh = new Set<string>();
  const usedStage = new Set<string>();

  const trainees: Trainee[] = [];
  for (let i = 0; i < poolSize; i++) {
    const names = uniqueNameTriplet(rng, usedKo, usedZh, usedStage);
    const age = rng.int(15, 22);
    const trainingMonths = rng.int(1, 60);
    const heightCm = rng.int(165, 185);
    const eq = rng.int(1, 5);
    const talent = rng.int(1, 5);
    const vocal = rng.int(1, 5);
    const dance = rng.int(1, 5);
    const visual = rng.int(1, 5);

    const background = backgroundOf(rng);
    const personality = personalityOf(rng);

    const base = {
      id: `tr_${params.seed.toString(16)}_${i}_${rng.int(1000, 9999)}`,
      ...names,
      age,
      trainingMonths,
      fixed: { eq, talent, heightCm },
      growth: { vocal, dance, visual },
      personality,
      background,
      oneLine: "",
    } satisfies Omit<Trainee, "oneLine"> & { oneLine: string };

    const oneLine = oneLineEval(base);

    trainees.push({ ...base, oneLine });
  }

  return { trainees, poolSize };
}

