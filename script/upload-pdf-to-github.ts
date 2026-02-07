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

async function uploadPDF() {
  console.log("قراءة ملف PDF...");
  
  const pdfPath = path.join(process.cwd(), "System_Architecture_Arabic.pdf");
  const pdfContent = fs.readFileSync(pdfPath);
  const base64Content = pdfContent.toString("base64");
  
  console.log("الحصول على رمز الوصول...");
  const accessToken = await getAccessToken();
  
  const owner = "tariqql";
  const repo = "abb-alan-fuel-system";
  const filePath = "docs/System_Architecture_Arabic.pdf";
  
  // Check if file exists
  console.log("التحقق من وجود الملف على GitHub...");
  let sha: string | undefined;
  try {
    const existingResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
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
      console.log("الملف موجود، سيتم تحديثه...");
    }
  } catch (e) {
    // File doesn't exist
  }
  
  console.log("رفع ملف PDF إلى GitHub...");
  
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'إضافة ملف PDF للتصميم المعماري - System Architecture Arabic',
        content: base64Content,
        ...(sha ? { sha } : {})
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل الرفع: ${error}`);
  }
  
  const result = await response.json();
  console.log("✅ تم رفع ملف PDF بنجاح!");
  console.log(`📄 الرابط: ${result.content.html_url}`);
}

uploadPDF().catch(console.error);
