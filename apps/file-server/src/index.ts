// server.ts
import { serve } from "bun";
import { mkdir, readdir, stat } from "fs/promises";
import { createReadStream, writeFileSync } from "fs";
import path from "path";

const ROOT_DIR = path.resolve("./media");

// Ensure media folder exists
await mkdir(ROOT_DIR, { recursive: true });

// -------------------- Handlers --------------------

export const ListFilesHandler = {
  method: "GET" as const,
  path: "/files",
  handler: async () => {
    const fileNames = await readdir(ROOT_DIR);
    const filesInfo = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(ROOT_DIR, fileName);
        try {
          const fileStat = await stat(filePath);
          if (!fileStat.isFile()) return null; // skip folders

          return {
            name: fileName,
            size: fileStat.size,
            modified: fileStat.mtime.getTime(),
            mimeType: Bun.file(filePath).type || "application/octet-stream",
            path: `/${fileName}`, // relative path for download URLs
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out any nulls (folders or errors)
    const filtered = filesInfo.filter(Boolean);

    return new Response(JSON.stringify(filtered, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

export const GetFileHandler = {
  method: "GET" as const,
  path: "/files/:filename",
  handler: async (_req: Request, params: { filename: string }) => {
    const { filename } = params;
    const filePath = path.join(ROOT_DIR, filename);

    // Prevent path traversal
    if (!filePath.startsWith(ROOT_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
      if (!fileStat.isFile()) return new Response("Not Found", { status: 404 });
    } catch {
      return new Response("Not Found", { status: 404 });
    }

    const fileSize = fileStat.size;
    const range = _req.headers.get("range");

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": Bun.file(filePath).type || "application/octet-stream",
    });

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d+)?/);
      if (!match) return new Response("Invalid Range", { status: 416 });

      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new Response("Range Not Satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        });
      }

      headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      headers.set("Content-Length", String(end - start + 1));

      const stream = createReadStream(filePath, { start, end });
      return new Response(stream as any, { status: 206, headers });
    }

    headers.set("Content-Length", String(fileSize));
    return new Response(Bun.file(filePath), { status: 200, headers });
  },
};

export const UploadFileHandler = {
  method: "POST" as const,
  path: "/files",
  handler: async (req: Request) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return new Response("No file uploaded", { status: 400 });

      const destPath = path.join(ROOT_DIR, file.name);
      const arrayBuffer = await file.arrayBuffer();
      writeFileSync(destPath, new Uint8Array(arrayBuffer));

      return new Response(JSON.stringify({ success: true, file: file.name }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(err);
      return new Response("Upload failed", { status: 500 });
    }
  },
};

// -------------------- Simple Router --------------------

const routes = [ListFilesHandler, GetFileHandler, UploadFileHandler];

function matchRoute(req: Request) {
  const url = new URL(req.url);
  for (const route of routes) {
    if (req.method !== route.method) continue;

    // Handle param routes like /files/:filename
    if (route.path.includes(":")) {
      const regex = new RegExp("^" + route.path.replace(/:[^/]+/g, "([^/]+)") + "$");
      const match = url.pathname.match(regex);
      if (match) {
        const paramNames = [...route.path.matchAll(/:([^/]+)/g)].map(m => m[1]);
        const params: Record<string, string> = {};
        paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { route, params };
      }
    } else if (url.pathname === route.path) {
      return { route, params: {} };
    }
  }
  return null;
}

// -------------------- Start Server --------------------

serve({
  port: 3000,
  async fetch(req) {
    const matched = matchRoute(req);
    if (!matched) return new Response("Not Found", { status: 404 });

    const { route, params } = matched;
    return route.handler(req, params as any);
  },
});

console.log("📡 Bun file server running at http://localhost:3000");
