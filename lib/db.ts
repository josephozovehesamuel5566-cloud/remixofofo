import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

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

// DETERMINISTIC UUID MAPPING ENGINE FOR COMPATIBILITY BETWEEN MOCK IDS AND POSTGRES STRICT UUIDv4 COLUMN CONSTRAINTS
export function toUUID(id: string): string {
  if (!id) return '00000000-0000-4000-a000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();

  if (id === 'user-admin') return 'a0a0a0a0-0000-4000-a000-000000000000';
  if (id === 'user-chioma') return 'c0c0c0c0-0000-4000-a000-c00000000000';
  if (id === 'user-tarik') return 't0t0t0t0-0000-4000-a000-t000000000000';
  if (id === 'user-tolani') return 'd0d0d0d0-0000-4000-a000-d00000000000';

  if (id === 'cat-1') return 'c1c1c1c1-1111-4111-a111-111111111111';
  if (id === 'cat-2') return 'c2c2c2c2-2222-4222-a222-222222222222';
  if (id === 'cat-3') return 'c3c3c3c3-3333-4333-a333-333333333333';
  if (id === 'cat-4') return 'c4c4c4c4-4444-4444-a444-444444444444';
  if (id === 'cat-5') return 'c5c5c5c5-5555-5555-a555-555555555555';

  if (id === 'art-1') return 'e1e1e1e1-1111-4111-a111-111111111111';
  if (id === 'art-2') return 'e2e2e2e2-2222-4222-a222-222222222222';
  if (id === 'art-3') return 'e3e3e3e3-3333-4333-a333-333333333333';

  if (id === 'comm-1') return 'b1b1b1b1-1111-4111-b111-111111111111';
  if (id === 'comm-2') return 'b2b2b2b2-2222-4222-b222-222222222222';
  if (id === 'comm-3') return 'b3b3b3b3-3333-4333-b333-333333333333';

  if (id === 'ad-header') return 'ad000000-bed1-4000-a000-000000000001';
  if (id === 'ad-sidebar') return 'ad000000-bed2-4000-a000-000000000002';

  // Fallback hashing
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padEnd(8, '0').slice(0, 8);
  return `${hex}-eeee-4eee-aeee-eeeeeeeeeeee`;
}

export function fromUUID(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase();
  if (lower === 'a0a0a0a0-0000-4000-a000-000000000000') return 'user-admin';
  if (lower === 'c0c0c0c0-0000-4000-a000-c00000000000') return 'user-chioma';
  if (lower === 't0t0t0t0-0000-4000-a000-t000000000000') return 'user-tarik';
  if (lower === 'd0d0d0d0-0000-4000-a000-d00000000000') return 'user-tolani';

  if (lower === 'c1c1c1c1-1111-4111-a111-111111111111') return 'cat-1';
  if (lower === 'c2c2c2c2-2222-4222-a222-222222222222') return 'cat-2';
  if (lower === 'c3c3c3c3-3333-4333-a333-333333333333') return 'cat-3';
  if (lower === 'c4c4c4c4-4444-4444-a444-444444444444') return 'cat-4';
  if (lower === 'c5c5c5c5-5555-5555-a555-555555555555') return 'cat-5';

  if (lower === 'e1e1e1e1-1111-4111-a111-111111111111') return 'art-1';
  if (lower === 'e2e2e2e2-2222-4222-a222-222222222222') return 'art-2';
  if (lower === 'e3e3e3e3-3333-4333-a333-333333333333') return 'art-3';

  if (lower === 'b1b1b1b1-1111-4111-b111-111111111111') return 'comm-1';
  if (lower === 'b2b2b2b2-2222-4222-b222-222222222222') return 'comm-2';
  if (lower === 'b3b3b3b3-3333-4333-b333-333333333333') return 'comm-3';

  if (lower === 'ad000000-bed1-4000-a000-000000000001') return 'ad-header';
  if (lower === 'ad000000-bed2-4000-a000-000000000002') return 'ad-sidebar';

  return id;
}

// LAZY SUPABASE CLIENT INITIALIZATION MODEL
let supabaseClientSingle: any = null;

export function getSupabase(): any {
  if (!supabaseClientSingle) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key && url !== 'MY_SUPABASE_URL' && key !== 'MY_SUPABASE_ANON_KEY') {
      supabaseClientSingle = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    }
  }
  return supabaseClientSingle;
}

// SEED CONTENT - ORIGINAL HIGH-FIDELITY AFRICAN ARTICLES
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

const SEED_ARTICLES: Article[] = [];

const SEED_COMMENTS: Comment[] = [];

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

