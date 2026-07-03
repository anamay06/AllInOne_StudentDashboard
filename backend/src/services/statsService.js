import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Because backend is a trusted environment, using anon key for now, but service role is better if available.
// We will use anon key to update their profiles, assuming RLS allows it or we will bypass it.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==============================================
// 1. LEETCODE API (ALFA REST WRAPPER)
// ==============================================
export const fetchLeetCodeStats = async (username) => {
    if (!username) return null;
    try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
            total: data.solvedProblem || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0
        };
    } catch (error) {
        console.error("LeetCode Fetch Error:", error.message);
        return null;
    }
};

// ==============================================
// 2. CODEFORCES API (OFFICIAL)
// ==============================================
export const fetchCodeforcesStats = async (username) => {
    if (!username) return null;
    try {
        const [infoRes, statusRes] = await Promise.all([
            fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`),
            fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}`)
        ]);

        if (!infoRes.ok || !statusRes.ok) return null;

        const info = await infoRes.json();
        const status = await statusRes.json();

        if (info.status !== 'OK' || status.status !== 'OK') return null;

        const infoData = info.result[0] || {};
        
        // Count unique problems solved with 'OK' verdict
        const solvedSet = new Set();
        (status.result || []).forEach(submission => {
            if (submission.verdict === 'OK' && submission.problem) {
                const probId = `${submission.problem.contestId || 'edu'}-${submission.problem.index}`;
                solvedSet.add(probId);
            }
        });

        return {
            rating: infoData.rating || 0,
            rank: infoData.rank || 'Unrated',
            maxRating: infoData.maxRating || 0,
            solved: solvedSet.size
        };
    } catch (error) {
        console.error("CodeForces Fetch Error:", error.message);
        return null;
    }
};

// ==============================================
// 3. CODECHEF SCRAPER (NATIVE HTML REGEX)
// ==============================================
export const fetchCodeChefStats = async (username) => {
    if (!username) return null;
    try {
        const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(username)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });
        
        if (!res.ok) return null;
        
        const html = await res.text();
        
        const ratingMatch = html.match(/rating-number[^>]*>\s*([0-9]+)/i);
        const solvedMatch = html.match(/Fully Solved\s*\((\d+)\)/i);

        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
        const solved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

        // Calculate stars based on logic
        let stars = '1★';
        if (rating >= 2200) stars = '7★';
        else if (rating >= 2000) stars = '6★';
        else if (rating >= 1800) stars = '5★';
        else if (rating >= 1600) stars = '4★';
        else if (rating >= 1400) stars = '3★';
        else if (rating >= 1000) stars = '2★';

        return { rating, solved, stars };
    } catch (error) {
        console.error("CodeChef Fetch Error:", error.message);
        return null;
    }
};

// ==============================================
// 4. CACHE REFRESHER (STALE-WHILE-REVALIDATE)
// ==============================================
export const refreshStatsCache = async (user_id, settings) => {
    try {
        // Run all three fetchers concurrently
        const [lc, cf, cc] = await Promise.all([
            fetchLeetCodeStats(settings.lc_username),
            fetchCodeforcesStats(settings.cf_username),
            fetchCodeChefStats(settings.cc_username)
        ]);

        // Construct payload for Supabase database update
        const updates = { cached_stats_at: new Date().toISOString() };
        
        if (lc) {
            updates.leetcode_solved = lc.total;
            updates.leetcode_rank = lc.total; // Using solved as a pseudo-rank mapping if needed, or leave untouched; we fetch dynamically
        }
        if (cf) {
            updates.cf_rating = cf.rating;
        }
        if (cc) {
            updates.cc_rating = cc.rating;
        }

        // Commit update to Supabase cache
        const { error } = await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_id', user_id);

        if (error) console.error("Cache Update Error for User", user_id, error);
            
    } catch (error) {
        console.error("Cache orchestrator error:", error);
    }
};
