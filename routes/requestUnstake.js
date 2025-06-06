const express = require('express');
const supabase = require('../supabaseClient');
const router = express.Router();

router.post('/', async (req, res) => {
  const { username } = req.body;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Player not found' });

  const amount = data.staked_amount;
  const creditsUsed = data.in_game_credits_used || 0;
  const availableToUnstake = amount - creditsUsed;

  // TODO: send to smart contract backend (or queue it)
  res.json({
    message: 'Unstake request logged',
    available_to_unstake: availableToUnstake
  });
});

module.exports = router;
