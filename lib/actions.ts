'use server';

import { cookies } from 'next/headers';
import { db, Article, PostStatus, Comment, CommentStatus, UserProfile, Category, Newsletter, Advertisement, MediaAsset } from './db';

// Multi-role session simulator using cookies for instant newsroom sandbox switches
const SESSION_COOKIE_KEY = 'ofofo_session_user_id';

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const rawId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
  return rawId || 'user-chioma'; // Default to Chioma (Editor-in-Chief) so they have robust privileges on cold load
}

export async function setCurrentUser(userId: string): Promise<UserProfile> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_KEY, userId, { maxAge: 60 * 60 * 24 * 7 });
  const profile = await db.getProfile(userId);
  if (!profile) throw new Error('User profile not found');
  return profile;
}

// --- ARTICLES ---

export async function getArticlesAction(status?: PostStatus): Promise<Article[]> {
  return await db.getArticles(status);
}

export async function getArticleBySlugAction(slug: string): Promise<Article | undefined> {
  const article = await db.getArticleBySlug(slug);
  if (article) {
    await db.incrementViewCount(article.id);
  }
  return article;
}

export async function createArticleAction(data: Omit<Article, 'id' | 'viewCount' | 'likeCount' | 'wordCount' | 'readingTime' | 'createdAt'>): Promise<Article> {
  return await db.createArticle(data);
}

export async function updateArticleAction(id: string, updates: Partial<Article>, changeSummary?: string): Promise<Article> {
  const userId = await getCurrentUserId();
  return await db.updateArticle(id, updates, userId, changeSummary);
}

export async function deleteArticleAction(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  await db.deleteArticle(id, userId);
}

export async function incrementLikeAction(id: string): Promise<number> {
  return await db.incrementLikeCount(id);
}

// --- COMMENTS ---

export async function getCommentsAction(articleId: string, clientView: boolean = true): Promise<Comment[]> {
  return await db.getComments(articleId, clientView);
}

export async function getAllCommentsAction(): Promise<Comment[]> {
  return await db.getAllCommentsForModeration();
}

export async function addCommentAction(data: { articleId: string; content: string; parentId?: string }): Promise<Comment> {
  const userId = await getCurrentUserId();
  const profile = await db.getProfile(userId);
  
  if (!profile) {
    // Subscriber fallback for raw comments
    return await db.addComment({
      articleId: data.articleId,
      userName: 'Anonymous Subscriber',
      userAvatar: 'https://picsum.photos/seed/guest/300/300',
      content: data.content,
      parentId: data.parentId
    });
  }

  return await db.addComment({
    articleId: data.articleId,
    userId: profile.id,
    userName: profile.fullName,
    userAvatar: profile.avatarUrl,
    content: data.content,
    parentId: data.parentId
  });
}

export async function moderateCommentAction(commentId: string, status: CommentStatus): Promise<Comment> {
  const userId = await getCurrentUserId();
  return await db.moderateComment(commentId, status, userId);
}

export async function likeCommentAction(commentId: string): Promise<number> {
  return await db.incrementCommentLikes(commentId);
}

// --- PROFILES & FELLOWSHIP ---

export async function saveArticleAction(articleId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  return await db.saveArticleToProfile(userId, articleId);
}

export async function followAuthorAction(targetAuthorId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  return await db.followAuthor(userId, targetAuthorId);
}

export async function updateProfileAction(updates: Partial<UserProfile>): Promise<UserProfile> {
  const userId = await getCurrentUserId();
  return await db.updateProfile(userId, updates);
}

// --- NEWSLETTERS ---

export async function subscribeNewsletterAction(email: string, segment: string = 'Standard'): Promise<Newsletter> {
  return await db.subscribeNewsletter(email, segment);
}

export async function getNewsletterSubscribersAction(): Promise<Newsletter[]> {
  return await db.getNewsletterSubscribers();
}

// --- ADVERTISEMENTS ---

export async function getAdsAction(): Promise<Advertisement[]> {
  return await db.getAds();
}

export async function recordAdViewAction(id: string): Promise<void> {
  await db.recordAdImpression(id);
}

export async function recordAdClickAction(id: string): Promise<void> {
  await db.recordAdClick(id);
}

// --- AUDIT LOGS & ANALYTICS ---

export async function getAuditLogsAction() {
  return await db.getAuditLogs();
}

export async function getAnalyticsAction() {
  return await db.getAnalytics();
}

export async function getCategoriesAction(): Promise<Category[]> {
  return await db.getCategories();
}

export async function createCategoryAction(name: string, description: string, icon: string): Promise<Category> {
  return await db.createCategory(name, description, icon);
}

// --- MEDIA LIBRARY ---

export async function getMediaLibraryAction(): Promise<MediaAsset[]> {
  return await db.getMediaLibrary();
}

export async function uploadMediaAction(filename: string, folder: string, size: number, mimeType: string, url: string): Promise<MediaAsset> {
  const userId = await getCurrentUserId();
  return await db.addMedia(filename, folder, size, mimeType, url, userId);
}
