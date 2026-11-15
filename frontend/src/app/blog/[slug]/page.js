import PublicPostDetail from "@/modules/blog/PublicPostDetail";

export async function generateMetadata({ params }) {
  const resolved = await params;
  const slug = resolved?.slug || "";
  return {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | MCPA Updates`,
  };
}

export default async function BlogPostDetailPage({ params }) {
  const resolved = await params;
  return <PublicPostDetail slug={resolved?.slug} />;
}