// LOCAL SYNCHRONOUS FILE FALLBACK DATABASE METHODS
function getLocalDB(): DBState {
  if (!fs.existsSync(DB_FILE_PATH)) {
    saveLocalDB(INITIAL_STATE);
    return INITIAL_STATE;
  }
  try {
    const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.articles || !parsed.profiles || !parsed.categories) {
      saveLocalDB(INITIAL_STATE);
      return INITIAL_STATE;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading local database file', err);
    return INITIAL_STATE;
  }
}

function saveLocalDB(state: DBState) {
  try {
    const parentDir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local database file', err);
  }
}

let isSeededChecked = false;
let seedPromise: Promise<void> | null = null;

// AUTOMATIC SEED TRIGGER FOR THE LIVE SUPABASE DATABASE ON FIRST CALL
async function ensureSeeded(supabase: any) {
  if (isSeededChecked) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking categories row count in Supabase:', error);
        return;
      }

      if (count === 0) {
        console.log('Supabase tables are empty. Seeding initial published catalog...');
        
        // 1. Categories
        const catsToInsert = SEED_CATEGORIES.map(c => ({
          id: toUUID(c.id),
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon
        }));
        await supabase.from('categories').insert(catsToInsert);

        // 2. Profiles
        const profilesToInsert = SEED_PROFILES.map(p => ({
          id: toUUID(p.id),
          email: p.email,
          full_name: p.fullName,
          role: p.role,
          bio: p.bio,
          avatar_url: p.avatarUrl,
          followed_authors: (p.followedAuthors || []).map(id => toUUID(id)),
          followed_topics: p.followedTopics || [],
          saved_articles: (p.savedArticles || []).map(id => toUUID(id)),
          reading_history: p.readingHistory || []
        }));
        await supabase.from('profiles').insert(profilesToInsert);

        // 3. Articles
        const articlesToInsert = SEED_ARTICLES.map(a => ({
          id: toUUID(a.id),
          title: a.title,
          slug: a.slug,
          content: a.content,
          summary: a.summary,
          word_count: a.wordCount,
          reading_time: a.readingTime,
          featured_image: a.featuredImage,
          status: a.status,
          author_id: toUUID(a.authorId),
          category_id: toUUID(a.categoryId),
          tags: a.tags,
          seo_title: a.seoTitle,
          seo_description: a.seoDescription,
          view_count: a.viewCount,
          like_count: a.likeCount,
          sponsored: a.sponsored,
          premium_only: a.premiumOnly,
          published_at: a.publishedAt || new Date().toISOString()
        }));
        await supabase.from('articles').insert(articlesToInsert);

        // 4. Comments
        const commentsToInsert = SEED_COMMENTS.map(c => ({
          id: toUUID(c.id),
          article_id: toUUID(c.articleId),
          user_id: c.userId ? toUUID(c.userId) : null,
          user_name: c.userName,
          user_avatar: c.userAvatar,
          content: c.content,
          parent_id: c.parentId ? toUUID(c.parentId) : null,
          likes: c.likes || 0,
          status: c.status
        }));
        await supabase.from('comments').insert(commentsToInsert);

        // 5. Advertisements
        const adsToInsert = SEED_ADVERTISEMENTS.map(ad => ({
          id: toUUID(ad.id),
          title: ad.title,
          image_url: ad.imageUrl,
          link: ad.link,
          position: ad.position,
          views: ad.views || 0,
          clicks: ad.clicks || 0,
          active: ad.active
        }));
        await supabase.from('advertisements').insert(adsToInsert);

        // 6. Analytics
        const analyticsToInsert = SEED_ANALYTICS.map(an => ({
          day: an.day,
          page_views: an.pageViews,
          unique_visitors: an.uniqueVisitors,
          revenue: an.revenue,
          subscriber_growth: an.subscriberGrowth,
          top_articles: (an.topArticles || []).map(ta => ({ ...ta, articleId: toUUID(ta.articleId) })),
          traffic_sources: an.trafficSources || [],
          top_authors: (an.topAuthors || []).map(tau => ({ ...tau, authorId: toUUID(tau.authorId) }))
        }));
        await supabase.from('analytics_metrics').insert(analyticsToInsert);

        console.log('Seeding fully completed for Supabase.');
      }
      isSeededChecked = true;
    } catch (err) {
      console.error('Exception in ensureSeeded:', err);
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}


// SNAKECASE TO CAMELCASE MAPPER ROUTINES FOR PRODUCING CLEAN DATA MODELS

function mapProfileToCamel(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role as UserRole,
    bio: row.bio || undefined,
    avatarUrl: row.avatar_url || undefined,
    followedAuthors: row.followed_authors || [],
    followedTopics: row.followed_topics || [],
    savedArticles: row.saved_articles || [],
    readingHistory: Array.isArray(row.reading_history) ? row.reading_history : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapCategoryToCamel(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    icon: row.icon || '',
  };
}

