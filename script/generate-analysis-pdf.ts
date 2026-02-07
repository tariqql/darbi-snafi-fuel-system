import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

async function generatePDF() {
  console.log("قراءة ملف SYSTEM_ANALYSIS.md...");
  
  const mdPath = path.join(process.cwd(), "SYSTEM_ANALYSIS.md");
  const mdContent = fs.readFileSync(mdPath, "utf-8");

  const mermaidBlocks: string[] = [];
  const contentWithPlaceholders = mdContent.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
    mermaidBlocks.push(code.trim());
    return `<div class="mermaid-placeholder" data-index="${mermaidBlocks.length - 1}"></div>`;
  });

  const sections = contentWithPlaceholders.split(/^## /gm);
  let htmlContent = "";
  
  sections.forEach((section, index) => {
    if (index === 0) {
      htmlContent += `<h1>${section.split("\n")[0].replace(/^# /, "")}</h1>`;
      htmlContent += section.split("\n").slice(1).join("\n");
    } else {
      htmlContent += `<h2>${section.split("\n")[0]}</h2>`;
      htmlContent += section.split("\n").slice(1).join("\n");
    }
  });

  htmlContent = htmlContent
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\| (.*?) \|/g, (match) => {
      const cells = match.split("|").filter(c => c.trim());
      return "<tr>" + cells.map(c => `<td>${c.trim()}</td>`).join("") + "</tr>";
    });

  const mermaidDivs = mermaidBlocks.map((code, index) => 
    `<div class="mermaid" id="diagram-${index}">${code}</div>`
  ).join("\n");

  const fullHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تحليل وتصميم نظام عبّ الآن</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Noto Sans Arabic', sans-serif;
      direction: rtl;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
      background: #fff;
      color: #1a1a2e;
      line-height: 1.8;
    }
    h1 {
      color: #f97316;
      font-size: 2.5em;
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 4px solid #f97316;
      padding-bottom: 20px;
    }
    h2 {
      color: #ea580c;
      font-size: 1.8em;
      margin-top: 40px;
      border-right: 5px solid #f97316;
      padding-right: 15px;
      background: linear-gradient(to left, #fef3c7, transparent);
      padding: 10px 15px;
    }
    h3 {
      color: #c2410c;
      font-size: 1.4em;
      margin-top: 25px;
    }
    h4 {
      color: #9a3412;
      font-size: 1.2em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: #fffbeb;
    }
    th, td {
      border: 1px solid #fed7aa;
      padding: 12px;
      text-align: right;
    }
    th {
      background: #f97316;
      color: white;
    }
    tr:nth-child(even) {
      background: #fff7ed;
    }
    code {
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .mermaid {
      background: #fafafa;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      border: 2px solid #fed7aa;
      overflow: auto;
      text-align: center;
    }
    .mermaid svg {
      max-width: 100%;
      height: auto;
    }
    .cover {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%);
      color: white;
      border-radius: 20px;
      margin-bottom: 40px;
    }
    .cover h1 {
      color: white;
      border: none;
      font-size: 3em;
    }
    .cover p {
      font-size: 1.3em;
      opacity: 0.9;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-box {
      background: linear-gradient(135deg, #fff7ed, #fef3c7);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #fed7aa;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: 700;
      color: #f97316;
    }
    .stat-label {
      color: #9a3412;
      font-size: 0.9em;
    }
    @media print {
      body { padding: 20px; }
      .mermaid { page-break-inside: avoid; }
      h2 { page-break-before: auto; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>تحليل وتصميم نظام عبّ الآن</h1>
    <p>نظام متكامل لتقسيط وقود السيارات</p>
    <p>تطبيق العملاء + تطبيق البزنس والشركاء</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="stat-number">18</div>
      <div class="stat-label">جدول في قاعدة البيانات</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">45+</div>
      <div class="stat-label">حالة استخدام</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">5</div>
      <div class="stat-label">عمليات BPMN</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">60+</div>
      <div class="stat-label">نقطة API</div>
    </div>
  </div>

  ${mermaidDivs}
  
  ${htmlContent}

  <script>
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, curve: 'basis' },
      sequence: { useMaxWidth: true },
      er: { useMaxWidth: true }
    });
  </script>
</body>
</html>`;

  console.log("تشغيل Puppeteer لإنشاء PDF...");
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  await page.setContent(fullHtml, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log("انتظار تحميل مخططات Mermaid...");
  await page.waitForFunction(() => {
    const diagrams = document.querySelectorAll('.mermaid');
    return Array.from(diagrams).every(d => d.querySelector('svg'));
  }, { timeout: 30000 }).catch(() => console.log("تحذير: بعض المخططات قد لم تُحمّل"));

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log("إنشاء ملف PDF...");
  
  await page.pdf({
    path: 'System_Analysis_Complete.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();

  const stats = fs.statSync('System_Analysis_Complete.pdf');
  console.log(`✅ تم إنشاء ملف System_Analysis_Complete.pdf بنجاح!`);
  console.log(`📄 حجم الملف: ${(stats.size / 1024).toFixed(2)} KB`);
}

generatePDF().catch(console.error);
