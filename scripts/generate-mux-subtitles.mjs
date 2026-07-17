// Requests Croatian auto-generated captions for every chapter video on Mux.
// Idempotent: skips assets that already have a Croatian text track.
// Usage: node scripts/generate-mux-subtitles.mjs
import { readFileSync } from "fs";

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

async function supabaseChapters() {
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/chapters?select=id,title,video_url&video_url=not.is.null&order=chapter_number`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  return response.json();
}

const chapters = await supabaseChapters();
console.log(`Found ${chapters.length} chapters with videos\n`);

const submitted = [];

for (const chapter of chapters) {
  const label = `"${chapter.title}" (${chapter.video_url.slice(0, 12)}…)`;
  try {
    if (chapter.video_url.startsWith("http")) {
      console.log(`SKIP  ${label} — external URL, not a Mux playback ID`);
      continue;
    }

    // Resolve playback ID → asset
    const playback = await mux(`/video/v1/playback-ids/${chapter.video_url}`);
    if (playback.object?.type !== "asset") {
      console.log(`SKIP  ${label} — playback ID does not belong to an asset`);
      continue;
    }
    const assetId = playback.object.id;
    const asset = await mux(`/video/v1/assets/${assetId}`);

    const existingCroatian = (asset.tracks || []).find(
      (track) =>
        track.type === "text" &&
        track.text_type === "subtitles" &&
        (track.language_code || "").startsWith("hr")
    );
    if (existingCroatian) {
      console.log(
        `SKIP  ${label} — already has Croatian subtitles (${existingCroatian.status})`
      );
      continue;
    }

    const audioTrack = (asset.tracks || []).find(
      (track) => track.type === "audio"
    );
    if (!audioTrack) {
      console.log(`FAIL  ${label} — no audio track found`);
      continue;
    }

    await mux(
      `/video/v1/assets/${assetId}/tracks/${audioTrack.id}/generate-subtitles`,
      {
        method: "POST",
        body: JSON.stringify({
          generated_subtitles: [
            { language_code: "hr", name: "Hrvatski" },
          ],
        }),
      }
    );
    console.log(`OK    ${label} — Croatian captions requested`);
    submitted.push({ chapter: chapter.title, assetId });
  } catch (error) {
    console.log(`FAIL  ${label} — ${error.message}`);
  }
}

console.log(`\nSubmitted: ${submitted.length}. Generation runs asynchronously on Mux.`);

if (submitted.length > 0) {
  console.log("Polling for track readiness (up to ~4 min)…\n");
  const pending = new Map(submitted.map((s) => [s.assetId, s.chapter]));

  for (let attempt = 0; attempt < 8 && pending.size > 0; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    for (const [assetId, title] of [...pending]) {
      try {
        const asset = await mux(`/video/v1/assets/${assetId}`);
        const track = (asset.tracks || []).find(
          (t) =>
            t.type === "text" && (t.language_code || "").startsWith("hr")
        );
        if (track?.status === "ready") {
          console.log(`READY "${title}"`);
          pending.delete(assetId);
        } else if (track?.status === "errored") {
          console.log(`ERROR "${title}" — track errored`);
          pending.delete(assetId);
        }
      } catch {
        // transient; retry next round
      }
    }
  }

  if (pending.size > 0) {
    console.log(
      `\nStill generating (${pending.size}): ${[...pending.values()].join(", ")}`
    );
    console.log("They will appear automatically once Mux finishes — no action needed.");
  } else {
    console.log("\nAll requested captions are ready.");
  }
}
