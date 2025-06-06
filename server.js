const express = require('express');
const dotenv = require('dotenv');
const { authenticateAPI, logAPIUsage } = require('./middleware/auth');
const app = express();
const { Rcon } = require("rcon-client");

// ATH is the all-time high market cap of the token
let ATH = 0;

const runBorderUpdate = async () => {
  try {
    // Step 1: Fetch market cap (replace with real API call)
    const res = await fetch("https://api.example.com/token");
    const { marketCap } = await res.json();

    // Step 2: Check if it's a new all-time high
    if (marketCap > ATH) {
      ATH = marketCap;

      // Step 3: Calculate new radius
      const radius = Math.round(10000 / (1 + Math.exp(-0.00002 * (marketCap - 500000))));

      // Step 4: Send RCON command
      const rcon = await Rcon.connect({
        host: "your.mc.server.ip",
        port: 25575,
        password: "your_password",
      });

      await rcon.send(`worldborder set ${radius} 60`);
      console.log(`[Border Updated] New radius: ${radius}`);
      rcon.end();
    } else {
      console.log("No new ATH yet.");
    }
  } catch (err) {
    console.error("Error updating world border:", err);
  }
};

// Step 5: Run every 5 mins
setInterval(runBorderUpdate, 5 * 60 * 1000);


// END RCON CONNECTION

dotenv.config();
app.use(express.json());

// Add API logging
app.use(logAPIUsage);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Apply authentication to all API routes
app.use('/api', authenticateAPI);

// Route Imports (now under /api prefix)
app.use('/api/link-wallet', require('./routes/linkWallet'));
app.use('/api/balance', require('./routes/getBalance'));
app.use('/api/spend', require('./routes/spendCredits'));
app.use('/api/unstake-request', require('./routes/requestUnstake'));

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});