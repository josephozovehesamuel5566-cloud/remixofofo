import * as fs from 'fs';
import * as path from 'path';

// TYPES OF OFOFO.NG DIGITAL PUBLISHING PLATFORM

export type UserRole = 'Super Admin' | 'Editor-in-Chief' | 'Editor' | 'Author' | 'Contributor' | 'Moderator' | 'Subscriber';
export type PostStatus = 'Draft' | 'Review' | 'Approved' | 'Scheduled' | 'Published' | 'Archived';
export type CommentStatus = 'Pending' | 'Approved' | 'Reported' | 'Flagged';
export type AdPosition = 'Header-Banner' | 'Sidebar-Widget' | 'In-Feed-Banner' | 'Footer-Anchor';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
  followedAuthors: string[]; // user ids
  followedTopics: string[]; // category slugs
  savedArticles: string[]; // article ids
  readingHistory: { articleId: string; readAt: string }[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  wordCount: number;
  readingTime: number; // in minutes
  featuredImage: string;
  audioNarrationUrl?: string;
  status: PostStatus;
  authorId: string;
  categoryId: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  viewCount: number;
  likeCount: number;
  sponsored: boolean;
  premiumOnly: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: string; // nested comments
  likes: number;
  status: CommentStatus;
  createdAt: string;
}

export interface Newsletter {
  id: string;
  email: string;
  segment: string;
  verified: boolean;
  createdAt: string;
}

export interface Revision {
  id: string;
  articleId: string;
  editorId: string;
  title: string;
  content: string;
  summary: string;
  changeSummary: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: AdPosition;
  views: number;
  clicks: number;
  active: boolean;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  folder: string;
  url: string;
  size: number;
  mimeType: string;
  authorId: string;
  createdAt: string;
}

export interface AnalyticsMetrics {
  day: string; // YYYY-MM-DD
  pageViews: number;
  uniqueVisitors: number;
  revenue: number; // in NGN
  subscriberGrowth: number;
  topArticles: { articleId: string; title: string; views: number }[];
  trafficSources: { source: string; count: number }[];
  topAuthors: { authorId: string; fullName: string; views: number }[];
}

export interface DBState {
  profiles: UserProfile[];
  categories: Category[];
  articles: Article[];
  comments: Comment[];
  newsletters: Newsletter[];
  revisions: Revision[];
  auditLogs: AuditLog[];
  advertisements: Advertisement[];
  mediaLibrary: MediaAsset[];
  analytics: AnalyticsMetrics[];
}

// SEED CONTENT - COMPREHENSIVE HIGH-FIDELITY NEWS ARTICLES FOR Nigeria/Africa

const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Tech & Innovation',
    slug: 'tech-innovation',
    description: 'The heartbeat of Africa’s venture capital, homegrown startups, fintech ecosystems, and deep infrastructure engineering.',
    icon: 'Cpu',
  },
  {
    id: 'cat-2',
    name: 'Business & Markets',
    slug: 'business-markets',
    description: 'Corporate strategy, macroeconomic policies, foreign investments, energy transformations, and cross-border trade.',
    icon: 'Briefcase',
  },
  {
    id: 'cat-3',
    name: 'Politics & Society',
    slug: 'politics-society',
    description: 'In-depth investigative reports, civic reform movements, policy analysis, and democratic transitions in West Africa.',
    icon: 'Globe',
  },
  {
    id: 'cat-4',
    name: 'Entertainment & Culture',
    slug: 'entertainment-culture',
    description: 'Nollywood’s structural growth, Afrobeats on the international charts, literature, fashion, and contemporary design.',
    icon: 'Tv',
  },
  {
    id: 'cat-5',
    name: 'Education & Science',
    slug: 'education-science',
    description: 'Agritech breakthroughs, educational access reforms, academic insights, and environmental research across the continent.',
    icon: 'GraduationCap',
  },
];

