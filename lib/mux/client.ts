import Mux from "@mux/mux-node";
import jwt from "jsonwebtoken";

// Initialize Mux client
export function getMuxClient() {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error("Mux credentials not configured");
  }

  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });
}

// Generate signed playback URL for secure video access
export function generateSignedPlaybackUrl(
  playbackId: string,
  options: {
    type?: "video" | "thumbnail" | "gif" | "storyboard";
    expiresIn?: number; // seconds, default 1 hour
    userId?: string;
  } = {}
): string {
  const { type = "video", expiresIn = 3600, userId } = options;

  const signingKey = process.env.MUX_SIGNING_KEY;
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID;

  if (!signingKey || !signingKeyId) {
    // Fall back to unsigned URL if signing not configured
    // This should only be used in development
    console.warn("Mux signing keys not configured - using unsigned URL");
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;

  // Mux expects single-letter audience codes, not the full type name
  const audiences: Record<string, string> = {
    video: "v",
    thumbnail: "t",
    gif: "g",
    storyboard: "s",
  };

  // Create JWT payload
  const payload: Record<string, unknown> = {
    sub: playbackId,
    aud: audiences[type] || "v",
    exp,
    kid: signingKeyId,
  };

  // Add user ID for watermarking/tracking if provided
  if (userId) {
    payload.viewer_id = userId;
  }

  // Sign the token
  const token = jwt.sign(payload, Buffer.from(signingKey, "base64"), {
    algorithm: "RS256",
    keyid: signingKeyId,
  });

  // Return signed URL
  if (type === "video") {
    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
  } else if (type === "thumbnail") {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`;
  } else if (type === "gif") {
    return `https://image.mux.com/${playbackId}/animated.gif?token=${token}`;
  } else {
    return `https://image.mux.com/${playbackId}/storyboard.vtt?token=${token}`;
  }
}

// Generate thumbnail URL
export function generateThumbnailUrl(
  playbackId: string,
  options: {
    time?: number; // seconds into video
    width?: number;
    height?: number;
    fit_mode?: "preserve" | "stretch" | "crop" | "smartcrop" | "pad";
    signed?: boolean;
  } = {}
): string {
  const {
    time = 0,
    width = 640,
    height = 360,
    fit_mode = "smartcrop",
    signed = true,
  } = options;

  const baseUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  const params = new URLSearchParams({
    time: time.toString(),
    width: width.toString(),
    height: height.toString(),
    fit_mode,
  });

  if (signed && process.env.MUX_SIGNING_KEY) {
    const signedUrl = generateSignedPlaybackUrl(playbackId, {
      type: "thumbnail",
    });
    // Extract token and add our params
    const token = signedUrl.split("token=")[1];
    return `${baseUrl}?${params.toString()}&token=${token}`;
  }

  return `${baseUrl}?${params.toString()}`;
}

// Video metadata helper
export interface VideoMetadata {
  playbackId: string;
  duration: number;
  aspectRatio: string;
  maxWidth: number;
  maxHeight: number;
  maxFrameRate: number;
}

export async function getVideoMetadata(
  assetId: string
): Promise<VideoMetadata | null> {
  try {
    const mux = getMuxClient();
    const asset = await mux.video.assets.retrieve(assetId);

    if (!asset || asset.status !== "ready") {
      return null;
    }

    const playbackId =
      asset.playback_ids?.find((p) => p.policy === "signed")?.id ||
      asset.playback_ids?.[0]?.id;

    if (!playbackId) {
      return null;
    }

    return {
      playbackId,
      duration: asset.duration || 0,
      aspectRatio: asset.aspect_ratio || "16:9",
      maxWidth: asset.max_stored_resolution === "HD" ? 1920 : 3840,
      maxHeight: asset.max_stored_resolution === "HD" ? 1080 : 2160,
      maxFrameRate: asset.max_stored_frame_rate || 30,
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    return null;
  }
}

// Upload a new video
export async function createVideoUpload(options: {
  corsOrigin?: string;
  newAssetSettings?: {
    playback_policy?: Array<"signed" | "public">;
    passthrough?: string;
  };
}): Promise<{ uploadUrl: string; uploadId: string } | null> {
  try {
    const mux = getMuxClient();

    const upload = await mux.video.uploads.create({
      cors_origin: options.corsOrigin || process.env.NEXT_PUBLIC_SITE_URL || "*",
      new_asset_settings: {
        playback_policy: options.newAssetSettings?.playback_policy || ["signed"],
        passthrough: options.newAssetSettings?.passthrough,
      },
    });

    return {
      uploadUrl: upload.url,
      uploadId: upload.id,
    };
  } catch (error) {
    console.error("Error creating video upload:", error);
    return null;
  }
}
