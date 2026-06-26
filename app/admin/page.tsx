import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/actions';
import AdminClient from '@/components/AdminClient';

export default async function AdminPage() {
  // Read initial states server-side in parallel to prevent sequential database waterfall blocks
  const currentUserId = await getCurrentUserId();
  const [articlesList, profilesList, categoriesList, adsList] = await Promise.all([
    db.getArticles(),
    db.getProfiles(),
    db.getCategories(),
    db.getAds(),
  ]);

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
