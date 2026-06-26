import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/actions';
import HomeClient from '@/components/HomeClient';

export default async function IndexPage() {
  // Read initial states server-side in parallel to prevent sequential database waterfall blocks
  const currentUserId = await getCurrentUserId();
  const [articlesList, profilesList, categoriesList, adsList] = await Promise.all([
    db.getArticles(),
    db.getProfiles(),
    db.getCategories(),
    db.getAds(),
  ]);

  return (
    <HomeClient
      initialArticles={articlesList}
      profiles={profilesList}
      categories={categoriesList}
      ads={adsList}
      currentUserId={currentUserId}
    />
  );
}