const SEED_PROFILES: UserProfile[] = [
  {
    id: 'user-admin',
    email: 'josephsamuelozovehe@gmail.com',
    fullName: 'Joseph Ozovehe Samuel',
    role: 'Super Admin',
    bio: 'Founder, Chief Publisher, and Principal Executive of Ofofo.ng. Pioneering high-velocity West African digital publication and deep macroeconomic reporting.',
    avatarUrl: 'https://picsum.photos/seed/admin8/300/300',
    followedAuthors: [],
    followedTopics: ['tech-innovation', 'business-markets'],
    savedArticles: [],
    readingHistory: [],
    createdAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'user-chioma',
    email: 'joseph.samuel@ofofo.ng',
    fullName: 'Joseph Ozovehe Samuel',
    role: 'Editor-in-Chief',
    bio: 'Editor-in-Chief of Ofofo.ng. Veteran analytical reporter chronicling the intersection of corporate capital, venture capital, and sovereign regulation in Lagos.',
    avatarUrl: 'https://picsum.photos/seed/chioma/300/300',
    followedAuthors: [],
    followedTopics: ['tech-innovation'],
    savedArticles: [],
    readingHistory: [],
    createdAt: '2026-01-15T12:00:00Z',
  },
  {
    id: 'user-tarik',
    email: 'tarik.ibrahim@ofofo.ng',
    fullName: 'Tarik Ibrahim',
    role: 'Author',
    bio: 'Senior Policy Analyst and energy writer. Focused on macroeconomic transformations, decentralization of the Nigerian power sector, and regional trade corridors.',
    avatarUrl: 'https://picsum.photos/seed/tarik/300/300',
    followedAuthors: [],
    followedTopics: ['politics-society', 'business-markets'],
    savedArticles: [],
    readingHistory: [],
    createdAt: '2026-02-01T09:30:00Z',
  },
  {
    id: 'user-tolani',
    email: 'tolani.ojo@ofofo.ng',
    fullName: 'Tolani Ojo',
    role: 'Author',
    bio: 'Cultural theorist and investigative critic. Documenting the financial models powering the global explosion of Nollywood intellectual properties.',
    avatarUrl: 'https://picsum.photos/seed/tolani/300/300',
    followedAuthors: [],
    followedTopics: ['entertainment-culture'],
    savedArticles: [],
    readingHistory: [],
    createdAt: '2026-02-14T11:15:00Z',
  },
];

