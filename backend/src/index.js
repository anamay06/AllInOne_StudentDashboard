import express from 'express';
import cors from 'cors';
import contestRoutes from './routes/contestRoutes.js';

import statsRoutes from './routes/statsRoutes.js';
import internshipRoutes from './routes/internshipRoutes.js';

import googleAuthRoutes from './routes/googleAuth.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/contests', contestRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/google', googleAuthRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Backend server strictly monitoring contests on port ${PORT}`);
});
