const express = require('express');
const supabase = require('../supabaseClient');
const router = express.Router();

router.get('/:username', async (req, res) => {
  const { username } = req.params;

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single();

  if (error) return res.status(404).json({ error });

  res.json({
    username: data.username,
    wallet: data.wallet,
    staked_amount: data.staked_amount,
    in_game_credits: data.in_game_credits
  });
});

module.exports = router;