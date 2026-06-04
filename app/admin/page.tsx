import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/actions';
import AdminClient from '@/components/AdminClient';

export default async function AdminPage() {
  // Read initial states server-side for clean compilation & no hydration mismatches
  const currentUserId = await getCurrentUserId();
  const articlesList = await db.getArticles();
  const profilesList = await db.getProfiles();
  const categoriesList = await db.getCategories();
  const adsList = await db.getAds();

  return (
    <AdminClient
      initialArticles={articlesList}
      profiles={profilesList}
      categories={categoriesList}
      ads={adsList}
      currentUserId={currentUserId}
    />
  );
}
