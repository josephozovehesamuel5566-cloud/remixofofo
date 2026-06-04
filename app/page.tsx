import React from 'react';
import { db } from '@/lib/db';
import { getCurrentUserId } from '@/lib/actions';
import HomeClient from '@/components/HomeClient';

export default async function IndexPage() {
  // Read initial states server-side for clean compilation & no hydration mismatches
  const currentUserId = await getCurrentUserId();
  const articlesList = db.getArticles(); // Fetch all (CMS workspace manages filtering by status checks)
  const profilesList = db.getProfiles();
  const categoriesList = db.getCategories();
  const adsList = db.getAds();

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
