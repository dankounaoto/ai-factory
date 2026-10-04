import html from "./sticker-factory/index.html";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

function promptFor(style) {
  const styles = {
    A: "simple cute chibi, rounded friendly face, clean thick outlines, flat soft colors",
    B: "soft semi-realistic Japanese character illustration, warm approachable adult golfer, gently realistic proportions, expressive face, clean commercial sticker art",
    C: "quirky distinctive original cartoon, exaggerated expressive pose, memorable silhouette, playful personality"
  };
  return `Create ONE original male golf-lover character design for a LINE sticker series. ${styles[style] || styles.B}. Full body, white golf cap, green golf polo, golf club as a prop, centered single character, plain light neutral background, no text, no letters, no logo, no brand, no border, no frame, no copyrighted character, no resemblance to a real person. Consistent reusable character design, clear face and outfit, suitable as a reference for 40 everyday chat stickers.`;
}

async function generate(env, style, referenceImage, phrase) {
  const form = new FormData();
  const base = promptFor(style);\n  const action = phrase ? ` Keep the SAME character identity, face, cap, green polo and illustration style. Create one sticker pose that naturally communicates this Japanese chat meaning: "${phrase}". Do NOT draw any text; text will be added later programmatically. Single character, expressive gesture, no logo, no border, no frame.` : "";\n  form.append("prompt", base + action);\n  if (referenceImage) {\n    const raw = referenceImage.includes(",") ? referenceImage.split(",")[1] : referenceImage;\n    const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));\n    form.append("image", new Blob([bytes], {type:"image/png"}), "reference.png");\n  }
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
    if (request.method === "POST" && url.pathname === "/api/design") {
      try {
        const { style } = await request.json();
        if (!["A","B","C"].includes(style)) return Response.json({error:"invalid style"},{status:400});
        const image = await generate(env, style);
        return Response.json({style,image:`data:image/png;base64,${image}`});
      } catch (e) {
        return Response.json({error:String(e?.message || e)},{status:500});
      }
    }
    if (request.method === "POST" && url.pathname === "/api/sticker") {\n      try {\n        const { style, referenceImage, phrase, index } = await request.json();\n        if (!referenceImage || !phrase) return Response.json({error:"referenceImage and phrase required"},{status:400});\n        const image = await generate(env, style || "B", referenceImage, phrase);\n        return Response.json({index,phrase,image:`data:image/png;base64,${image}`});\n      } catch (e) { return Response.json({error:String(e?.message || e)},{status:500}); }\n    }\n    return new Response("Not Found", { status: 404 });
  }
};