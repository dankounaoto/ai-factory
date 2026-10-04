import html from "./sticker-factory/index.html";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

function promptFor(style, genre = "ゴルフ", series = "") {
  const styles = {
    A: "simple cute chibi, rounded friendly face, clean thick outlines, flat soft colors",
    B: "soft semi-realistic Japanese character illustration, warm approachable adult golfer, gently realistic proportions, expressive face, clean commercial sticker art",
    C: "quirky distinctive original cartoon, exaggerated expressive pose, memorable silhouette, playful personality"
  };
  return `Create ONE original character design for a LINE sticker series about "${genre}". Series concept: "${series}". ${styles[style] || styles.B}. The subject MUST clearly be about ${genre}. Make clothing, props, environment cues and body language authentically recognizable to enthusiasts of ${genre}, while avoiding brands. If ${genre} is not golf, absolutely no golf club, golf cap, golf course, putting pose, golf ball, or other golf-specific element. Centered single character, plain light neutral background, no text, no letters, no logo, no brand, no border, no frame, no copyrighted character, no resemblance to a real person. Consistent reusable character design, clear face and outfit, suitable as a reference for 40 chat stickers.`;
}

async function generate(env, style, referenceImage, phrase, genre = "ゴルフ", series = "") {
  const form = new FormData();
  const base = promptFor(style, genre, series);
  const action = phrase ? ` Keep the SAME character identity, face, cap, green polo and illustration style. Create one sticker pose that naturally communicates this Japanese chat meaning: "${phrase}". Do NOT draw any text; text will be added later programmatically. Single character, expressive gesture, no logo, no border, no frame.` : "";
  form.append("prompt", base + action);
  if (referenceImage) {
    const raw = referenceImage.includes(",") ? referenceImage.split(",")[1] : referenceImage;
    const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
    form.append("image", new Blob([bytes], {type:"image/png"}), "reference.png");
  }
  form.append("width", "512");
  form.append("height", "512");
  const encoded = new Response(form);
  const result = await env.AI.run(MODEL, { multipart: { body: encoded.body, contentType: encoded.headers.get("content-type") }});
  if (result?.image) return result.image;
  throw new Error("Image model returned no image");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(html, { headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-cache" } });
    }
    if (request.method === "POST" && url.pathname === "/api/design-fix") {
      try {
        const { style, genre, series, referenceImage, instruction } = await request.json();
        if (!referenceImage || !instruction) return Response.json({error:"referenceImage and instruction required"},{status:400});
        const form = new FormData();
        form.append("prompt", `Edit the supplied character image. Preserve the same character identity and overall style. Fix ONLY what the user requests: "${instruction}". Important: no text, no letters, no logos, anatomically correct body and hands unless the instruction says otherwise.`);
        const raw = referenceImage.includes(",") ? referenceImage.split(",")[1] : referenceImage;
        const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
        form.append("image", new Blob([bytes], {type:"image/png"}), "reference.png");
        form.append("width","512"); form.append("height","512");
        const encoded = new Response(form);
        const result = await env.AI.run(MODEL,{multipart:{body:encoded.body,contentType:encoded.headers.get("content-type")}});
        if(!result?.image) throw new Error("Image model returned no image");
        return Response.json({image:`data:image/png;base64,${result.image}`});
      } catch(e){ return Response.json({error:String(e?.message||e)},{status:500}); }
    }
    if (request.method === "POST" && url.pathname === "/api/sheet") {
      try {
        const { style, genre, series, referenceImage, phrases } = await request.json();
        const short = (phrases||[]).slice(0,40).join(" / ");
        const form = new FormData();
        form.append("prompt", `Create ONE 8-column by 5-row character pose contact sheet containing exactly 40 small panels for a LINE sticker series about "${genre}". Use the supplied reference as the SAME character in every panel: same face, hair, clothing, proportions and illustration style. Show 40 varied poses/reactions inspired by these meanings: ${short}. ABSOLUTELY NO TEXT, letters, numbers, captions, logos or brands anywhere. This is a visual consistency storyboard only. Clear separation between panels, plain light background, anatomically correct hands and limbs.`);
        const raw = referenceImage.includes(",") ? referenceImage.split(",")[1] : referenceImage;
        const bytes = Uint8Array.from(atob(raw), c=>c.charCodeAt(0));
        form.append("image",new Blob([bytes],{type:"image/png"}),"reference.png");
        form.append("width","1024"); form.append("height","768");
        const encoded=new Response(form);
        const result=await env.AI.run(MODEL,{multipart:{body:encoded.body,contentType:encoded.headers.get("content-type")}});
        if(!result?.image) throw new Error("Image model returned no image");
        return Response.json({image:`data:image/png;base64,${result.image}`});
      } catch(e){ return Response.json({error:String(e?.message||e)},{status:500}); }
    }
    if (request.method === "POST" && url.pathname === "/api/phrases") {
      try {
        const { genre, series } = await request.json();
        const prompt = `Create exactly 40 short Japanese LINE sticker phrases for the niche "${genre}". Series: "${series}". The key product advantage is insider authenticity: people deeply into this hobby should think "わかってるわあ". Mix roughly 20 useful everyday chat phrases adapted to the niche and 20 insider-specific reactions, jargon, situations, or relatable moments. Keep each phrase short enough for a sticker, natural Japanese, varied, non-offensive, no brands, no copyrighted character references. Requirements: exactly 40 final phrases, not labels or placeholders. Never output strings like "あるある1", "文言1", "スタンプ1". Include a practical basic set such as greetings, thanks, OK, apology, waiting, going, tired, good night, then rewrite/adapt part of them naturally for the niche. The remaining phrases must be actual insider situations/jargon/reactions people in the niche really say; do NOT use the word "あるある" as a substitute for the situation. Every item must itself be usable as sticker text. Return ONLY a JSON array of 40 strings.`;
        const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {prompt, max_tokens: 1800});
        const text = typeof out === "string" ? out : (out.response || out.result?.response || "");
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error("phrase model returned invalid JSON");
        const phrases = JSON.parse(match[0]);
        if (!Array.isArray(phrases) || phrases.length !== 40) throw new Error("phrase count was not 40");
        return Response.json({phrases});
      } catch (e) { return Response.json({error:String(e?.message || e)},{status:500}); }
    }
    if (request.method === "POST" && url.pathname === "/api/design") {
      try {
        const { style, genre, series } = await request.json();
        if (!["A","B","C"].includes(style)) return Response.json({error:"invalid style"},{status:400});
        const image = await generate(env, style, null, null, genre, series);
        return Response.json({style,image:`data:image/png;base64,${image}`});
      } catch (e) {
        return Response.json({error:String(e?.message || e)},{status:500});
      }
    }
    if (request.method === "POST" && url.pathname === "/api/sticker") {
      try {
        const { style, referenceImage, phrase, index, genre, series } = await request.json();
        if (!referenceImage || !phrase) return Response.json({error:"referenceImage and phrase required"},{status:400});
        const image = await generate(env, style || "B", referenceImage, phrase, genre, series);
        return Response.json({index,phrase,image:`data:image/png;base64,${image}`});
      } catch (e) { return Response.json({error:String(e?.message || e)},{status:500}); }
    }
    return new Response("Not Found", { status: 404 });
  }
};