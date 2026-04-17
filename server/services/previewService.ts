import * as aiService from "./aiService.js";
import path from "path";
import fs from "fs";
import os from "os";

export async function saveFiles(files: { path: string; content: string }[]) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-preview-"));
  
  for (const file of files) {
    const filePath = path.join(tempDir, file.path);
    const fileDir = path.dirname(filePath);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, file.content);
  }
  
  return tempDir;
}

export async function buildAndRunPreview(projectPath: string, framework: string) {
  console.log(`Generating simulated preview for ${framework} at ${projectPath}...`);
  
  try {
    // Helper to get files recursively
    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
          arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
          arrayOfFiles.push(path.join(dirPath, file));
        }
      });
      return arrayOfFiles;
    };

    const allFiles = getAllFiles(projectPath);
    const codeContext = allFiles
      .filter(f => f.endsWith(".dart") || f.endsWith(".tsx") || f.endsWith(".jsx") || f.endsWith(".ts"))
      .slice(0, 8) // Increased context slightly
      .map(f => {
        const relativePath = path.relative(projectPath, f);
        const content = fs.readFileSync(f, "utf-8");
        return `File: ${relativePath}\nContent:\n${content}`;
      })
      .join("\n\n");

    const prompt = `You are a UI Simulator. Based on the following ${framework} project code, generate a single-file HTML/CSS/JS simulation that visually represents how this app would look and behave.
      
      Requirements:
      1. Use Tailwind CSS via CDN for styling.
      2. Include Lucide icons via CDN if needed.
      3. Make it look professional, high-fidelity, and match the UI described in the code.
      4. Ensure it's responsive and fits within a mobile/desktop frame.
      5. Add basic interactivity (e.g., button clicks, navigation simulation) if possible.
      
      Project Context:
      ${codeContext}
      
      Return ONLY the raw HTML code starting with <!DOCTYPE html>.`;

    const result = await aiService.dynamicCall(prompt, "coding", "", false);
    const htmlContent = result.text || "<html><body><h1>Preview not available</h1></body></html>";
    
    return { 
      success: true, 
      message: "Preview generated", 
      html: htmlContent 
    };
  } catch (error: any) {
    console.error(`Preview generation error: ${error.message}`);
    throw error;
  }
}
