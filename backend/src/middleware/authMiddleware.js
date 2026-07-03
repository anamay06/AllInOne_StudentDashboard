import { supabase } from '../config/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token', details: error });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
