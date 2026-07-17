import { createAdminClient } from "@/lib/supabase/server";

export type NotificationType =
  | "photo_review"
  | "certification"
  | "order"
  | "message"
  | "system";

/**
 * Create an in-app notification (shown behind the dashboard bell).
 * Best effort — callers should not fail their main flow over this.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
    } as never);

    if (error) {
      console.error("Failed to create notification:", error);
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
