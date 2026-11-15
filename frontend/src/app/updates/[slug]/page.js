import PublicPostDetail from "@/modules/blog/PublicPostDetail";

export default async function UpdateDetailPage({ params }) {
  const resolved = await params;
  return <PublicPostDetail slug={resolved?.slug} />;
}
