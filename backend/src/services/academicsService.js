// ============================================
// ACADEMICS SERVICE
// Branch: academics
// New file — no merge conflicts with main
// ============================================

// Sample data — replace with database queries when ready
const semesterData = [
  {
    id: 1,
    name: 'Semester 1',
    shortName: 'S1',
    gpa: 8.5,
    totalCredits: 24,
    courses: [
      { code: 'CS101', name: 'Introduction to Programming', credits: 4, grade: 'A', attendance: 92 },
      { code: 'MA101', name: 'Engineering Mathematics I', credits: 4, grade: 'A', attendance: 88 },
      { code: 'PH101', name: 'Engineering Physics', credits: 3, grade: 'B', attendance: 85 },
      { code: 'EE101', name: 'Basic Electrical Engineering', credits: 3, grade: 'A', attendance: 90 },
      { code: 'ME101', name: 'Engineering Graphics', credits: 3, grade: 'B', attendance: 78 },
      { code: 'HS101', name: 'English Communication', credits: 3, grade: 'A', attendance: 95 },
      { code: 'CS102', name: 'Computer Workshop', credits: 4, grade: 'A', attendance: 96 },
    ],
  },
  {
    id: 2,
    name: 'Semester 2',
    shortName: 'S2',
    gpa: 8.8,
    totalCredits: 24,
    courses: [
      { code: 'CS201', name: 'Data Structures', credits: 4, grade: 'A', attendance: 94 },
      { code: 'MA201', name: 'Engineering Mathematics II', credits: 4, grade: 'A', attendance: 90 },
      { code: 'CH201', name: 'Engineering Chemistry', credits: 3, grade: 'B', attendance: 82 },
      { code: 'EC201', name: 'Digital Electronics', credits: 3, grade: 'A', attendance: 88 },
      { code: 'ME201', name: 'Engineering Mechanics', credits: 3, grade: 'B', attendance: 80 },
      { code: 'HS201', name: 'Organizational Behaviour', credits: 3, grade: 'A', attendance: 91 },
      { code: 'CS202', name: 'OOP with Java', credits: 4, grade: 'A', attendance: 93 },
    ],
  },
  {
    id: 3,
    name: 'Semester 3',
    shortName: 'S3',
    gpa: 9.1,
    totalCredits: 22,
    courses: [
      { code: 'CS301', name: 'Algorithms Design', credits: 4, grade: 'A', attendance: 96 },
      { code: 'CS302', name: 'Database Management Systems', credits: 4, grade: 'A', attendance: 92 },
      { code: 'CS303', name: 'Operating Systems', credits: 4, grade: 'A', attendance: 89 },
      { code: 'MA301', name: 'Discrete Mathematics', credits: 3, grade: 'A', attendance: 87 },
      { code: 'CS304', name: 'Computer Architecture', credits: 4, grade: 'B', attendance: 84 },
      { code: 'HS301', name: 'Economics for Engineers', credits: 3, grade: 'A', attendance: 90 },
    ],
  },
  {
    id: 4,
    name: 'Semester 4',
    shortName: 'S4',
    gpa: 9.3,
    totalCredits: 22,
    courses: [
      { code: 'CS401', name: 'Machine Learning', credits: 4, grade: 'A', attendance: 95 },
      { code: 'CS402', name: 'Computer Networks', credits: 4, grade: 'A', attendance: 91 },
      { code: 'CS403', name: 'Software Engineering', credits: 3, grade: 'A', attendance: 93 },
      { code: 'CS404', name: 'Theory of Computation', credits: 3, grade: 'A', attendance: 88 },
      { code: 'MA401', name: 'Probability & Statistics', credits: 4, grade: 'A', attendance: 90 },
      { code: 'CS405', name: 'Web Technologies', credits: 4, grade: 'A', attendance: 97 },
    ],
  },
  {
    id: 5,
    name: 'Semester 5',
    shortName: 'S5',
    gpa: 9.0,
    totalCredits: 20,
    courses: [
      { code: 'CS501', name: 'Artificial Intelligence', credits: 4, grade: 'A', attendance: 93 },
      { code: 'CS502', name: 'Cloud Computing', credits: 4, grade: 'A', attendance: 90 },
      { code: 'CS503', name: 'Compiler Design', credits: 3, grade: 'B', attendance: 86 },
      { code: 'CS504', name: 'Information Security', credits: 3, grade: 'A', attendance: 92 },
      { code: 'CS505', name: 'Data Mining', credits: 3, grade: 'A', attendance: 89 },
      { code: 'OE501', name: 'Open Elective I', credits: 3, grade: 'A', attendance: 94 },
    ],
  },
  {
    id: 6,
    name: 'Semester 6',
    shortName: 'S6',
    gpa: 9.5,
    totalCredits: 20,
    courses: [
      { code: 'CS601', name: 'Deep Learning', credits: 4, grade: 'A', attendance: 97 },
      { code: 'CS602', name: 'Distributed Systems', credits: 4, grade: 'A', attendance: 94 },
      { code: 'CS603', name: 'Natural Language Processing', credits: 3, grade: 'A', attendance: 96 },
      { code: 'CS604', name: 'Blockchain Technology', credits: 3, grade: 'A', attendance: 91 },
      { code: 'CS605', name: 'Big Data Analytics', credits: 3, grade: 'A', attendance: 93 },
      { code: 'OE601', name: 'Open Elective II', credits: 3, grade: 'A', attendance: 95 },
    ],
  },
];

export async function getSemesters() {
  return semesterData.map(({ courses, ...rest }) => rest);
}

export async function getSemesterById(id) {
  return semesterData.find((s) => s.id === parseInt(id, 10)) || null;
}

export async function getCourses() {
  return semesterData.flatMap((s) =>
    s.courses.map((c) => ({ ...c, semesterId: s.id, semesterName: s.name }))
  );
}

export async function getAcademicStats() {
  const totalCredits = semesterData.reduce((sum, s) => sum + s.totalCredits, 0);
  const totalCourses = semesterData.reduce((sum, s) => sum + s.courses.length, 0);
  const allCourses = semesterData.flatMap((s) => s.courses);
  const overallAttendance =
    allCourses.length > 0
      ? Math.round(allCourses.reduce((sum, c) => sum + c.attendance, 0) / allCourses.length)
      : 0;

  let weightedSum = 0;
  let creditSum = 0;
  semesterData.forEach((s) => {
    weightedSum += s.gpa * s.totalCredits;
    creditSum += s.totalCredits;
  });
  const cgpa = creditSum > 0 ? (weightedSum / creditSum).toFixed(2) : '0.00';

  return {
    cgpa,
    totalCredits,
    totalCourses,
    totalSemesters: semesterData.length,
    overallAttendance,
  };
}
