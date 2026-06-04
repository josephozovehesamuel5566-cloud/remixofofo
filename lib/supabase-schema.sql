-- Ofofo.ng Production-Ready PostgreSQL DB Schema with Supabase RLS Policies
-- Designed for premium, high-traffic digital publishing.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS & TYPE DEFINITIONS
create type user_role as enum ('Super Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Contributor', 'Moderator', 'Subscriber');
create type post_status as enum ('Draft', 'Review', 'Approved', 'Scheduled', 'Published', 'Archived');
create type comment_status as enum ('Pending', 'Approved', 'Reported', 'Flagged');
create type ad_position as enum ('Header-Banner', 'Sidebar-Widget', 'In-Feed-Banner', 'Footer-Anchor');

-- 3. USERS & PROFILES TABLE
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    full_name text not null,
    role user_role not null default 'Subscriber',
    bio text,
    avatar_url text,
    followed_authors uuid[] default '{}',
    followed_topics text[] default '{}',
    saved_articles uuid[] default '{}',
    reading_history jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for emails and naming searches
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_role on public.profiles(role);

-- 4. CATEGORIES TABLE
create table public.categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    slug text not null unique,
    description text,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_categories_slug on public.categories(slug);

-- 5. ARTICLES TABLE
create table public.articles (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    slug text not null unique,
    content text not null, -- Markdown/Rich Format
    summary text not null,
    word_count integer not null default 0,
    reading_time integer not null default 1,
    featured_image text,
    audio_narration_url text,
    status post_status not null default 'Draft',
    author_id uuid references public.profiles(id) on delete set null,
    category_id uuid references public.categories(id) on delete set null,
    tags text[] default '{}',
    seo_title text,
    seo_description text,
    view_count integer not null default 0,
    like_count integer not null default 0,
    sponsored boolean not null default false,
    premium_only boolean not null default false,
    published_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_articles_slug on public.articles(slug);
create index idx_articles_status on public.articles(status);
create index idx_articles_published_at on public.articles(published_at) where status = 'Published';
create index idx_articles_category_id on public.articles(category_id);
create index idx_articles_author_id on public.articles(author_id);
create index idx_articles_sponsored on public.articles(sponsored);

-- 6. COMMENTS TABLE
create table public.comments (
    id uuid default uuid_generate_v4() primary key,
    article_id uuid references public.articles(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete set null,
    user_name text not null,
    user_avatar text,
    content text not null,
    parent_id uuid references public.comments(id) on delete cascade,
    likes integer not null default 0,
    status comment_status not null default 'Pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_comments_article_id on public.comments(article_id);
create index idx_comments_status on public.comments(status);

-- 7. NEWSLETTERS TABLE
create table public.newsletters (
    id uuid default uuid_generate_v4() primary key,
    email text not null unique,
    segment text not null default 'Standard', -- Standard, Prime, Business
    verified boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_newsletters_email on public.newsletters(email);

-- 8. REVISION LOGS TABLE (For Authors & Editors workflow versioning)
create table public.revision_history (
    id uuid default uuid_generate_v4() primary key,
    article_id uuid references public.articles(id) on delete cascade not null,
    editor_id uuid references public.profiles(id) on delete set null not null,
    title text not null,
    content text not null,
    summary text,
    change_summary text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_revisions_article_id on public.revision_history(article_id);

-- 9. AUDIT LOGS TABLE
create table public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    actor_id uuid references public.profiles(id) on delete set null,
    action text not null, -- Created, Modified Status, Deleted Comments
    details jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ADVERTISEMENTS TABLE
create table public.advertisements (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    image_url text not null,
    link text not null,
    position ad_position not null default 'In-Feed-Banner',
    views integer not null default 0,
    clicks integer not null default 0,
    active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. MEDIA LIBRARY
create table public.media_library (
    id uuid default uuid_generate_v4() primary key,
    filename text not null,
    folder text not null default 'Root',
    url text not null,
    size integer not null, -- in bytes
    mime_type text not null,
    author_id uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_media_folder on public.media_library(folder);

-- 12. ANALYTICS METRICS TABLE
create table public.analytics_metrics (
    id uuid default uuid_generate_v4() primary key,
    day date not null unique,
    page_views integer not null default 0,
    unique_visitors integer not null default 0,
    revenue numeric(12,2) not null default 0.00,
    subscriber_growth integer not null default 0,
    top_articles jsonb default '[]'::jsonb,
    traffic_sources jsonb default '[]'::jsonb,
    top_authors jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.newsletters enable row level security;
alter table public.revision_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.advertisements enable row level security;
alter table public.media_library enable row level security;
alter table public.analytics_metrics enable row level security;

-- 12.1 PROFILES POLICIES
create policy "Public readable profiles" on public.profiles
    for select using (true);

create policy "Users can update their own profiles" on public.profiles
    for update using (auth.uid() = id);

-- 12.2 CATEGORIES POLICIES
create policy "Everyone can read categories" on public.categories
    for select using (true);

create policy "Admins and Editors can update categories" on public.categories
    for all using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
        )
    );

-- 12.3 ARTICLES POLICIES
create policy "Everyone can read published articles" on public.articles
    for select using (status = 'Published');

create policy "Authors and Editors can read unpublished drafts" on public.articles
    for select using (
        status != 'Published' and (
            author_id = auth.uid() or
            exists (
                select 1 from public.profiles
                where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
            )
        )
    );

create policy "Authors can insert posts" on public.articles
    for insert with check (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Contributor')
        )
    );

create policy "Authors can update their own drafts" on public.articles
    for update using (
        (author_id = auth.uid() and status in ('Draft', 'Review')) or
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
        )
    );

-- 12.4 COMMENTS POLICIES
create policy "Anyone can read approved comments" on public.comments
    for select using (status = 'Approved');

create policy "Admins, Moderators, and Comment Owner can read unapproved comments" on public.comments
    for select using (
        user_id = auth.uid() or
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor', 'Moderator')
        )
    );

create policy "Logged-in users can write comments" on public.comments
    for insert with check (true); -- Requires auth check generally handled by gateway

create policy "Comment owner or Moderators can edit/delete comments" on public.comments
    for update using (
        user_id = auth.uid() or
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor', 'Moderator')
        )
    );

-- 12.5 NEWSLETTERS POLICIES
create policy "Admins can view newsletter audience list" on public.newsletters
    for select using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
        )
    );

