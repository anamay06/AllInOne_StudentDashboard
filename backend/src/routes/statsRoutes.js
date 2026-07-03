import express from 'express';
import { supabase, fetchLeetCodeStats, fetchCodeforcesStats, fetchCodeChefStats, refreshStatsCache } from '../services/statsService.js';

const router = express.Router();

router.get('/coding', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
    }

    try {
        // Fetch user from Supabase using Anon Key setup in statsService
        const { data: settings, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (error || !settings) {
            return res.status(404).json({ error: "User profiles not found in database" });
        }

        // Check if cache is stale (older than 30 minutes)
        const THIRTY_MINUTES = 30 * 60 * 1000;
        const lastCachedAt = settings.cached_stats_at ? new Date(settings.cached_stats_at).getTime() : 0;
        const isStale = (Date.now() - lastCachedAt) > THIRTY_MINUTES;

        // If it's stale, fire and forget the caching orchestrator into the Node event loop (Stale-While-Revalidate)
        if (isStale) {
            setImmediate(() => {
                refreshStatsCache(user_id, settings);
            });
        }

        // Instantly return the database settings (stale or fresh)
        return res.json({
            fromCache: true,
            isStale: isStale,
            leetcode: {
                total: settings.leetcode_solved || 0,
                easy: settings.lc_easy || 0, // In db future if needed
                medium: settings.lc_medium || 0,
                hard: settings.lc_hard || 0
            },
            codeforces: {
                rating: settings.cf_rating || 0,
                rank: 'Unrated', 
                maxRating: settings.cf_rating || 0,
                solved: 0
            },
            codechef: {
                rating: settings.cc_rating || 0,
                solved: 0,
                stars: settings.cc_rating >= 2200 ? '7★' :
                       settings.cc_rating >= 2000 ? '6★' :
                       settings.cc_rating >= 1800 ? '5★' :
                       settings.cc_rating >= 1600 ? '4★' :
                       settings.cc_rating >= 1400 ? '3★' :
                       settings.cc_rating >= 1000 ? '2★' : '1★'
            }
        });

    } catch (err) {
        console.error("Coding Stats Route Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