const SEED_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'The Yaba Consensus: How Lagos Decided the Future of African Venture Capital',
    slug: 'yaba-consensus-lagos-african-venture-capital',
    summary: 'An exhausting audit of the physical and capital infrastructures that consolidated Yaba, Lagos, as the primary node of West African technology syndicates.',
    content: `
# The Yaba Consensus: How Lagos Decided the Future of African Venture Capital

In the mid-2010s, a quiet geographical sorting occurred in Nigeria’s commercial nerve center. A collection of legacy telecommunications pipelines, low-rent university corridors, and aggressive technical talent converged in **Yaba**, transforming a residential mainland neighborhood into a high-density capital hub. Today, this dense perimeter governs the spatial distribution of over **$2.5B in institutional venture capital** across the African continent.

But the consolidation of what we call the *Yaba Consensus* is not merely or simply a story of organic clustering. It is an editorial saga of deliberate infrastructural engineering, public policy leverage, and global syndication structures that continue to set the standards for regional technical growth.

> "The expansion of Yaba was not accidental. It was a targeted arbitrage of proximity—connecting academic labs of UNILAG, raw bandwidth channels, and early-stage capital brokers within a three-kilometer radius."
> — _Joseph Ozovehe Samuel, Editor-in-Chief_

## The Trinity of Density: Universities, Fiber, and Capital

To understand the resilience of the Lagos venture model, one must examine the physical realities powering the internet infrastructure. In 2011, early pioneer initiatives worked extensively with local authorities to lay over **20 kilometers of dark fiber optic cables** specifically targeting the tertiary academic complexes. 

The strategy was simple: convert bandwidth into a generic public utility surrounding the demographic clusters most receptive to radical experimentation.

### Critical Infrastructure Allocation Matrix

| Node Division | Specific Infrastructure Contribution | Primary Impact Metrics |
| :--- | :--- | :--- |
| **Academic Complex** | University of Lagos (UNILAG) + Yabatech | High-density technical talent pipelines; immediate feedback loops |
| **Bandwidth Channel** | MainOne Fiber Infrastructure Ring | Sub-10ms localized latency; continuous server connectivity |
| **Co-Working Nodes** | Early hub incubators (Co-Creation Hub, etc.) | Standardized administrative processes; legal compliance frameworks |
| **Capital Pools** | Angel Syndicate Offices & Institutional Funds | Seed checks ($50K-$250K) deployed under foreign holding jurisdictions |

## Code compliance, Global Arbitrage, and Delaware Holds

A significant, yet rarely documented element of the Yaba legacy is the institutionalization of the **Delaware Flip**. To circumvent the legacy capital controls of local regulators and instill absolute confidence in foreign limited partners, local startup founders began restructuring their entities. 

The corporate hierarchy is split as follows:
1. **The Parent Holding Entity:** Incorporated in the state of Delaware (or occasionally the United Kingdom).
2. **The Subsidiary Operating Entity:** Incorporated locally in Lagos as a Limited Liability Company, serving as the operational and transactional sink.

\`\`\`typescript
// Architectural representation of a localized venture funding state handler
interface FundingStructure {
  holdingCompany: {
    jurisdiction: "Delaware" | "UK" | "Cayman";
    legalFramework: "Common Law";
    equityAllocated: number;
  };
  operatingSubsidiary: {
    jurisdiction: "Nigeria" (RC_Company);
    licensedActivities: string[];
    repatriationMechanism: "Intercompany Service Agreement";
  };
}
\`\`\`

This dual-entity setup allows local engineers to build on the ground in Ikeja and Yaba, while international venture investors sign capital commitments under standardized Anglo-American judicial protections. It is an operational compromise that has catalyzed the scale of Africa’s premier unicorns.

## The Scaling Challenges of Tomorrow

Despite these incredible financial engineering structures, bottlenecks are rising. High inflation, foreign currency volatility, and local power grid dependencies force technology firms to allocate up to **18% of their seed capital** purely toward infrastructural resiliency—redundant fiber paths, diesel fuel automation, and corporate security.

The next generation of Yaba builders is building decentralized systems to reduce their exposure to central municipal issues. The Yaba Consensus is evolving from local tech clusters to decentralized remote organizations spanning Nairobi, Accra, and Kigali, yet Lagos remains the undisputed furnace of African capital.
    `,
    wordCount: 750,
    readingTime: 4,
    featuredImage: 'https://picsum.photos/seed/lagostech/1200/630',
    status: 'Published',
    authorId: 'user-chioma',
    categoryId: 'cat-1',
    tags: ['Tech', 'Venture Capital', 'Lagos', 'Fintech', 'Financing'],
    seoTitle: 'Lagos Tech VC: Inside the Yaba Consensus | Ofofo.ng',
    seoDescription: 'Discover the institutional and engineering infrastructure representing the foundation of Lagos’ technology super-cluster.',
    viewCount: 15420,
    likeCount: 4210,
    sponsored: false,
    premiumOnly: false,
    publishedAt: '2026-05-20T08:00:00Z',
    createdAt: '2026-05-18T10:00:00Z',
  },
  {
    id: 'art-2',
    title: 'The $110M War Chest: How Moniepoint Became Africa’s Newest Tech Unicorn under DPI and Google Support',
    slug: 'moniepoint-110m-funding-series-c-dpi-google',
    summary: 'A deep, data-driven audit of Moniepoint’s historic Series C fundraise that elevated the business to unicorn status and strengthened payment infrastructures in Nigeria.',
    content: `
# The $110M War Chest: How Moniepoint Became Africa’s Newest Tech Unicorn under DPI and Google Support

In late 2024, a major capital injection solidified Nigeria's fintech maturity. **Moniepoint Inc.**, a leader in digital business banking and consumer payments in West Africa, announced the close of a **$110 million Series C funding round**. The equity raise was led by **Development Partners International (DPI)**, via its ADP III fund, alongside participation from **Google’s Africa Investment Fund**, **Verod Capital**, and global impact investor **Lightrock**.

The successful close of this round officially pushed Moniepoint into the highly exclusive billion-dollar valuation tier, crowning it as Africa’s newest fintech unicorn. 

> "This capital is a strong validation of our operational model. By bringing digital banking directly to informal traders and community mom-and-pop shops, we have formalised payments for millions of businesses that represent the backbone of Nigeria's real economy."
> — _Tosin Eniolorunda, CEO of Moniepoint_

## Financing Evolution: Structuring Scale

Unlike traditional digital players that rely solely on virtual applications, Moniepoint's dominance is anchored on a hybrid model that heavily utilises secure, robust merchant Point of Sale (PoS) terminals and an extremely dense network of local agents. This tactical combination has allowed them to deliver near-perfect uptime for trade settlements, even in semi-urban regions lacking dense cellular base-stations.

### Venture Capital Funding Trajectory

| Funding Stage | Capital Raised | Lead Investors Involved | Strategic Corporate Milestones achieved |
| :--- | :--- | :--- | :--- |
| **Seed Round** | $1.2M | Local Angels & Early Stage VCs | Prototype agent POS terminals mapped across local Lagos markets |
| **Series A** | $25M | QED Investors, Lightrock | Migration of core accounting systems; expanded into business accounts |
| **Series B** | $50M | Lightrock, institutional lenders | Crossed 500,000 active business endpoints; obtained local banking licenses |
| **Series C (2024)** | **$110M** | **DPI, Google Africa Fund, Verod** | **Officially declared Unicorn; expansion launches into personal digital banking** |

## Algorithmic Settlement Liquidity Routing

At the heart of Moniepoint’s infrastructure is an automated routing mechanism that monitors bank settlement success indices across multiple commercial gateway interfaces. When a clearance rate drops on a particular bank’s server, settlements are instantly shifted to robust endpoints. This prevents transaction failures at the counter.

\`\`\`typescript
// Settlement gateway health inspector and automated failover routine
interface BankGateway {
  code: string;
  successRate: number; // Percentage float 0-1
  averageSpeedMs: number;
}

export function routeMerchantPayment(amountNgn: number, gateways: BankGateway[]): string {
  const healthyGateways = gateways.filter(g => g.successRate >= 0.96);
  if (healthyGateways.length === 0) {
    // Failover to secondary ledger fallback routing
    return "GATEWAY_LOCAL_LEDGER_FALLBACK";
  }
  
  // Sort by speed and choose the fastest active node
  healthyGateways.sort((a, b) => a.averageSpeedMs - b.averageSpeedMs);
  return \`GATEWAY_ROUTE_\${healthyGateways[0].code}\`;
}
\`\`\`

## What Lies Ahead: Cross-Border Trade and Micro-Lending

With over **₦1.2 Trillion processed monthly** across their ecosystem, Moniepoint is leveraging its Series C proceeds to build robust credit underwriting scoring models. Using the massive transaction histories of their merchant base, they are launching instantaneous micro-business loans that bypass traditional collaterals.

As the brand builds regional pathways on the continent, its successful funding symbolizes a new era of mature, unit-economic positive digital infrastructure development in sub-Saharan Africa.
    `,
    wordCount: 810,
    readingTime: 4,
    featuredImage: 'https://picsum.photos/seed/moniepointad/1200/630',
    status: 'Published',
    authorId: 'user-chioma',
    categoryId: 'cat-1',
    tags: ['Tech', 'Fintech', 'Unicorn', 'Funding', 'Moniepoint', 'Nigeria'],
    seoTitle: 'Inside Moniepoints $110M Series C Funding Round | Ofofo.ng',
    seoDescription: 'A comprehensive investigation into the financial strategies, investor details, and infrastructure enabling Moniepoint’s unicorn status.',
    viewCount: 18920,
    likeCount: 6512,
    sponsored: false,
    premiumOnly: false,
    publishedAt: '2026-05-24T10:00:00Z',
    createdAt: '2026-05-22T08:00:00Z',
  },
  {
    id: 'art-3',
    title: 'The Cardoso Regime: CBN Escalates MPR to 27.25% in High-Stakes Battle Against Double-Digit Inflation',
    slug: 'cardoso-cbn-mpr-hike-interest-rate-inflation-nigeria',
    summary: 'Analyzing the Central Bank of Nigeria’s aggressive contractionary policy adjustments under Governor Olayemi Cardoso to arrest core inflation and defend the Naira.',
    content: `
# The Cardoso Regime: CBN Escalates MPR to 27.25% in High-Stakes Battle Against Double-Digit Inflation

In its continuing campaign to restore macroeconomic stability and halt persistent currency depreciation, the **Central Bank of Nigeria (CBN)**, under the direct stewardship of **Governor Olayemi Cardoso**, moved with aggressive, contractionary resolution. The Monetary Policy Committee (MPC) voted decisively to increase the benchmark benchmark interest rate—the Monetary Policy Rate (MPR)—to **27.25%**. 

This fiscal tightening underlines the central bank’s singular focus on reigning in double-digit headline inflation, which has repeatedly hovered above **33%** due to food, fuel, and transport supply-side pressures.

> "Our policy direction remains straightforward and clear: we must suppress circulating excess money supply and stabilize price indices. Macroeconomic credit predictability is a non-negotiable precursor to long-term industrial investment in Nigeria."
> — _Dr. Tarik Ibrahim, Senior Policy Advisor_

## The Mechanics of Tightening: Cash Reserves and Liquidity

The central bank’s stabilization playbook relies on raising the cost of credit while simultaneously withdrawing systemic liquidity from commercial banks. In tandem with the benchmark hike, the MPC adjusted key reserve ratios:
1. **The Cash Reserve Ratio (CRR):** Positioned upward to keep high reserve percentages directly locked inside primary central bank vault accounts.
2. **The Liquidity Ratio:** Formulated to mandate commercial bank reserves of premium, low-risk sovereign assets and Treasury bills.

### Crucial Financial Indicator Shifts

| Monetary Tool | Pre-Cardoso Benchmarks | Current Policy Guideline | Immediate Impact on Commercial Lending rates |
| :--- | :--- | :--- | :--- |
| **Monetary Policy Rate (MPR)** | 18.75% | **27.25%** | Real borrowing rates surged to 32% - 35% for medium corporate ventures |
| **Cash Reserve Ratio (CRR)** | 32.50% | **50.00% (Merchant Banks)** | Significant liquidity sterilization; reduction in aggressive commercial portfolios |
| **Liquidity Ratio** | 30.00% | **35.00%** | Forced banks to secure sovereign bills, stabilizing domestic treasury pipelines |
| **Asymmetric Corridor** | +100 / -300 bps | **+100 / -300 bps** | Governs short-term interbank landing interest rates, restricting volatility |

## Algorithmic Risk Modeling for Foreign Portfolio Investors

To restore capital flows, Governor Cardoso’s team has worked diligently to clear outstanding foreign exchange backlogs, offering high-yield Treasury bills at attractive coupons to entice Foreign Portfolio Investors (FPIs). 

Commercial treasurers are utilizing automated hedging scripts to hedge against currency depreciation margins:

\`\`\`typescript
// Portfolio Currency Arbitrage yield optimization script
interface AssetYield {
  sovereignBillRate: number; // e.g. 0.22 (22% per annum)
  projectedYoyDepreciation: number; // e.g. 0.08 (8%)
  frictionalTaxPct: number; // withholding taxes
}

export function calculateRealPortfolioYield(investment: AssetYield): number {
  const nominalReturn = 1 + investment.sovereignBillRate;
  const depreciationFactor = 1 - investment.projectedYoyDepreciation;
  const netReturnMultiplier = nominalReturn * depreciationFactor;
  
  const realYield = netReturnMultiplier - 1;
  const afterTaxYield = realYield * (1 - investment.frictionalTaxPct);
  return afterTaxYield;
}
\`\`\`

## Micro-Economic Strains vs. Macro Stability

While international ratings agencies and IMF representatives have commended the central bank's orthodox, inflation-targeting disciplines, local manufacturers and agricultural collectives are experiencing intense credit constraints. With interest rates exceeding 30% on standard corporate loans, buying inventory or upgrading manufacturing gears has become extremely costly.

The CBN faces a delicate balancing act. It must keep credit tight to defend the currency and anchor inflation expectations, while avoiding a severe manufacturing slowdown. The coming quarters will test whether Governor Cardoso's aggressive fiscal medicines can steer West Africa's largest economic market to a safe landing.
    `,
    wordCount: 880,
    readingTime: 4,
    featuredImage: 'https://picsum.photos/seed/solarfactory/1200/630',
    status: 'Published',
    authorId: 'user-tarik',
    categoryId: 'cat-2',
    tags: ['Business', 'Markets', 'Macroeconomics', 'CBN', 'Interest Rates', 'Policy', 'Nigeria'],
    seoTitle: 'CBN Cardoso MPR Rate Hike to 27.25% | Ofofo.ng',
    seoDescription: 'An analytical investigation into the Central Bank of Nigeria’s tight contractionary monetary policy limits under Governor Cardoso.',
    viewCount: 14500,
    likeCount: 3120,
    sponsored: false,
    premiumOnly: true,
    publishedAt: '2026-05-28T09:00:00Z',
    createdAt: '2026-05-27T12:00:00Z',
  }
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    articleId: 'art-1',
    userId: 'user-tarik',
    userName: 'Tarik Ibrahim',
    userAvatar: 'https://picsum.photos/seed/tarik/300/300',
    content: 'Brilliant breakdown, Joseph. The Delaware flip is indeed the unsung savior of our funding pipelines, but it does leave our local judicial infrastructure lagging. If all contracts are governed by foreign courts, we miss out on building commercial precedents locally.',
    likes: 18,
    status: 'Approved',
    createdAt: '2026-05-21T06:40:00Z',
  },
  {
    id: 'comm-2',
    articleId: 'art-1',
    userName: 'Adebayo Johnson',
    content: 'As a startup founder in Yaba, the fiber infrastructure laydown in 2011 was definitely the catalyst. However, we desperately need municipal policy reform to protect against multiple taxations by local government agents.',
    likes: 24,
    status: 'Approved',
    createdAt: '2026-05-21T10:15:00Z',
  },
  {
    id: 'comm-3',
    articleId: 'art-1',
    parentId: 'comm-2',
    userName: 'Yomi S.',
    content: 'Agreed, local municipal agents show up with bizarre permits and levies every quarter. It is a major drain on early-stage seed capital.',
    likes: 7,
    status: 'Approved',
    createdAt: '2026-05-21T11:30:00Z',
  }
];

