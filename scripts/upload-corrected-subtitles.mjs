// Uploads corrected Croatian + English VTT files to Mux as subtitle tracks,
// then removes the old auto-generated Croatian track.
// Expects files produced in the scratchpad subs dir (see SUBS_DIR).
// Usage: node scripts/upload-corrected-subtitles.mjs <subs-dir>
import { readFileSync, existsSync } from "fs";

const SUBS_DIR = process.argv[2];
if (!SUBS_DIR) {
  console.error("Usage: node scripts/upload-corrected-subtitles.mjs <subs-dir>");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [
      line.slice(0, line.indexOf("=")).trim(),
      line.slice(line.indexOf("=") + 1).trim(),
    ])
);

const MUX_AUTH =
  "Basic " +
  Buffer.from(`${env.MUX_TOKEN_ID}:${env.MUX_TOKEN_SECRET}`).toString("base64");
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_HEADERS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
};

async function mux(path, options = {}) {
  const response = await fetch(`https://api.mux.com${path}`, {
    ...options,
    headers: {
      Authorization: MUX_AUTH,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} → ${response.status}: ${JSON.stringify(body.error || body)}`
    );
  }
  return body.data;
}

function validateVtt(path) {
  const content = readFileSync(path, "utf8");
  if (!content.trimStart().startsWith("WEBVTT")) {
    throw new Error(`${path}: missing WEBVTT header`);
  }
  const cueCount = (content.match(/-->/g) || []).length;
  if (cueCount < 3) {
    throw new Error(`${path}: only ${cueCount} cues — looks broken`);
  }
  return { content, cueCount };
}

async function ensureBucket() {
  const response = await fetch(`${SB}/storage/v1/bucket/subtitles`, {
    headers: SB_HEADERS,
  });
  if (response.ok) return;
  const create = await fetch(`${SB}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...SB_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "subtitles", id: "subtitles", public: false }),
  });
  if (!create.ok) {
    throw new Error(`Failed to create subtitles bucket: ${await create.text()}`);
  }
}

async function uploadAndSign(name, content) {
  const upload = await fetch(`${SB}/storage/v1/object/subtitles/${name}`, {
    method: "POST",
    headers: {
      ...SB_HEADERS,
      "Content-Type": "text/vtt",
      "x-upsert": "true",
    },
    body: content,
  });
  if (!upload.ok) {
    throw new Error(`Upload ${name} failed: ${await upload.text()}`);
  }
  const sign = await fetch(`${SB}/storage/v1/object/sign/subtitles/${name}`, {
    method: "POST",
    headers: { ...SB_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  const { signedURL } = await sign.json();
  return `${SB}/storage/v1${signedURL}`;
}

const manifest = JSON.parse(readFileSync(`${SUBS_DIR}/manifest.json`, "utf8"));
await ensureBucket();

const results = [];

for (const entry of manifest) {
  const { slug, chapterTitle, assetId, generatedTrackId } = entry;
  try {
    const hrPath = `${SUBS_DIR}/${slug}.hr.vtt`;
    const enPath = `${SUBS_DIR}/${slug}.en.vtt`;
    if (!existsSync(hrPath) || !existsSync(enPath)) {
      console.log(`SKIP  ${chapterTitle} — corrected files missing`);
      continue;
    }
    const hr = validateVtt(hrPath);
    const en = validateVtt(enPath);

    const hrUrl = await uploadAndSign(`${slug}.hr.vtt`, hr.content);
    const enUrl = await uploadAndSign(`${slug}.en.vtt`, en.content);

    // Remove ALL existing text tracks first (generated + previous custom) —
    // Mux requires unique track names, and "Hrvatski" replaces "Hrvatski"
    const asset = await mux(`/video/v1/assets/${assetId}`);
    const existingText = (asset.tracks || []).filter((t) => t.type === "text");
    for (const track of existingText) {
      await mux(`/video/v1/assets/${assetId}/tracks/${track.id}`, {
        method: "DELETE",
      });
    }

    const hrTrack = await mux(`/video/v1/assets/${assetId}/tracks`, {
      method: "POST",
      body: JSON.stringify({
        url: hrUrl,
        type: "text",
        text_type: "subtitles",
        language_code: "hr",
        name: "Hrvatski",
      }),
    });
    const enTrack = await mux(`/video/v1/assets/${assetId}/tracks`, {
      method: "POST",
      body: JSON.stringify({
        url: enUrl,
        type: "text",
        text_type: "subtitles",
        language_code: "en",
        name: "English",
      }),
    });

    console.log(
      `OK    ${chapterTitle} — hr(${hr.cueCount} cues) + en(${en.cueCount} cues) submitted`
    );
    results.push({ chapterTitle, assetId, generatedTrackId, hrTrackId: hrTrack.id, enTrackId: enTrack.id });
  } catch (error) {
    console.log(`FAIL  ${chapterTitle} — ${error.message}`);
  }
}

// Wait for new tracks to be ready, then delete the old generated track
console.log("\nWaiting for tracks to become ready…");
for (let attempt = 0; attempt < 12 && results.some((r) => !r.done); attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  for (const result of results.filter((r) => !r.done)) {
    const asset = await mux(`/video/v1/assets/${result.assetId}`);
    const hrTrack = asset.tracks.find((t) => t.id === result.hrTrackId);
    const enTrack = asset.tracks.find((t) => t.id === result.enTrackId);
    if (hrTrack?.status === "errored" || enTrack?.status === "errored") {
      console.log(`ERROR ${result.chapterTitle} — track errored`);
      result.done = true;
      continue;
    }
    if (hrTrack?.status === "ready" && enTrack?.status === "ready") {
      console.log(`READY ${result.chapterTitle} — hr + en live`);
      result.done = true;
    }
  }
}

const pending = results.filter((r) => !r.done);
if (pending.length) {
  console.log(`\nStill processing: ${pending.map((r) => r.chapterTitle).join(", ")}`);
} else {
  console.log("\nAll done.");
}
