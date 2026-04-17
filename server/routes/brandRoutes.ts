import { Router } from "express";
import { getSupabase } from "../config/supabase";
import archiver from "archiver";
import * as aiService from "../services/aiService";

const router = Router();

router.post("/initialize-brand", async (req, res) => {
  const { projectName, description } = req.body;
  try {
    const client = getSupabase();
    
    // Use the database-driven logic to find the best models
    const logicAgent = await aiService.getBestModelForTask("general");
    const visionAgent = await aiService.getBestModelForTask("vision");
    const codingAgent = await aiService.getBestModelForTask("coding");

    const { data: allActiveModels } = await client
      .from("ai_models")
      .select("id")
      .eq("is_active", true);

    const { data, error } = await client
      .from("active_brands")
      .insert([{ 
        project_name: projectName, 
        details: { 
          description, 
          available_models_count: (allActiveModels?.length || 0),
          assigned_logic: logicAgent?.name || "Llama 3",
          assigned_vision: visionAgent?.name || "DALL-E 3",
          assigned_coding: codingAgent?.name || "Code Architect",
          logic_model_id: logicAgent?.id,
          vision_model_id: visionAgent?.id,
          coding_model_id: codingAgent?.id,
          status: "Initializing" 
        },
        features: [] 
      }])
      .select();

    let brandData = { id: "temp-" + Date.now(), project_name: projectName };
    if (error) {
      console.warn("Could not save to active_brands, proceeding anyway:", error.message);
    } else if (data && data.length > 0) {
      brandData = data[0];
    }

    res.json({ 
      success: true, 
      message: `Brand initialized and linked with ${allActiveModels?.length || 0} active models from database.`, 
      data: brandData,
      agents: { logic: logicAgent, vision: visionAgent, coding: codingAgent }
    });
  } catch (error: any) {
    console.error("Initialization Error:", error);
    console.error(error.stack);
    res.status(500).json({ error: "فشل في تهيئة المشروع وربطه بالنماذج من القاعدة.", details: error.message });
  }
});

router.post("/deploy", async (req, res) => {
  const { projectName, details, htmlContent, features, codeQualityScore, projectFiles } = req.body;
  try {
    const client = getSupabase();
    
    // Store extra fields inside details since they might not exist as columns
    const deploymentDetails = {
      ...(details || {}),
      features: features || [],
      code_quality_score: codeQualityScore || 0
    };

    const finalProjectName = projectName || details?.name || "Untitled Project";

    const { data, error } = await client
      .from("deployments")
      .insert([{ 
        project_name: finalProjectName, 
        details: deploymentDetails,
        project_files: projectFiles || null,
        html_content: htmlContent,
        payment_status: "completed"
      }])
      .select();

    if (error) {
      console.warn("Could not save to deployments, proceeding anyway:", error.message);
      return res.json({ success: true, data: { id: "temp-" + Date.now(), project_name: finalProjectName } });
    }
    
    res.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error("Supabase Error:", error.message);
    res.status(500).json({ error: "Failed to deploy to database" });
  }
});

router.get("/recent-projects", async (req, res) => {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("deployments")
      .select("id, project_name, details, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("Could not fetch recent projects:", error.message);
      return res.json({ success: true, projects: [] });
    }
    
    res.json({ success: true, projects: data });
  } catch (error: any) {
    console.error("Supabase Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch recent projects" });
  }
});

router.post("/add-model", async (req, res) => {
  const { name, provider, apiUrl, tokenization, agentType, thinkingStyle } = req.body;
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("ai_models")
      .insert([{ 
        name, 
        provider, 
        api_url: apiUrl,
        description: `Unified AI Model with ${tokenization} tokenization. Manually added.`,
        category: "Custom",
        is_active: true,
        agent_type: agentType || "general",
        thinking_style: thinkingStyle || "general",
        is_verified: true,
        likes: 100,
        downloads: 50
      }])
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (error: any) {
    console.error("Supabase Insert Error:", error.message);
    res.status(500).json({ error: "فشل في إضافة النموذج إلى قاعدة البيانات." });
  }
});

router.get("/download-project/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("deployments")
      .select("project_name, html_content, details")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Project not found" });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set headers for download
    res.attachment(`${data.project_name.replace(/\s+/g, '_').toLowerCase()}_project.zip`);
    
    archive.pipe(res);

    const projectFiles = data.details?.project_files;

    // If we have multi-file project structure
    if (projectFiles && Array.isArray(projectFiles)) {
      projectFiles.forEach((file: any) => {
        if (file.path && file.content) {
          archive.append(file.content, { name: file.path });
        }
      });
    } else if (data.html_content) {
      // Fallback to single file HTML
      archive.append(data.html_content, { name: 'index.html' });
    }
    
    // Add a basic README
    const readme = `# ${data.project_name}\n\nGenerated by AI Studio.\n\nTo run this project, follow the instructions specific to the tech stack generated.`;
    archive.append(readme, { name: 'README.md' });

    await archive.finalize();

  } catch (error: any) {
    console.error("Download Error:", error.message);
    res.status(500).json({ error: "Failed to generate ZIP file" });
  }
});

export default router;
