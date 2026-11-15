import PublicBlogExperience from "@/modules/blog/PublicBlogExperience";

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = resolved?.slug || "";
  return {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | MCPA Updates`,
  };
}

export default async function CategoryFeedPage({ params }) {
  const resolved = await params;
  return <PublicBlogExperience initialCategory={resolved?.slug || "all"} />;
}
