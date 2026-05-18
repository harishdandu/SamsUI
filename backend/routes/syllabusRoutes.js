import express from 'express';
import { uploadSyllabus, getSyllabusByClass, updateSyllabus, createSyllabus, getMySyllabuses } from '../controllers/syllabusController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for PDF upload in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word files are allowed!'), false);
    }
  }
});

// Protect all syllabus routes and allow access to Teachers and Admins
router.use(protect);
router.use(restrictTo('Teacher', 'Admin', 'Super Admin'));

router.get('/my-syllabuses', getMySyllabuses);
router.post('/upload', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 10MB limit.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadSyllabus);
router.post('/', createSyllabus);
router.get('/:classId', getSyllabusByClass);
router.put('/:id', updateSyllabus);

export default router;
