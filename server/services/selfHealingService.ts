import * as aiService from "./aiService";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// TODO: Update these with your actual repo details
const OWNER = "Ibrahim35pe";
const REPO = "nexus-ai-platform";

export async function handleBuildFailureWebhook(payload: any) {
  console.log("Processing build failure webhook...");
  
  // 1. Identify the failed run
  if (payload.workflow_run && payload.workflow_run.conclusion === "failure") {
    const runId = payload.workflow_run.id;
    console.log("Failed workflow run ID:", runId);
    
    // 2. Fetch logs (this is a simplified example)
    // In a real scenario, you'd use octokit.actions.downloadWorkflowRunLogs
    // const logs = await octokit.actions.downloadWorkflowRunLogs({ ... });
    
    // For now, we'll simulate log fetching
    const simulatedLogs = "Error: Build failed at step 'npm run build'. Exit code 1.";
    
    // 3. Trigger analysis and fix
    await analyzeAndFixCode(simulatedLogs);
  } else {
    console.log("Not a workflow failure or not a workflow_run event.");
  }
}

export async function analyzeAndFixCode(logs: string) {
  // 1. Analyze logs with AI to get the fix
  const prompt = `Analyze these error logs and identify the issue: ${logs}. 
    Provide the fix as a JSON object with:
    - 'analysis': string (briefly explain what the error is and how to fix it)
    - 'fixedCode': string (the full content of the file or code snippet after the fix)`;
    
  try {
    const result = await aiService.dynamicCall(prompt, "coding", "", true);
    let fixData;
    
    try {
      fixData = typeof result.text === 'string' ? JSON.parse(result.text) : result.text;
    } catch (e) {
      // Fallback if JSON parsing fails
      const text = result.text || "";
      const codeMatch = text.match(/```(?:javascript|typescript|tsx|jsx)?\n([\s\S]*?)\n```/);
      fixData = {
        analysis: text.replace(/```[\s\S]*?```/g, '').trim(),
        fixedCode: codeMatch ? codeMatch[1] : text
      };
    }
    
    const { analysis, fixedCode } = fixData;
    
    return {
      success: true,
      analysis: analysis || "تم تحليل الخطأ بنجاح.",
      fixedCode: fixedCode || "// No specific code fix generated."
    };
  } catch (error: any) {
    console.error("Self-healing analysis failed:", error);
    throw new Error("Failed to analyze and fix the error: " + error.message);
  }
}
