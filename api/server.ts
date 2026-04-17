import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import aiRoutes from "../server/routes/aiRoutes";
import brandRoutes from "../server/routes/brandRoutes";
import projectRoutes from "../server/routes/projectRoutes";

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: 'Infinity' }));
app.use(express.urlencoded({ extended: true, limit: 'Infinity' }));

// API Routes
app.use("/api", aiRoutes);
app.use("/api", brandRoutes);
app.use("/api", projectRoutes);

async function setupApp() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    // Use dynamic import to avoid loading Vite/Rollup in production
    const { createServer: createViteServer } = await import("vite");
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
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// For local running or AI Studio (not Vercel)
if (!process.env.VERCEL) {
  setupApp().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> Server is live at http://0.0.0.0:${PORT}`);
    });
  });
}

export default app;
