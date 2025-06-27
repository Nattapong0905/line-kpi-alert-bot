import puppeteer from 'puppeteer';
import fs from 'fs';
import axios from 'axios';

const POWERBI_URL = 'https://aigpbi.aitech.co.th/reports/powerbi/ERP/KPI%20%20status';
const LINE_TOKEN = process.env.LINE_TOKEN;
const GROUP_ID = process.env.LINE_GROUP_ID;

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.goto(POWERBI_URL, { waitUntil: 'networkidle2' });

const text = await page.evaluate(() => document.body.innerText);

const extract = (label) => {
  const regex = new RegExp(label + "\\s+(\\d+)", "i");
  const match = text.match(regex);
  return match ? parseInt(match[1]) : 0;
};

const kpi = {
  automotive: extract('Automotive'),
  nonauto: extract('Non-Auto'),
  inorganic: extract('Inorganic'),
  oversea: extract('Over sea'),
  ai2: extract('AI#2'),
};

let old = {};
const file = 'last.json';
if (fs.existsSync(file)) old = JSON.parse(fs.readFileSync(file));

const changed = Object.keys(kpi).some(key => kpi[key] !== old[key]);

if (changed) {
  const message = `
🚨Alerts🚨 AI TECHNOLOGY
Project Management War Room
KPI Status Delay by plot sales

Automotive  ${kpi.automotive} Job
Non-Auto   ${kpi.nonauto} Job
Inorganic   ${kpi.inorganic} Job
Over sea    ${kpi.oversea} Job
AI#2        ${kpi.ai2} Job`;

  await axios.post('https://api.line.me/v2/bot/message/push', {
    to: GROUP_ID,
    messages: [{ type: 'text', text: message }]
  }, {
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  fs.writeFileSync(file, JSON.stringify(kpi));
}

await browser.close();
