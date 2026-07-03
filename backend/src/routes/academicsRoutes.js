import express from 'express';
import {
  getSemesters,
  getSemesterById,
  getCourses,
  getAcademicStats,
} from '../services/academicsService.js';

const router = express.Router();

// GET /api/academics/semesters — fetch all semesters
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await getSemesters();
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

// GET /api/academics/semesters/:id — fetch a single semester with courses
router.get('/semesters/:id', async (req, res) => {
  try {
    const semester = await getSemesterById(req.params.id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    res.json(semester);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch semester' });
  }
});

// GET /api/academics/courses — fetch all courses across semesters
router.get('/courses', async (req, res) => {
  try {
    const courses = await getCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/academics/stats — fetch aggregated academic statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAcademicStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic stats' });
  }
});

export default router;
