import { getAuthUser, unauthorized } from '@/lib/middleware';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  return Response.json({ user });
}
