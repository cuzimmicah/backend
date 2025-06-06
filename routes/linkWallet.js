const express = require('express');
const supabase = require('../supabaseClient');
const router = express.Router();

// Solana wallet validation function
function isValidSolanaWallet(wallet) {
  // Solana addresses are base58-encoded and typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  if (!base58Regex.test(wallet)) {
    return false;
  }
  
  // Additional validation: Solana addresses are usually 44 characters
  // but can be 32-44 characters for different address types
  if (wallet.length < 32 || wallet.length > 44) {
    return false;
  }
  
  // Check for invalid base58 characters
  const invalidChars = /[0OIl]/;
  if (invalidChars.test(wallet)) {
    return false;
  }
  
  return true;
}

router.post('/', async (req, res) => {
  const { wallet, username } = req.body;

  // Basic field validation
  if (!wallet || !username) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: 'Both wallet and username are required'
    });
  }

  // Username validation
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ 
      error: 'Invalid username',
      details: 'Username must be 3-20 characters long'
    });
  }

  // Solana wallet validation
  if (!isValidSolanaWallet(wallet)) {
    return res.status(400).json({ 
      error: 'Invalid Solana wallet address',
      details: 'Please provide a valid Solana wallet address (32-44 characters, base58 encoded)'
    });
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .upsert({ wallet, username }, { onConflict: ['username'] });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database operation failed',
        details: 'Unable to link wallet at this time'
      });
    }

    res.json({ 
      message: 'Wallet successfully linked',
      data: {
        username,
        wallet,
        linked_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    });
  }
});

module.exports = router;