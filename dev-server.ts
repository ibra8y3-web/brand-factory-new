import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import brandRoutes from "./server/routes/brandRoutes";
import aiRoutes from "./server/routes/aiRoutes";

const PORT = 3000;

async function startDevServer() {
  const app = express();
  app.use(express.json({ limit: 'Infinity' }));
  app.use(express.urlencoded({ extended: true, limit: 'Infinity' }));

  // --- Modular Routes ---
  app.use("/api", brandRoutes);
  app.use("/api", aiRoutes);

  console.log("Starting Vite in middleware mode...");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const templatePath = path.resolve(process.cwd(), "index.html");
      let template = fs.readFileSync(templatePath, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Dev Server is live at http://0.0.0.0:${PORT}`);
  });
}

startDevServer();
