const crypto = require('crypto');

// In production, store these in environment variables
const API_KEYS = new Set([
  process.env.API_KEY_1 || 'mc-api-key-dev-12345',
  process.env.API_KEY_2 || 'mc-api-key-admin-67890',
  // Add more API keys as needed
]);

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide an API key in the x-api-key header or Authorization header'
    });
  }

  if (!API_KEYS.has(apiKey)) {
    return res.status(401).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Rate limiting
  const clientId = apiKey.substring(0, 10); // Use part of API key as identifier
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, []);
  }

  const requests = rateLimitStore.get(clientId);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${RATE_LIMIT_MAX_REQUESTS} requests per minute`,
      retryAfter: Math.ceil((recentRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }

  // Add current request
  recentRequests.push(now);
  rateLimitStore.set(clientId, recentRequests);

  // Add API key info to request for logging
  req.apiKey = {
    key: apiKey.substring(0, 10) + '...',
    timestamp: now
  };

  next();
}

// Middleware for logging API usage
function logAPIUsage(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Key: ${req.apiKey?.key || 'none'}`);
  });
  
  next();
}

module.exports = {
  authenticateAPI,
  logAPIUsage
};