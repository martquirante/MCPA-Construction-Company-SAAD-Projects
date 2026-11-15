import PublicBlogExperience from "@/modules/blog/PublicBlogExperience";

export async function generateMetadata({ params }) {
  const resolved = await params;
  const tag = resolved?.tag || "";
  return {
    title: `#${tag} Updates | MCPA Construction and Supply`,
  };
}

export default async function HashtagFeedPage({ params }) {
  const resolved = await params;
  return <PublicBlogExperience initialHashtag={resolved?.tag || ""} />;
}
