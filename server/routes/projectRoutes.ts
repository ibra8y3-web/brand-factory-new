import { Router } from "express";
import multer from "multer";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import os from "os";

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.post("/project/unpack", upload.single("file"), async (req: any, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const zipData = fs.readFileSync(file.path);
    const zip = await JSZip.loadAsync(zipData);
    const unpackDir = path.join(os.tmpdir(), `unpack_${Date.now()}`);
    fs.mkdirSync(unpackDir, { recursive: true });

    const files: { path: string; content: string }[] = [];

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async("string");
        const filePath = path.join(unpackDir, relativePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
        files.push({ path: relativePath, content });
      }
    }

    res.json({ success: true, files, unpackDir });
  } catch (error: any) {
    console.error("Error unpacking project:", error);
    res.status(500).json({ error: error.message || "Failed to unpack project" });
  }
});

export default router;
