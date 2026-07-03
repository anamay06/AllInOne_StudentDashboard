// Safe JSON fetcher — returns null on any failure instead of throwing
async function safeFetchJson(url) {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'COMMIT/1.0' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        return null;
    }
}

// Codeforces Contests
async function getCodeforcesContests() {
    try {
        const data = await safeFetchJson('https://codeforces.com/api/contest.list');
        if (!data || data.status !== 'OK') return [];

        const now = Math.floor(Date.now() / 1000);
        const relevant = data.result.filter(c => c.phase === 'BEFORE');

        // 48-hour window
        return relevant
            .filter(c => c.startTimeSeconds < now + 172800)
            .map(c => ({
                platform: 'codeforces',
                title: c.name,
                startTime: c.startTimeSeconds * 1000,   // convert to ms
                link: 'https://codeforces.com/contests'
            }))
            .sort((a, b) => a.startTime - b.startTime);
    } catch (e) {
        console.error('CF Contest Error', e);
        return [];
    }
}

// CodeChef Contests
async function getCodechefContests() {
    try {
        const data = await safeFetchJson('https://www.codechef.com/api/list/contests/all');
        if (!data) return [];

        const now = Date.now();
        const limit = now + 172800000; // 48 hours in ms

        const future  = Array.isArray(data.future_contests)  ? data.future_contests  : [];
        const present = Array.isArray(data.present_contests) ? data.present_contests : [];

        const relevant = [...present, ...future].filter(c => {
            if (!c.contest_start_date_iso) return false;
            // Exclude "Dev" challenges
            if (c.contest_name && c.contest_name.toLowerCase().includes('dev')) return false;
            const start = new Date(c.contest_start_date_iso).getTime();
            return start > now - 86400000 && start < limit;
        });

        return relevant.map(c => ({
            platform: 'codechef',
            title: c.contest_name,
            startTime: new Date(c.contest_start_date_iso).getTime(),
            link: `https://www.codechef.com/${c.contest_code}`
        }));
    } catch (e) {
        console.error('CC Contest Error', e);
        return [];
    }
}

// LeetCode Contests (V2 — Deterministic Calculation)
async function getLeetCodeContestsV2() {
    const contests = [];
    const now = new Date();
    const windowMs = 172800000; // 48 hours

    // 1. WEEKLY CONTEST — Every Sunday at 2:30 AM UTC
    let nextSunday = new Date(now);
    nextSunday.setUTCHours(2, 30, 0, 0);

    const currentDay = nextSunday.getUTCDay();
    const daysUntilSunday = (7 - currentDay) % 7;
    nextSunday.setUTCDate(nextSunday.getUTCDate() + daysUntilSunday);

    // If we've already passed this Sunday's contest, skip to next week
    if (nextSunday.getTime() < now.getTime()) {
        nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
    }

    // Add all weekly contests within the 48h window
    let tempSunday = new Date(nextSunday);
    while (tempSunday.getTime() - now.getTime() < windowMs) {
        contests.push({
            platform: 'leetcode',
            title: 'Weekly Contest',
            startTime: tempSunday.getTime(),
            link: 'https://leetcode.com/contest/'
        });
        tempSunday.setUTCDate(tempSunday.getUTCDate() + 7);
    }

    // 2. BIWEEKLY CONTEST — Every 2 weeks on Saturday 2:30 PM UTC
    // Anchor date: Updated to a recent Saturday from Mar 2026 for accuracy.
    // Mar 21, 2026 was a Weekly contest day? No, it should be Saturday.
    // Mar 21, 2026 (Saturday) had a Biweekly.
    const anchor = new Date('2026-03-21T14:30:00Z');
    const msPer2Weeks = 1209600000;

    const sinceAnchor = now.getTime() - anchor.getTime();
    let periods = Math.floor(sinceAnchor / msPer2Weeks);
    let potentialBiweekly = new Date(anchor.getTime() + periods * msPer2Weeks);

    // If this one ended (start + 2h < now), move to next occurrence
    if (potentialBiweekly.getTime() + 7200000 < now.getTime()) {
        potentialBiweekly = new Date(potentialBiweekly.getTime() + msPer2Weeks);
    }

    let tempBiweekly = new Date(potentialBiweekly);
    while (tempBiweekly.getTime() - now.getTime() < windowMs) {
        contests.push({
            platform: 'leetcode',
            title: 'Biweekly Contest',
            startTime: tempBiweekly.getTime(),
            link: 'https://leetcode.com/contest/'
        });
        tempBiweekly = new Date(tempBiweekly.getTime() + msPer2Weeks);
    }

    return contests;
}

export const getAllContests = async () => {
    try {
        const [cf, lc, cc] = await Promise.all([
            getCodeforcesContests(),
            getLeetCodeContestsV2(),
            getCodechefContests()
        ]);
        // Combine and sort chronologically
        return [...cf, ...lc, ...cc].sort((a, b) => a.startTime - b.startTime);
    } catch (err) {
        console.error('Contest API Error:', err);
        throw err;
    }
};
