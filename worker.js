export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = await import("./sticker-factory/index.html");
      return new Response(html.default, { headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "no-cache" } });
    }
    return new Response("Not Found", { status: 404 });
  }
};