function mapArticleToCamel(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.summary,
    wordCount: row.word_count || 0,
    readingTime: row.reading_time || 0,
    featuredImage: row.featured_image || '',
    audioNarrationUrl: row.audio_narration_url || undefined,
    status: row.status as PostStatus,
    authorId: row.author_id,
    categoryId: row.category_id,
    tags: row.tags || [],
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    viewCount: row.view_count || 0,
    likeCount: row.like_count || 0,
    sponsored: !!row.sponsored,
    premiumOnly: !!row.premium_only,
    publishedAt: row.published_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapCommentToCamel(row: any): Comment {
  return {
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id || undefined,
    userName: row.user_name,
    userAvatar: row.user_avatar || undefined,
    content: row.content,
    parentId: row.parent_id || undefined,
    likes: row.likes || 0,
    status: row.status as CommentStatus,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapNewsletterToCamel(row: any): Newsletter {
  return {
    id: row.id,
    email: row.email,
    segment: row.segment,
    verified: !!row.verified,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapRevisionToCamel(row: any): Revision {
  return {
    id: row.id,
    articleId: row.article_id,
    editorId: row.editor_id,
    title: row.title,
    content: row.content,
    summary: row.summary || '',
    changeSummary: row.change_summary || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAuditLogToCamel(row: any): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id || undefined,
    action: row.action,
    details: row.details || {},
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAdvertisementToCamel(row: any): Advertisement {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    link: row.link,
    position: row.position as AdPosition,
    views: row.views || 0,
    clicks: row.clicks || 0,
    active: !!row.active,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapMediaToCamel(row: any): MediaAsset {
  return {
    id: row.id,
    filename: row.filename,
    folder: row.folder,
    url: row.url,
    size: row.size,
    mimeType: row.mime_type,
    authorId: row.author_id,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapAnalyticsToCamel(row: any): AnalyticsMetrics {
  return {
    day: row.day,
    pageViews: row.page_views || 0,
    uniqueVisitors: row.unique_visitors || 0,
    revenue: Number(row.revenue) || 0,
    subscriberGrowth: row.subscriber_growth || 0,
    topArticles: Array.isArray(row.top_articles) ? row.top_articles : [],
    trafficSources: Array.isArray(row.traffic_sources) ? row.traffic_sources : [],
    topAuthors: Array.isArray(row.top_authors) ? row.top_authors : [],
  };
}

// MASTER DATABASE OPERATIONS OBJECT (Durable Supabase Primary with JSON/Memory Resilience Fallback)

export const db = {
  // --- ARTICLES ---
  getArticles: async (status?: PostStatus): Promise<Article[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      let query = supabase.from('articles').select('*');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching articles from Supabase:', error);
        return [];
      }
      return (data || []).map((row: any) => mapArticleToCamel(row)).map((a: any) => ({
        ...a,
        id: fromUUID(a.id),
        authorId: fromUUID(a.authorId),
        categoryId: fromUUID(a.categoryId)
      }));
    }

    // Fallback
    const local = getLocalDB();
    if (status) {
      return local.articles.filter((a) => a.status === status);
    }
    return local.articles;
  },

  getArticleById: async (id: string): Promise<Article | undefined> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('articles').select('*').eq('id', toUUID(id)).single();
      if (error || !data) return undefined;
      const a = mapArticleToCamel(data);
      return {
        ...a,
        id: fromUUID(a.id),
        authorId: fromUUID(a.authorId),
        categoryId: fromUUID(a.categoryId)
      };
    }

    // Fallback
    return getLocalDB().articles.find((a) => a.id === id);
  },

  getArticleBySlug: async (slug: string): Promise<Article | undefined> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).single();
      if (error || !data) return undefined;
      const a = mapArticleToCamel(data);
      return {
        ...a,
        id: fromUUID(a.id),
        authorId: fromUUID(a.authorId),
        categoryId: fromUUID(a.categoryId)
      };
    }

    // Fallback
    return getLocalDB().articles.find((a) => a.slug === slug);
  },

  createArticle: async (articleData: Omit<Article, 'id' | 'viewCount' | 'likeCount' | 'wordCount' | 'readingTime' | 'createdAt'>): Promise<Article> => {
    const wordCount = arrayLength(articleData.content.split(/\s+/));
    const readingTime = Math.max(1, Math.ceil(wordCount / 220));

    const supabase = getSupabase();
    if (supabase) {
      const artId = `art-${idGenerator()}`;
      const newArt = {
        id: toUUID(artId),
        title: articleData.title,
        slug: articleData.slug,
        content: articleData.content,
        summary: articleData.summary,
        word_count: wordCount,
        reading_time: readingTime,
        featured_image: articleData.featuredImage,
        audio_narration_url: articleData.audioNarrationUrl,
        status: articleData.status,
        author_id: toUUID(articleData.authorId),
        category_id: toUUID(articleData.categoryId),
        tags: articleData.tags,
        seo_title: articleData.seoTitle,
        seo_description: articleData.seoDescription,
        view_count: 0,
        like_count: 0,
        sponsored: articleData.sponsored,
        premium_only: articleData.premiumOnly,
        published_at: articleData.publishedAt || (articleData.status === 'Published' ? new Date().toISOString() : null)
      };
      
      const { data, error } = await supabase.from('articles').insert(newArt).select().single();
      if (error) {
        console.error('Error creating article in Supabase:', error);
        throw error;
      }

      await supabase.from('audit_logs').insert({
        actor_id: toUUID(articleData.authorId),
        action: 'Article Created',
        details: { articleId: fromUUID(data.id), title: data.title }
      });

      const a = mapArticleToCamel(data);
      return {
        ...a,
        id: fromUUID(a.id),
        authorId: fromUUID(a.authorId),
        categoryId: fromUUID(a.categoryId)
      };
    }

    // Fallback
    const local = getLocalDB();
    const fallbackArt: Article = {
      ...articleData,
      id: `art-${idGenerator()}`,
      viewCount: 0,
      likeCount: 0,
      wordCount,
      readingTime,
      createdAt: new Date().toISOString(),
    };
    local.articles.push(fallbackArt);
    local.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId: articleData.authorId,
      action: 'Article Created',
      details: { articleId: fallbackArt.id, title: fallbackArt.title },
      createdAt: new Date().toISOString()
    });
    saveLocalDB(local);
    return fallbackArt;
  },

  updateArticle: async (id: string, updates: Partial<Article>, editorId: string, changeSummary?: string): Promise<Article> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: oldData } = await supabase.from('articles').select('*').eq('id', toUUID(id)).single();
      const oldArticle = oldData ? mapArticleToCamel(oldData) : null;

      let wordCount = oldArticle?.wordCount || 0;
      let readingTime = oldArticle?.readingTime || 1;
      if (updates.content) {
        wordCount = arrayLength(updates.content.split(/\s+/));
        readingTime = Math.max(1, Math.ceil(wordCount / 220));
      }

      const snakeUpdates: any = {};
      if (updates.title !== undefined) snakeUpdates.title = updates.title;
      if (updates.slug !== undefined) snakeUpdates.slug = updates.slug;
      if (updates.content !== undefined) {
        snakeUpdates.content = updates.content;
        snakeUpdates.word_count = wordCount;
        snakeUpdates.reading_time = readingTime;
      }
      if (updates.summary !== undefined) snakeUpdates.summary = updates.summary;
      if (updates.featuredImage !== undefined) snakeUpdates.featured_image = updates.featuredImage;
      if (updates.audioNarrationUrl !== undefined) snakeUpdates.audio_narration_url = updates.audioNarrationUrl;
      if (updates.status !== undefined) snakeUpdates.status = updates.status;
      if (updates.authorId !== undefined) snakeUpdates.author_id = toUUID(updates.authorId);
      if (updates.categoryId !== undefined) snakeUpdates.category_id = toUUID(updates.categoryId);
      if (updates.tags !== undefined) snakeUpdates.tags = updates.tags;
      if (updates.seoTitle !== undefined) snakeUpdates.seo_title = updates.seoTitle;
      if (updates.seoDescription !== undefined) snakeUpdates.seo_description = updates.seoDescription;
      if (updates.viewCount !== undefined) snakeUpdates.view_count = updates.viewCount;
      if (updates.likeCount !== undefined) snakeUpdates.like_count = updates.likeCount;
      if (updates.sponsored !== undefined) snakeUpdates.sponsored = updates.sponsored;
      if (updates.premiumOnly !== undefined) snakeUpdates.premium_only = updates.premiumOnly;
      if (updates.publishedAt !== undefined) snakeUpdates.published_at = updates.publishedAt;

      const { data, error } = await supabase.from('articles').update(snakeUpdates).eq('id', toUUID(id)).select().single();
      if (error) {
        console.error('Error updating article in Supabase:', error);
        throw error;
      }

      if (updates.content || updates.title || updates.summary) {
        await supabase.from('revision_history').insert({
          article_id: toUUID(id),
          editor_id: toUUID(editorId),
          title: updates.title || oldArticle?.title || '',
          content: updates.content || oldArticle?.content || '',
          summary: updates.summary || oldArticle?.summary || '',
          change_summary: changeSummary || 'General details updated'
        });
      }

      if (updates.status && updates.status !== oldArticle?.status) {
        await supabase.from('audit_logs').insert({
          actor_id: toUUID(editorId),
          action: 'Article Status Changed',
          details: { articleId: id, oldStatus: oldArticle?.status, newStatus: updates.status }
        });
      }

      const a = mapArticleToCamel(data);
      return {
        ...a,
        id: fromUUID(a.id),
        authorId: fromUUID(a.authorId),
        categoryId: fromUUID(a.categoryId)
      };
    }

    // Fallback
    const local = getLocalDB();
    const index = local.articles.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Article not found');

    const oldArticle = local.articles[index];
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
    local.articles[index] = updatedArticle;

    if (updates.content || updates.title || updates.summary) {
      local.revisions.push({
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

    if (updates.status && updates.status !== oldArticle.status) {
      local.auditLogs.push({
        id: `audit-${idGenerator()}`,
        actorId: editorId,
        action: 'Article Status Changed',
        details: { articleId: id, oldStatus: oldArticle.status, newStatus: updates.status },
        createdAt: new Date().toISOString()
      });
    }

    saveLocalDB(local);
    return updatedArticle;
  },

  deleteArticle: async (id: string, actorId: string): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('articles').delete().eq('id', toUUID(id));
      if (error) {
        console.error('Error deleting article in Supabase:', error);
        throw error;
      }
      await supabase.from('audit_logs').insert({
        actor_id: toUUID(actorId),
        action: 'Article Deleted',
        details: { articleId: id }
      });
      return;
    }

    // Fallback
    const local = getLocalDB();
    local.articles = local.articles.filter((a) => a.id !== id);
    local.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId,
      action: 'Article Deleted',
      details: { articleId: id },
      createdAt: new Date().toISOString()
    });
    saveLocalDB(local);
  },

  incrementViewCount: async (id: string): Promise<number> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: current } = await supabase.from('articles').select('view_count').eq('id', toUUID(id)).single();
      if (current) {
        const nextViews = (current.view_count || 0) + 1;
        await supabase.from('articles').update({ view_count: nextViews }).eq('id', toUUID(id));
        return nextViews;
      }
      return 0;
    }

    // Fallback
    const local = getLocalDB();
    const article = local.articles.find((a) => a.id === id);
    if (article) {
      article.viewCount += 1;
      saveLocalDB(local);
      return article.viewCount;
    }
    return 0;
  },

  incrementLikeCount: async (id: string): Promise<number> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: current } = await supabase.from('articles').select('like_count').eq('id', toUUID(id)).single();
      if (current) {
        const nextLikes = (current.like_count || 0) + 1;
        await supabase.from('articles').update({ like_count: nextLikes }).eq('id', toUUID(id));
        return nextLikes;
      }
      return 0;
    }

    // Fallback
    const local = getLocalDB();
    const article = local.articles.find((a) => a.id === id);
    if (article) {
      article.likeCount += 1;
      saveLocalDB(local);
      return article.likeCount;
    }
    return 0;
  },

  // --- CATEGORIES ---
  getCategories: async (): Promise<Category[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return (data || []).map((row: any) => mapCategoryToCamel(row)).map((c: any) => ({
        ...c,
        id: fromUUID(c.id)
      }));
    }

    // Fallback
    return getLocalDB().categories;
  },

  createCategory: async (name: string, description: string, icon: string): Promise<Category> => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const supabase = getSupabase();
    if (supabase) {
      const catId = `cat-${idGenerator()}`;
      const { data, error } = await supabase.from('categories').insert({
        id: toUUID(catId),
        name,
        slug,
        description,
        icon
      }).select().single();
      if (error) throw error;
      const c = mapCategoryToCamel(data);
      return {
        ...c,
        id: fromUUID(c.id)
      };
    }

    // Fallback
    const local = getLocalDB();
    const newCat: Category = {
      id: `cat-${idGenerator()}`,
      name,
      slug,
      description,
      icon,
    };
    local.categories.push(newCat);
    saveLocalDB(local);
    return newCat;
  },

  // --- COMMENTS ---
  getComments: async (articleId: string, clientView: boolean = true): Promise<Comment[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      let query = supabase.from('comments').select('*').eq('article_id', toUUID(articleId));
      if (clientView) {
        query = query.eq('status', 'Approved');
      }
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map((row: any) => mapCommentToCamel(row)).map((c: any) => ({
        ...c,
        id: fromUUID(c.id),
        articleId: fromUUID(c.articleId),
        userId: c.userId ? fromUUID(c.userId) : undefined,
        parentId: c.parentId ? fromUUID(c.parentId) : undefined
      }));
    }

    // Fallback
    const local = getLocalDB();
    const comments = local.comments.filter((c) => c.articleId === articleId);
    if (clientView) {
      return comments.filter((c) => c.status === 'Approved');
    }
    return comments;
  },

  getAllCommentsForModeration: async (): Promise<Comment[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('comments').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapCommentToCamel(row)).map((c: any) => ({
        ...c,
        id: fromUUID(c.id),
        articleId: fromUUID(c.articleId),
        userId: c.userId ? fromUUID(c.userId) : undefined,
        parentId: c.parentId ? fromUUID(c.parentId) : undefined
      }));
    }

    // Fallback
    return getLocalDB().comments;
  },

  addComment: async (commentData: { articleId: string; userId?: string; userName: string; userAvatar?: string; content: string; parentId?: string }): Promise<Comment> => {
    const supabase = getSupabase();
    if (supabase) {
      const commId = `comm-${idGenerator()}`;
      const { data, error } = await supabase.from('comments').insert({
        id: toUUID(commId),
        article_id: toUUID(commentData.articleId),
        user_id: commentData.userId ? toUUID(commentData.userId) : null,
        user_name: commentData.userName,
        user_avatar: commentData.userAvatar,
        content: commentData.content,
        parent_id: commentData.parentId ? toUUID(commentData.parentId) : null,
        likes: 0,
        status: 'Approved'
      }).select().single();
      if (error) throw error;
      const c = mapCommentToCamel(data);
      return {
        ...c,
        id: fromUUID(c.id),
        articleId: fromUUID(c.articleId),
        userId: c.userId ? fromUUID(c.userId) : undefined,
        parentId: c.parentId ? fromUUID(c.parentId) : undefined
      };
    }

    // Fallback
    const local = getLocalDB();
    const newComment: Comment = {
      ...commentData,
      id: `comm-${idGenerator()}`,
      likes: 0,
      status: 'Approved',
      createdAt: new Date().toISOString(),
    };
    local.comments.push(newComment);
    saveLocalDB(local);
    return newComment;
  },

  moderateComment: async (commentId: string, status: CommentStatus, actorId?: string): Promise<Comment> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('comments').update({ status }).eq('id', toUUID(commentId)).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        actor_id: actorId ? toUUID(actorId) : null,
        action: `Comment Moderated to ${status}`,
        details: { commentId }
      });
      const c = mapCommentToCamel(data);
      return {
        ...c,
        id: fromUUID(c.id),
        articleId: fromUUID(c.articleId),
        userId: c.userId ? fromUUID(c.userId) : undefined,
        parentId: c.parentId ? fromUUID(c.parentId) : undefined
      };
    }

    // Fallback
    const local = getLocalDB();
    const comment = local.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');
    comment.status = status;
    local.auditLogs.push({
      id: `audit-${idGenerator()}`,
      actorId,
      action: `Comment Moderated to ${status}`,
      details: { commentId },
      createdAt: new Date().toISOString()
    });
    saveLocalDB(local);
    return comment;
  },

  incrementCommentLikes: async (commentId: string): Promise<number> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: current } = await supabase.from('comments').select('likes').eq('id', toUUID(commentId)).single();
      if (current) {
        const nextLikes = (current.likes || 0) + 1;
        await supabase.from('comments').update({ likes: nextLikes }).eq('id', toUUID(commentId));
        return nextLikes;
      }
      return 0;
    }

    // Fallback
    const local = getLocalDB();
    const comment = local.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.likes += 1;
      saveLocalDB(local);
      return comment.likes;
    }
    return 0;
  },

  // --- PROFILES & FELLOWSHIP ---
  getProfiles: async (): Promise<UserProfile[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapProfileToCamel(row)).map((p: any) => ({
        ...p,
        id: fromUUID(p.id),
        followedAuthors: (p.followedAuthors || []).map((id: any) => fromUUID(id)),
        savedArticles: (p.savedArticles || []).map((id: any) => fromUUID(id))
      }));
    }

    // Fallback
    return getLocalDB().profiles;
  },

  getProfile: async (id: string): Promise<UserProfile | undefined> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', toUUID(id)).single();
      if (error || !data) return undefined;
      const p = mapProfileToCamel(data);
      return {
        ...p,
        id: fromUUID(p.id),
        followedAuthors: (p.followedAuthors || []).map((fid: any) => fromUUID(fid)),
        savedArticles: (p.savedArticles || []).map((sid: any) => fromUUID(sid))
      };
    }

    // Fallback
    return getLocalDB().profiles.find((p) => p.id === id);
  },

  updateProfile: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const supabase = getSupabase();
    if (supabase) {
      const snakeUpdates: any = {};
      if (updates.fullName !== undefined) snakeUpdates.full_name = updates.fullName;
      if (updates.email !== undefined) snakeUpdates.email = updates.email;
      if (updates.role !== undefined) snakeUpdates.role = updates.role;
      if (updates.bio !== undefined) snakeUpdates.bio = updates.bio;
      if (updates.avatarUrl !== undefined) snakeUpdates.avatar_url = updates.avatarUrl;
      if (updates.followedAuthors !== undefined) snakeUpdates.followed_authors = (updates.followedAuthors || []).map((f: any) => toUUID(f));
      if (updates.followedTopics !== undefined) snakeUpdates.followed_topics = updates.followedTopics;
      if (updates.savedArticles !== undefined) snakeUpdates.saved_articles = (updates.savedArticles || []).map((sa: any) => toUUID(sa));
      if (updates.readingHistory !== undefined) snakeUpdates.reading_history = updates.readingHistory;

      const { data, error } = await supabase.from('profiles').update(snakeUpdates).eq('id', toUUID(id)).select().single();
      if (error) throw error;
      const p = mapProfileToCamel(data);
      return {
        ...p,
        id: fromUUID(p.id),
        followedAuthors: (p.followedAuthors || []).map((uid: any) => fromUUID(uid)),
        savedArticles: (p.savedArticles || []).map((uid: any) => fromUUID(uid))
      };
    }

    // Fallback
    const local = getLocalDB();
    const index = local.profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');

    const updatedProfile = {
      ...local.profiles[index],
      ...updates
    };
    local.profiles[index] = updatedProfile;
    saveLocalDB(local);
    return updatedProfile;
  },

  saveArticleToProfile: async (userId: string, articleId: string): Promise<boolean> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: pData } = await supabase.from('profiles').select('saved_articles').eq('id', toUUID(userId)).single();
      if (pData) {
        const savedList = (pData.saved_articles || []) as string[];
        const artUUID = toUUID(articleId);
        let nextList: string[] = [];
        let saved = false;
        if (savedList.includes(artUUID)) {
          nextList = savedList.filter(rid => rid !== artUUID);
          saved = false;
        } else {
          nextList = [...savedList, artUUID];
          saved = true;
        }
        await supabase.from('profiles').update({ saved_articles: nextList }).eq('id', toUUID(userId));
        return saved;
      }
      return false;
    }

    // Fallback
    const local = getLocalDB();
    const profile = local.profiles.find((p) => p.id === userId);
    if (profile) {
      if (!profile.savedArticles.includes(articleId)) {
        profile.savedArticles.push(articleId);
        saveLocalDB(local);
        return true;
      } else {
        profile.savedArticles = profile.savedArticles.filter((rid) => rid !== articleId);
        saveLocalDB(local);
        return false;
      }
    }
    return false;
  },

  followAuthor: async (userId: string, targetAuthorId: string): Promise<boolean> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: pData } = await supabase.from('profiles').select('followed_authors').eq('id', toUUID(userId)).single();
      if (pData) {
        const followedList = (pData.followed_authors || []) as string[];
        const authUUID = toUUID(targetAuthorId);
        let nextList: string[] = [];
        let followed = false;
        if (followedList.includes(authUUID)) {
          nextList = followedList.filter(rid => rid !== authUUID);
          followed = false;
        } else {
          nextList = [...followedList, authUUID];
          followed = true;
        }
        await supabase.from('profiles').update({ followed_authors: nextList }).eq('id', toUUID(userId));
        return followed;
      }
      return false;
    }

    // Fallback
    const local = getLocalDB();
    const profile = local.profiles.find((p) => p.id === userId);
    if (profile) {
      if (!profile.followedAuthors.includes(targetAuthorId)) {
        profile.followedAuthors.push(targetAuthorId);
        saveLocalDB(local);
        return true;
      } else {
        profile.followedAuthors = profile.followedAuthors.filter((rid) => rid !== targetAuthorId);
        saveLocalDB(local);
        return false;
      }
    }
    return false;
  },

  // --- NEWSLETTERS ---
  subscribeNewsletter: async (email: string, segment: string = 'Standard'): Promise<Newsletter> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: existing } = await supabase.from('newsletters').select('*').eq('email', email).maybeSingle();
      if (existing) {
        return mapNewsletterToCamel(existing);
      }
      const nlId = `nl-${idGenerator()}`;
      const { data, error } = await supabase.from('newsletters').insert({
        id: toUUID(nlId),
        email,
        segment,
        verified: true
      }).select().single();
      if (error) throw error;
      return mapNewsletterToCamel(data);
    }

    // Fallback
    const local = getLocalDB();
    const existing = local.newsletters.find((n) => n.email === email);
    if (existing) return existing;

    const newSub: Newsletter = {
      id: `nl-${idGenerator()}`,
      email,
      segment,
      verified: true,
      createdAt: new Date().toISOString(),
    };
    local.newsletters.push(newSub);
    saveLocalDB(local);
    return newSub;
  },

  getNewsletterSubscribers: async (): Promise<Newsletter[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('newsletters').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapNewsletterToCamel(row));
    }

    // Fallback
    return getLocalDB().newsletters;
  },

  // --- AUDIT & REVISIONS ---
  getRevisions: async (articleId: string): Promise<Revision[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('revision_history').select('*').eq('article_id', toUUID(articleId));
      if (error) return [];
      return (data || []).map((row: any) => mapRevisionToCamel(row)).map((r: any) => ({
        ...r,
        id: fromUUID(r.id),
        articleId: fromUUID(r.articleId),
        editorId: fromUUID(r.editorId)
      }));
    }

    // Fallback
    return getLocalDB().revisions.filter((r) => r.articleId === articleId);
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map((row: any) => mapAuditLogToCamel(row)).map((l: any) => ({
        ...l,
        id: fromUUID(l.id),
        actorId: l.actorId ? fromUUID(l.actorId) : undefined
      }));
    }

    // Fallback
    return getLocalDB().auditLogs;
  },

  // --- ADS SYSTEM ---
  getAds: async (): Promise<Advertisement[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('advertisements').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapAdvertisementToCamel(row)).map((ad: any) => ({
        ...ad,
        id: fromUUID(ad.id)
      }));
    }

    // Fallback
    return getLocalDB().advertisements;
  },

  recordAdImpression: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: current } = await supabase.from('advertisements').select('views').eq('id', toUUID(id)).single();
      if (current) {
        await supabase.from('advertisements').update({ views: (current.views || 0) + 1 }).eq('id', toUUID(id));
      }
      return;
    }

    // Fallback
    const local = getLocalDB();
    const ad = local.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.views += 1;
      saveLocalDB(local);
    }
  },

  recordAdClick: async (id: string): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: current } = await supabase.from('advertisements').select('clicks').eq('id', toUUID(id)).single();
      if (current) {
        await supabase.from('advertisements').update({ clicks: (current.clicks || 0) + 1 }).eq('id', toUUID(id));
      }
      return;
    }

    // Fallback
    const local = getLocalDB();
    const ad = local.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.clicks += 1;
      saveLocalDB(local);
    }
  },

  // --- MEDIA LIBRARY ---
  getMediaLibrary: async (): Promise<MediaAsset[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('media_library').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapMediaToCamel(row)).map((m: any) => ({
        ...m,
        id: fromUUID(m.id),
        authorId: fromUUID(m.authorId)
      }));
    }

    // Fallback
    return getLocalDB().mediaLibrary;
  },

  addMedia: async (filename: string, folder: string, size: number, mimeType: string, url: string, authorId: string): Promise<MediaAsset> => {
    const supabase = getSupabase();
    if (supabase) {
      const mediaId = `media-${idGenerator()}`;
      const { data, error } = await supabase.from('media_library').insert({
        id: toUUID(mediaId),
        filename,
        folder,
        size,
        mime_type: mimeType,
        url,
        author_id: toUUID(authorId)
      }).select().single();
      if (error) throw error;
      const m = mapMediaToCamel(data);
      return {
        ...m,
        id: fromUUID(m.id),
        authorId: fromUUID(m.authorId)
      };
    }

    // Fallback
    const local = getLocalDB();
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
    local.mediaLibrary.push(newMedia);
    saveLocalDB(local);
    return newMedia;
  },

  // --- ANALYTICS ---
  getAnalytics: async (): Promise<AnalyticsMetrics[]> => {
    const supabase = getSupabase();
    if (supabase) {
      await ensureSeeded(supabase);
      const { data, error } = await supabase.from('analytics_metrics').select('*');
      if (error) return [];
      return (data || []).map((row: any) => mapAnalyticsToCamel(row)).map((an: any) => ({
        ...an,
        topArticles: (an.topArticles || []).map((ta: any) => ({ ...ta, articleId: fromUUID(ta.articleId) })),
        topAuthors: (an.topAuthors || []).map((tau: any) => ({ ...tau, authorId: fromUUID(tau.authorId) }))
      }));
    }

    // Fallback
    return getLocalDB().analytics;
  }
};

// SYNTHETIC ID GENERATOR HELPER
function idGenerator(): string {
  return Math.random().toString(36).substring(2, 9);
}

function arrayLength<T>(arr: T[] | any): number {
  if (Array.isArray(arr)) return arr.length;
  return 0;
}
