const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JOBS_FILE = path.join(__dirname, 'data', 'jobs.json');

// Run the python scraper helper
function runScraper() {
  return new Promise((resolve, reject) => {
    console.log("Spawning Python job crawler...");
    exec('python fetch_jobs.py', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Scraper error: ${error.message}`);
        return reject(error);
      }
      console.log(`Scraper output: ${stdout}`);
      if (stderr) {
        console.warn(`Scraper stderr: ${stderr}`);
      }
      resolve();
    });
  });
}

// GET /api/jobs - Return list of jobs
app.get('/api/jobs', async (req, res) => {
  try {
    if (!fs.existsSync(JOBS_FILE)) {
      console.log("jobs.json not found, running initial crawl...");
      await runScraper();
    }
    
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf8');
      return res.json(JSON.parse(data));
    } else {
      return res.status(404).json({ error: "Jobs database could not be loaded." });
    }
  } catch (error) {
    console.error("Error reading jobs:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// POST /api/refresh - Trigger manual scrape and return new list
app.post('/api/refresh', async (req, res) => {
  try {
    console.log("Manual sync requested by user...");
    await runScraper();
    
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, 'utf8');
      return res.json({ success: true, jobs: JSON.parse(data) });
    } else {
      return res.status(500).json({ error: "Scraper executed but output could not be loaded." });
    }
  } catch (error) {
    console.error("Error running manual refresh:", error);
    res.status(500).json({ error: "Sync failed", details: error.message });
  }
});

// Serve frontend for all other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 JOB MONITOR DASHBOARD RUNNING ON PORT ${PORT}`);
  console.log(`🔗 Open: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
