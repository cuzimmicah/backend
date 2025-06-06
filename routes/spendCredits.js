const express = require('express');
const supabase = require('../supabaseClient');
const router = express.Router();

router.post('/', async (req, res) => {
  const { username, amount } = req.body;
  if (!username || !amount) return res.status(400).json({ error: 'Missing fields' });

  const { data: user, error: userError } = await supabase
    .from('players')
    .select('*')
    .eq('username', username)
    .single();

  if (userError || !user) return res.status(404).json({ error: 'User not found' });
  if (user.in_game_credits < amount) return res.status(403).json({ error: 'Insufficient credits' });

  const { error } = await supabase
    .from('players')
    .update({ in_game_credits: user.in_game_credits - amount })
    .eq('username', username);

  if (error) return res.status(500).json({ error });

  res.json({ message: 'Credits spent' });
});

module.exports = router;