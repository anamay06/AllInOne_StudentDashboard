import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '../frontend/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // For GOOGLE_CLIENT_SECRET

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 1. Initial Auth Code Exchange
router.post('/auth', async (req, res) => {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'Code and userId required' });
    if (!GOOGLE_CLIENT_SECRET) return res.status(500).json({ error: 'Server missing GOOGLE_CLIENT_SECRET in backend/.env' });

    try {
        // Exchange auth code for tokens securely on the backend
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: 'postmessage', // critical for react-oauth 'auth-code' flow
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Fetch user's email to store alongside token
        const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const infoData = await infoRes.json();

        // Calculate precise expiry
        const expiry = Date.now() + (tokenData.expires_in * 1000);

        const updates = {
            google_access_token: tokenData.access_token,
            google_token_expiry: expiry,
            google_calendar_email: infoData.email
        };
        
        // Google sometimes only issues refresh_tokens on the absolute first authorization
        if (tokenData.refresh_token) {
            updates.google_refresh_token = tokenData.refresh_token;
        }

        const { error } = await supabase.from('user_settings').update(updates).eq('user_id', userId);
        if (error) throw error;

        res.json({ success: true, email: infoData.email });
    } catch (err) {
        console.error('Google Auth Exchange Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Safely Retrieve Token (Auto-Refreshes if Expired)
router.get('/token', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('google_access_token, google_refresh_token, google_token_expiry, google_calendar_email')
            .eq('user_id', userId)
            .single();

        if (error || !data || !data.google_access_token) {
            return res.status(404).json({ error: 'Not connected' });
        }

        // If the token is expired or expires in < 5 minutes, proactively refresh it
        if (Date.now() > data.google_token_expiry - (5 * 60 * 1000)) {
            if (!data.google_refresh_token) {
                return res.status(400).json({ error: 'Access token expired but no refresh token is saved. Please reconnect.' });
            }
            if (!GOOGLE_CLIENT_SECRET) return res.status(500).json({ error: 'Server missing GOOGLE_CLIENT_SECRET' });

            const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    refresh_token: data.google_refresh_token,
                    grant_type: 'refresh_token'
                })
            });

            const refreshData = await refreshRes.json();
            if (refreshData.error) throw new Error(refreshData.error_description || refreshData.error);

            const newExpiry = Date.now() + (refreshData.expires_in * 1000);
            
            await supabase.from('user_settings').update({
                google_access_token: refreshData.access_token,
                google_token_expiry: newExpiry
            }).eq('user_id', userId);

            return res.json({ access_token: refreshData.access_token, email: data.google_calendar_email });
        }

        // Return perfectly valid token
        res.json({ access_token: data.google_access_token, email: data.google_calendar_email });
    } catch (err) {
        console.error('Token Retrieval Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Disconnect Protocol
router.post('/disconnect', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    try {
        await supabase.from('user_settings').update({
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_calendar_email: null
        }).eq('user_id', userId);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
