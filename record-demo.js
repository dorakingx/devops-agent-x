const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const videoDir = path.join(__dirname, 'demo-assets');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  
  try {
    console.log('Navigating to Ops Arena...');
    await page.goto('https://devops-agent-x-602964828967.asia-northeast1.run.app', { waitUntil: 'networkidle' });
    
    // Hero View
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'demo-assets/01-hero.png' });
    console.log('Saved 01-hero.png');

    // Click Demo Button
    console.log('Loading Demo Scenario...');
    await page.click('#demo-scenario-btn');
    
    // Wait for the incident output to appear and the commentator text
    await page.waitForSelector('.match-title-text', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for animations
    await page.screenshot({ path: 'demo-assets/02-scenario-loaded.png' });
    console.log('Saved 02-scenario-loaded.png');
    
    // This is also a good thumbnail
    await page.screenshot({ path: 'demo-assets/thumbnail.png' });
    console.log('Saved thumbnail.png');

    // Scroll to Timeline
    await page.evaluate(() => {
      const el = document.getElementById('play-by-play-list');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'demo-assets/03-live-timeline.png' });
    console.log('Saved 03-live-timeline.png');

    // Scroll to Scoreboard
    await page.evaluate(() => {
      const el = document.getElementById('scoreboard-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'demo-assets/04-scoreboard.png' });
    console.log('Saved 04-scoreboard.png');

    // Scroll to Tactics Board
    await page.evaluate(() => {
      const el = document.getElementById('tactics-board-content');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'demo-assets/05-tactics-board.png' });
    console.log('Saved 05-tactics-board.png');

    // Scroll to Recovery Plan
    await page.evaluate(() => {
      const el = document.getElementById('recovery-plan-content');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(3000);

    // Scroll to Incident Report
    await page.evaluate(() => {
      const el = document.getElementById('incident-result');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await page.waitForTimeout(4000);
    
    console.log('Finished capturing scenario.');
  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await context.close();
    await browser.close();

    // Rename the recorded webm file
    const files = fs.readdirSync(videoDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      const oldPath = path.join(videoDir, videoFile);
      const newPath = path.join(videoDir, 'ops-arena-demo.webm');
      fs.renameSync(oldPath, newPath);
      console.log(`Video saved to demo-assets/ops-arena-demo.webm`);
    } else {
      console.error('No video file found.');
    }
  }
})();