const SEED_NEWSLETTERS: Newsletter[] = [
  { id: 'nl-1', email: 'investor.rel@capital.com', segment: 'Prime', verified: true, createdAt: '2026-05-15T09:00:00Z' },
  { id: 'nl-2', email: 'tech_enthusiast99@yahoo.com', segment: 'Standard', verified: true, createdAt: '2026-05-18T14:22:00Z' }
];

const SEED_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-header',
    title: 'Paystack Private Beta: Scaling Cross-Border Merchant Integrations',
    imageUrl: 'https://picsum.photos/seed/paystackad/970/250',
    link: 'https://paystack.com',
    position: 'Header-Banner',
    views: 25410,
    clicks: 1284,
    active: true,
    createdAt: '2026-05-01T00:00:00Z'
  },
  {
    id: 'ad-sidebar',
    title: 'Stripe for African Builders: Connect to Global Billing Pipelines',
    imageUrl: 'https://picsum.photos/seed/stripead/300/600',
    link: 'https://stripe.com',
    position: 'Sidebar-Widget',
    views: 18450,
    clicks: 651,
    active: true,
    createdAt: '2026-05-01T00:00:00Z'
  }
];

const SEED_ANALYTICS: AnalyticsMetrics[] = [
  {
    day: '2026-06-01',
    pageViews: 12400,
    uniqueVisitors: 4500,
    revenue: 450000,
    subscriberGrowth: 45,
    topArticles: [
      { articleId: 'art-1', title: 'The Yaba Consensus', views: 4200 },
      { articleId: 'art-3', title: 'The Cardoso Regime', views: 3100 }
    ],
    trafficSources: [
      { source: 'Twitter/X', count: 5400 },
      { source: 'LinkedIn', count: 3200 },
      { source: 'Direct', count: 2100 },
      { source: 'Google', count: 1700 }
    ],
    topAuthors: [
      { authorId: 'user-chioma', fullName: 'Joseph Ozovehe Samuel', views: 7200 },
      { authorId: 'user-tarik', fullName: 'Tarik Ibrahim', views: 5200 }
    ]
  },
  {
    day: '2026-06-02',
    pageViews: 14500,
    uniqueVisitors: 5200,
    revenue: 580000,
    subscriberGrowth: 62,
    topArticles: [
      { articleId: 'art-1', title: 'The Yaba Consensus', views: 5100 },
      { articleId: 'art-2', title: 'The $110M War Chest', views: 4300 }
    ],
    trafficSources: [
      { source: 'Twitter/X', count: 6200 },
      { source: 'LinkedIn', count: 3800 },
      { source: 'Direct', count: 2500 },
      { source: 'Google', count: 2000 }
    ],
    topAuthors: [
      { authorId: 'user-chioma', fullName: 'Joseph Ozovehe Samuel', views: 8500 },
      { authorId: 'user-tarik', fullName: 'Tarik Ibrahim', views: 6000 }
    ]
  },
  {
    day: '2026-06-03',
    pageViews: 16800,
    uniqueVisitors: 6100,
    revenue: 720000,
    subscriberGrowth: 78,
    topArticles: [
      { articleId: 'art-1', title: 'The Yaba Consensus', views: 6100 },
      { articleId: 'art-2', title: 'The $110M War Chest', views: 5400 }
    ],
    trafficSources: [
      { source: 'Twitter/X', count: 7100 },
      { source: 'LinkedIn', count: 4200 },
      { source: 'Direct', count: 3000 },
      { source: 'Google', count: 2500 }
    ],
    topAuthors: [
      { authorId: 'user-chioma', fullName: 'Joseph Ozovehe Samuel', views: 9800 },
      { authorId: 'user-tarik', fullName: 'Tarik Ibrahim', views: 7000 }
    ]
  }
];

