export type GamePhase = "phase0" | "ops" | "end";

export type Phase0Step =
  | "concept"
  | "groupName"
  | "memberCount"
  | "traineePool"
  | "debutSelect"
  | "positions";

export type TimelineType =
  | "build"
  | "album"
  | "data"
  | "opinion"
  | "member"
  | "drama"
  | "milestone"
  | "negative";

export type DialogueRole = "system" | "player";

export type ChoicePrompt =
  | {
      kind: "options";
      promptId: string;
      title: string;
      helperText?: string;
      options: Array<{ id: string; label: string; description?: string }>;
      allowCustomInput?: boolean;
      customPlaceholder?: string;
    }
  | {
      kind: "input";
      promptId: string;
      title: string;
      helperText?: string;
      inputType: "text" | "number";
      placeholder?: string;
      min?: number;
      max?: number;
      submitLabel?: string;
    }
  | {
      kind: "memberPick";
      promptId: string;
      title: string;
      helperText?: string;
      memberCount: number;
      trainees: Trainee[];
      selectedIds: string[];
      sortKey?: TraineeSortableKey;
      sortDir?: "asc" | "desc";
    }
  | {
      kind: "positions";
      promptId: string;
      title: string;
      helperText?: string;
      members: Member[];
      positionsByMemberId: Record<string, string[]>;
    };

export type TraineeSortableKey =
  | "age"
  | "heightCm"
  | "trainingMonths"
  | "eq"
  | "vocal"
  | "dance"
  | "talent"
  | "visual";

export type Region =
  | "首尔"
  | "京畿"
  | "釜山"
  | "大邱"
  | "大田"
  | "光州"
  | "济州"
  | "地方小城"
  | "海外侨胞";

export type Economy = "财阀级" | "富裕" | "中产" | "工薪" | "贫困";
export type Family = "独生子" | "兄弟姐妹" | "单亲" | "祖父母抚养";
export type SpecialBackground =
  | "无"
  | "艺人后代"
  | "军人家庭"
  | "童星"
  | "选秀落选"
  | "他社转来"
  | "海外长大";

export type Background = {
  region: Region;
  economy: Economy;
  family: Family;
  special: SpecialBackground;
  blurb: string;
};

export type FixedStats = {
  eq: number; // 1-5
  talent: number; // 1-5
  heightCm: number; // 165-185
};

export type GrowthStats = {
  vocal: number; // 1-5
  dance: number; // 1-5
  visual: number; // 1-5
};

export type Trainee = {
  id: string;
  koreanName: string;
  chineseName: string;
  stageName: string;
  age: number;
  trainingMonths: number;
  fixed: FixedStats;
  growth: GrowthStats;
  personality: string; // "优点/缺点"
  background: Background;
  oneLine: string;
};

export type Member = Trainee & {
  debutPositions: string[];
};

export type GroupConcept = {
  id: string;
  name: string;
  enName: string;
  blurb: string;
  tags: string[];
};

export type GroupState = {
  concept?: GroupConcept;
  groupName?: string;
  targetMemberCount?: number;
  trainees?: Trainee[];
  members?: Member[];
};

export type YearMonth = { year: number; month: number };

export type DialogueEntry = {
  id: string;
  at: number;
  role: DialogueRole;
  markdown: string;
};

export type TimelineEntry = {
  id: string;
  at: number;
  ym: YearMonth;
  type: TimelineType;
  summary: string;
  playerChoice?: string;
  result?: string;
  memberIds?: string[];
  highlight?: boolean;
};

export type GameState = {
  version: number;
  seed: number;
  now: YearMonth;
  contractMonthsLeft: number;
  comebackIndex: number;
  miniCountSinceFull: number;
  phase: GamePhase;
  phase0Step: Phase0Step;
  opsStep?: OpsStep;
  prompt: ChoicePrompt;
  group: GroupState;
  ops?: OpsState;
  dialogueLog: DialogueEntry[];
  timeline: TimelineEntry[];
};

export type AlbumType = "mini" | "full";

export type OpsStep =
  | "albumConcept"
  | "albumName"
  | "trackCount"
  | "titleStyle"
  | "memberFit"
  | "titleCount"
  | "mvCount"
  | "promoPeriod"
  | "feedback"
  | "personal_member"
  | "personal_activity"
  | "drama"
  | "nextComeback"
  | "endReport";

export type AlbumDraft = {
  albumType: AlbumType;
  concept?: { id: string; label: string; blurb: string };
  name?: { en: string; zh: string };
  trackCount?: number;
  titleStyle?: { id: string; label: string; ref: string; tags: string; desc: string };
  memberFitTableMarkdown?: string;
  titleTrackCount?: number;
  mvCount?: number;
  promo?: { weeks: number; shows: string[] };
};

export type FeedbackBundle = {
  ratingsMarkdown: string;
  platformStatsMarkdown: string;
  musicShowsMarkdown: string;
  hotPosts: HotPosts;
};

export type HotPost = {
  badge: "HOT" | "논란" | "讨论" | "分析" | "吐槽" | "日常" | "热搜" | "超话" | "路人";
  up?: number;
  down?: number;
  comments?: number;
  reposts?: number;
  likes?: number;
  text: string;
};

export type HotPosts = {
  kr: HotPost[];
  weibo: HotPost[];
  doubanYu: HotPost[];
  doubanJuhao: HotPost[];
};

export type PersonalActivityType =
  | "影视"
  | "时尚"
  | "MC"
  | "个人音乐"
  | "进修"
  | "外貌管理"
  | "休息";

export type PersonalPlan = {
  memberId: string;
  activity: PersonalActivityType;
  resultMarkdown: string;
};

export type DramaEvent = {
  id: string;
  memberId: string;
  title: string;
  descriptionMarkdown: string;
  options: Array<{ id: string; label: string; desc: string }>;
  chosenOptionId?: string;
  outcomeMarkdown?: string;
};

export type OpsState = {
  current?: AlbumDraft;
  lastFeedback?: FeedbackBundle;
  personalPlans?: PersonalPlan[];
  personalCursor?: { memberIndex: number };
  pendingDrama?: DramaEvent | null;
  history?: Array<{
    comebackIndex: number;
    ym: YearMonth;
    draft: AlbumDraft;
    feedback: FeedbackBundle;
    personalPlans: PersonalPlan[];
    drama?: DramaEvent | null;
  }>;
};

export type PlayerAction =
  | { type: "chooseOption"; optionId: string; customText?: string }
  | { type: "submitInput"; value: string }
  | { type: "toggleDebutMember"; traineeId: string }
  | { type: "confirmDebut" }
  | { type: "setPositions"; memberId: string; positions: string[] }
  | { type: "confirmPositions" }
  | { type: "reset" };

