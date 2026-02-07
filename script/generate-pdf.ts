import puppeteer from "puppeteer";
import { marked } from "marked";
import * as fs from "fs";
import * as path from "path";

async function generatePDF() {
  console.log("قراءة ملف DESIGN.md...");
  const mdContent = fs.readFileSync(path.join(process.cwd(), "DESIGN.md"), "utf-8");

  // Convert Mermaid code blocks to divs for rendering
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let processedContent = mdContent.replace(mermaidRegex, (match, code) => {
    return `<div class="mermaid">${code.trim()}</div>`;
  });

  // Convert remaining markdown to HTML
  const htmlContent = await marked.parse(processedContent);

  const fullHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تصميم نظام عبّ الآن - البنية المعمارية</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      line-height: 1.8;
      color: #1a1a2e;
      max-width: 100%;
      margin: 0;
      padding: 40px;
      background: white;
    }
    
    h1 {
      color: #f59e0b;
      font-size: 32px;
      border-bottom: 4px solid #f59e0b;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    
    h2 {
      color: #1a1a2e;
      font-size: 24px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    
    h3 {
      color: #374151;
      font-size: 20px;
      margin-top: 30px;
    }
    
    h4 {
      color: #4b5563;
      font-size: 18px;
    }
    
    hr {
      border: none;
      border-top: 2px solid #f59e0b;
      margin: 40px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    
    th, td {
      border: 1px solid #d1d5db;
      padding: 12px;
      text-align: right;
    }
    
    th {
      background-color: #f59e0b;
      color: white;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    code {
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    
    pre {
      background-color: #1f2937;
      color: #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
    
    .mermaid {
      background-color: #fefefe;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    ul, ol {
      padding-right: 25px;
      padding-left: 0;
    }
    
    li {
      margin: 8px 0;
    }
    
    blockquote {
      border-right: 4px solid #f59e0b;
      border-left: none;
      padding-right: 20px;
      padding-left: 0;
      margin: 20px 0;
      color: #6b7280;
      font-style: italic;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    /* Cover page styling */
    .cover {
      text-align: center;
      padding: 100px 40px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      margin: -40px -40px 40px -40px;
      page-break-after: always;
    }
    
    .cover h1 {
      color: white;
      border: none;
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .cover p {
      font-size: 20px;
      opacity: 0.9;
    }
    
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>🛢️ نظام عبّ الآن</h1>
    <p>وثيقة التصميم المعماري</p>
    <p>نظام تقسيط وقود السيارات</p>
    <p style="margin-top: 40px; font-size: 16px;">فبراير 2026</p>
  </div>
  
  ${htmlContent}
  
  <div class="footer">
    <p>تم إنشاء هذا التصميم بواسطة Claude AI - نظام عبّ الآن</p>
    <p>© 2026 جميع الحقوق محفوظة</p>
  </div>
  
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true, wrap: true, actorMargin: 100 }
    });
  </script>
</body>
</html>
`;

  console.log("تشغيل Puppeteer لإنشاء PDF...");
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  await page.setContent(fullHtml, {
    waitUntil: 'networkidle0'
  });
  
  // Wait for Mermaid to render
  console.log("انتظار تحميل مخططات Mermaid...");
  await page.waitForFunction(() => {
    const diagrams = document.querySelectorAll('.mermaid');
    return Array.from(diagrams).every(d => d.querySelector('svg'));
  }, { timeout: 30000 }).catch(() => {
    console.log("تحذير: بعض المخططات قد لا تكون محملة بالكامل");
  });
  
  // Additional wait for rendering
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("إنشاء ملف PDF...");
  
  await page.pdf({
    path: 'System_Architecture_Arabic.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: false
  });
  
  await browser.close();
  
  console.log("✅ تم إنشاء ملف System_Architecture_Arabic.pdf بنجاح!");
  
  // Verify file exists
  if (fs.existsSync('System_Architecture_Arabic.pdf')) {
    const stats = fs.statSync('System_Architecture_Arabic.pdf');
    console.log(`📄 حجم الملف: ${(stats.size / 1024).toFixed(2)} KB`);
  }
}

generatePDF().catch(console.error);