const INITIAL_STATE: DBState = {
  profiles: SEED_PROFILES,
  categories: SEED_CATEGORIES,
  articles: SEED_ARTICLES,
  comments: SEED_COMMENTS,
  newsletters: SEED_NEWSLETTERS,
  revisions: [],
  auditLogs: [],
  advertisements: SEED_ADVERTISEMENTS,
  mediaLibrary: [],
  analytics: SEED_ANALYTICS,
};

const DB_FILE_PATH = path.join('/tmp', 'ofofo_db.json');

export function getDB(): DBState {
  if (!fs.existsSync(DB_FILE_PATH)) {
    saveDB(INITIAL_STATE);
    return INITIAL_STATE;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    
    // Safety check that loaded data actually has keys we expect
    if (!parsed.articles || !parsed.profiles || !parsed.categories) {
      saveDB(INITIAL_STATE);
      return INITIAL_STATE;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning seed values', err);
    return INITIAL_STATE;
  }
}

export function saveDB(state: DBState) {
  try {
    const parentDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file', err);
  }
}

// DATABASE TRANSACTIONS & MODIFIERS (Fully typed, thread-safe local queries)

export const db = {
  // --- ARTICLES ---
  getArticles: (status?: PostStatus): Article[] => {
    const state = getDB();
    if (status) {
      return state.articles.filter((a) => a.status === status);
    }
    return state.articles;
  },

  getArticleById: (id: string): Article | undefined => {
    return getDB().articles.find((a) => a.id === id);
  },

  getArticleBySlug: (slug: string): Article | undefined => {
    return getDB().articles.find((a) => a.slug === slug);
  },

  createArticle: (articleData: Omit<Article, 'id' | 'viewCount' | 'likeCount' | 'wordCount' | 'readingTime' | 'createdAt'>): Article => {
    const state = getDB();
    const wordCount = arrayLength(articleData.content.split(/\s+/));
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));
    
    const newArticle: Article = {
      ...articleData,
      id: `art-${idGenerator()}`,
      viewCount: 0,
      likeCount: 0,
      wordCount,
      readingTime,
      createdAt: new Date().toISOString(),
    };

    state.articles.push(newArticle);
    
    // Add Audit Log
    state.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId: articleData.authorId,
      action: 'Article Created',
      details: { articleId: newArticle.id, title: newArticle.title },
      createdAt: new Date().toISOString()
    });

    saveDB(state);
    return newArticle;
  },

  updateArticle: (id: string, updates: Partial<Article>, editorId: string, changeSummary?: string): Article => {
    const state = getDB();
    const index = state.articles.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Article not found');

    const oldArticle = state.articles[index];
    
    // Calculate new stats if content changes
    let wordCount = oldArticle.wordCount;
    let readingTime = oldArticle.readingTime;
    if (updates.content) {
      wordCount = arrayLength(updates.content.split(/\s+/));
      readingTime = Math.max(1, Math.ceil(wordCount / 220));
    }

    const updatedArticle: Article = {
      ...oldArticle,
      ...updates,
      wordCount,
      readingTime,
    };

    state.articles[index] = updatedArticle;

    // Track Version History
    if (updates.content || updates.title || updates.summary) {
      state.revisions.push({
        id: `rev-${idGenerator()}`,
        articleId: id,
        editorId,
        title: updates.title || oldArticle.title,
        content: updates.content || oldArticle.content,
        summary: updates.summary || oldArticle.summary,
        changeSummary: changeSummary || 'General details updated',
        createdAt: new Date().toISOString(),
      });
    }

    // Add Audit Log of Status switch
    if (updates.status && updates.status !== oldArticle.status) {
      state.auditLogs.push({
        id: `audit-${idGenerator()}`,
        actorId: editorId,
        action: 'Article Status Changed',
        details: { articleId: id, oldStatus: oldArticle.status, newStatus: updates.status },
        createdAt: new Date().toISOString()
      });
    }

    saveDB(state);
    return updatedArticle;
  },

  deleteArticle: (id: string, actorId: string) => {
    const state = getDB();
    const filtered = state.articles.filter((a) => a.id !== id);
    state.articles = filtered;

    state.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId,
      action: 'Article Deleted',
      details: { articleId: id },
      createdAt: new Date().toISOString()
    });

    saveDB(state);
  },

  incrementViewCount: (id: string): number => {
    const state = getDB();
    const article = state.articles.find((a) => a.id === id);
    if (article) {
      article.viewCount += 1;
      saveDB(state);
      return article.viewCount;
    }
    return 0;
  },

  incrementLikeCount: (id: string): number => {
    const state = getDB();
    const article = state.articles.find((a) => a.id === id);
    if (article) {
      article.likeCount += 1;
      saveDB(state);
      return article.likeCount;
    }
    return 0;
  },

  // --- CATEGORIES ---
  getCategories: (): Category[] => {
    return getDB().categories;
  },

  createCategory: (name: string, description: string, icon: string): Category => {
    const state = getDB();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat-${idGenerator()}`,
      name,
      slug,
      description,
      icon,
    };
    state.categories.push(newCat);
    saveDB(state);
    return newCat;
  },

  // --- COMMENTS ---
  getComments: (articleId: string, clientView: boolean = true): Comment[] => {
    const state = getDB();
    const comments = state.comments.filter((c) => c.articleId === articleId);
    if (clientView) {
      // In web, only present approved ones
      return comments.filter((c) => c.status === 'Approved');
    }
    return comments;
  },

  getAllCommentsForModeration: (): Comment[] => {
    return getDB().comments;
  },

  addComment: (commentData: { articleId: string; userId?: string; userName: string; userAvatar?: string; content: string; parentId?: string }): Comment => {
    const state = getDB();
    const newComment: Comment = {
      ...commentData,
      id: `comm-${idGenerator()}`,
      likes: 0,
      status: 'Approved', // Auto approved for prototype ease unless reported
      createdAt: new Date().toISOString(),
    };
    state.comments.push(newComment);
    saveDB(state);
    return newComment;
  },

  moderateComment: (commentId: string, status: CommentStatus, actorId?: string): Comment => {
    const state = getDB();
    const comment = state.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');
    comment.status = status;

    state.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId,
      action: `Comment Moderated to ${status}`,
      details: { commentId },
      createdAt: new Date().toISOString()
    });

    saveDB(state);
    return comment;
  },

  incrementCommentLikes: (commentId: string): number => {
    const state = getDB();
    const comment = state.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.likes += 1;
      saveDB(state);
      return comment.likes;
    }
    return 0;
  },

  // --- PROFILES & AUTH SWITCHER ---
  getProfiles: (): UserProfile[] => {
    return getDB().profiles;
  },

  getProfile: (id: string): UserProfile | undefined => {
    return getDB().profiles.find((p) => p.id === id);
  },

  updateProfile: (id: string, updates: Partial<UserProfile>): UserProfile => {
    const state = getDB();
    const index = state.profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');

    const updatedProfile = {
      ...state.profiles[index],
      ...updates
    };
    state.profiles[index] = updatedProfile;
    saveDB(state);
    return updatedProfile;
  },

  saveArticleToProfile: (userId: string, articleId: string): boolean => {
    const state = getDB();
    const profile = state.profiles.find((p) => p.id === userId);
    if (profile) {
      if (!profile.savedArticles.includes(articleId)) {
        profile.savedArticles.push(articleId);
        saveDB(state);
        return true;
      } else {
        profile.savedArticles = profile.savedArticles.filter((id) => id !== articleId);
        saveDB(state);
        return false; // Removed
      }
    }
    return false;
  },

  followAuthor: (userId: string, targetAuthorId: string): boolean => {
    const state = getDB();
    const profile = state.profiles.find((p) => p.id === userId);
    if (profile) {
      if (!profile.followedAuthors.includes(targetAuthorId)) {
        profile.followedAuthors.push(targetAuthorId);
        saveDB(state);
        return true;
      } else {
        profile.followedAuthors = profile.followedAuthors.filter((id) => id !== targetAuthorId);
        saveDB(state);
        return false; // Unfollowed
      }
    }
    return false;
  },

  // --- NEWSLETTERS ---
  subscribeNewsletter: (email: string, segment: string = 'Standard'): Newsletter => {
    const state = getDB();
    const existing = state.newsletters.find((n) => n.email === email);
    if (existing) return existing;

    const newSub: Newsletter = {
      id: `nl-${idGenerator()}`,
      email,
      segment,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    state.newsletters.push(newSub);
    saveDB(state);
    return newSub;
  },

  getNewsletterSubscribers: (): Newsletter[] => {
    return getDB().newsletters;
  },

  // --- AUDIT & REVISIONS ---
  getRevisions: (articleId: string): Revision[] => {
    return getDB().revisions.filter((r) => r.articleId === articleId);
  },

  getAuditLogs: (): AuditLog[] => {
    return getDB().auditLogs;
  },

  // --- ADS SYSTEM ---
  getAds: (): Advertisement[] => {
    return getDB().advertisements;
  },

  recordAdImpression: (id: string) => {
    const state = getDB();
    const ad = state.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.views += 1;
      saveDB(state);
    }
  },

  recordAdClick: (id: string) => {
    const state = getDB();
    const ad = state.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.clicks += 1;
      saveDB(state);
    }
  },

  // --- MEDIA LIBRARY ---
  getMediaLibrary: (): MediaAsset[] => {
    return getDB().mediaLibrary;
  },

  addMedia: (filename: string, folder: string, size: number, mimeType: string, url: string, authorId: string): MediaAsset => {
    const state = getDB();
    const newMedia: MediaAsset = {
      id: `media-${idGenerator()}`,
      filename,
      folder,
      url,
      size,
      mimeType,
      authorId,
      createdAt: new Date().toISOString(),
    };
    state.mediaLibrary.push(newMedia);
    saveDB(state);
    return newMedia;
  },

  // --- ANALYTICS ---
  getAnalytics: (): AnalyticsMetrics[] => {
    return getDB().analytics;
  }
};

// HELPERS
function idGenerator(): string {
  return Math.random().toString(36).substring(2, 9);
}

function arrayLength<T>(arr: T[] | any): number {
  if (Array.isArray(arr)) return arr.length;
  return 0;
}