create policy "Anyone can subscribe to newsletter" on public.newsletters
    for insert with check (true);

-- 12.6 ANALYTICS & AUDIT POLICIES (Admin ONLY)
create policy "Admin-only metrics read" on public.analytics_metrics
    for select using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
        )
    );

create policy "Admin-only audit views" on public.audit_logs
    for select using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('Super Admin', 'Editor-in-Chief', 'Editor')
        )
    );

-- =========================================================================
-- SYSTEM TRIGGERS & UTILS
-- =========================================================================

-- Trigger function for Article Auto Word Count & Reading Time Calculations
create or replace function public.calculate_article_stats()
returns trigger as $$
declare
    words integer;
begin
    -- Simple word count by splitting whitespace
    words := array_length(regexp_split_to_array(new.content, '\s+'), 1);
    if words is null then
        words := 0;
    end if;
    new.word_count := words;
    new.reading_time := greatest(1, ceil(words / 220.0)); -- Avg reading speed of 220 words per minute
    return new;
end;
$$ language plpgsql;

create trigger tr_article_stats_calc
before insert or update of content on public.articles
for each row execute function public.calculate_article_stats();

-- Trigger for Auto Audit Logging of article status changes
create or replace function public.audit_article_status_change()
returns trigger as $$
begin
    if (old.status != new.status) then
        insert into public.audit_logs(actor_id, action, details)
        values (
            coalesce(auth.uid(), new.author_id),
            'Article Status Updated',
            jsonb_build_object(
                'article_id', new.id,
                'title', new.title,
                'old_status', old.status,
                'new_status', new.status
            )
        );
    end if;
    return new;
end;
$$ language plpgsql;

create trigger tr_article_audit_status
after update on public.articles
for each row execute function public.audit_article_status_change();
