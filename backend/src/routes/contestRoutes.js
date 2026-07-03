import express from 'express';
import { getAllContests } from '../services/contestService.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const contests = await getAllContests();
        res.json(contests);
    } catch (err) {
        console.error('Contest API Error:', err);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

export default router;
