import * as fs from "fs";
import * as path from "path";

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function uploadFile(accessToken: string, filePath: string, gitPath: string) {
  const owner = "tariqql";
  const repo = "abb-alan-fuel-system";
  
  const fullPath = path.join(process.cwd(), filePath);
  const fileContent = fs.readFileSync(fullPath);
  const base64Content = fileContent.toString("base64");
  
  let sha: string | undefined;
  try {
    const existingResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${gitPath}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    if (existingResponse.ok) {
      const existingFile = await existingResponse.json();
      sha = existingFile.sha;
    }
  } catch (e) {}
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${gitPath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `تحديث ${gitPath}`,
        content: base64Content,
        ...(sha ? { sha } : {})
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل رفع ${gitPath}: ${error}`);
  }
  
  return await response.json();
}

async function main() {
  console.log("الحصول على رمز الوصول...");
  const accessToken = await getAccessToken();
  
  const files = [
    { local: "System_Analysis_Complete.pdf", git: "docs/System_Analysis_Complete.pdf" },
    { local: "SYSTEM_ANALYSIS.md", git: "docs/SYSTEM_ANALYSIS.md" }
  ];
  
  for (const file of files) {
    console.log(`رفع ${file.local}...`);
    const result = await uploadFile(accessToken, file.local, file.git);
    console.log(`✅ تم رفع ${file.local} بنجاح!`);
    console.log(`📄 الرابط: ${result.content.html_url}`);
  }
}

main().catch(console.error);
