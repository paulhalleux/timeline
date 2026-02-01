import { serve } from "bun";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";

const ROOT_DIR = path.resolve("./media");

serve({
  port: 3000,
  async fetch(req) {
    console.log(`Received request: ${req.method} ${req.url}`);
    const url = new URL(req.url);
    const filePath = path.join(ROOT_DIR, decodeURIComponent(url.pathname));

    // Prevent path traversal
    if (!filePath.startsWith(ROOT_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    let fileStat;
    try {
      console.log(filePath);
      fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return new Response("Not Found", { status: 404 });
      }
    } catch {
      return new Response("Not Found", { status: 404 });
    }

    const fileSize = fileStat.size;
    const range = req.headers.get("range");

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": Bun.file(filePath).type || "application/octet-stream",
    });

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d+)?/);
      if (!match) {
        return new Response("Invalid Range", { status: 416 });
      }

      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new Response("Range Not Satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      headers.set("Content-Length", String(end - start + 1));

      const stream = createReadStream(filePath, { start, end });

      return new Response(stream as any, {
        status: 206,
        headers,
      });
    }

    headers.set("Content-Length", String(fileSize));
    return new Response(Bun.file(filePath), { status: 200, headers });
  },
});

console.log("📡 HTTP file server running at http://localhost:3000");
