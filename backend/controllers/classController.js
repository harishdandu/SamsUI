import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

export const getAllClasses = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    const classes = await Class.find({ schoolId })
      .sort({ name: 1 });
      
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertClass = async (req, res) => {
  try {
    const { name, sections, subjects, schoolId: bodySchoolId } = req.body;
    const schoolId = bodySchoolId || req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    // Find if class already exists for this school
    let classObj = await Class.findOne({ name, schoolId });

    if (classObj) {
      // Update existing
      classObj.sections = sections;
      classObj.subjects = subjects;
      await classObj.save();
    } else {
      // Create new
      classObj = await Class.create({
        name,
        sections,
        subjects,
        schoolId
      });
    }

    // Populate and return
    const populatedClass = await Class.findById(classObj._id);
    res.status(200).json(populatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkUpsertClasses = async (req, res) => {
  try {
    const { configs, schoolId: bodySchoolId } = req.body;
    const schoolId = bodySchoolId || req.user.schoolId;

    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    const results = [];
    const allSubjectNames = new Set();
    const subjectToClassesMap = {};

    for (const config of configs) {
      const { name, sections, subjects } = config;
      
      const updatedClass = await Class.findOneAndUpdate(
        { name, schoolId },
        { sections, subjects, schoolId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      
      results.push(updatedClass);

      // Collect subject data for syncing
      if (subjects && Array.isArray(subjects)) {
        subjects.forEach(subName => {
          allSubjectNames.add(subName);
          if (!subjectToClassesMap[subName]) {
            subjectToClassesMap[subName] = [];
          }
          subjectToClassesMap[subName].push(name);
        });
      }
    }

    // Sync with Subject collection
    // 1. Get all existing subjects for this school
    const existingSubjects = await Subject.find({ schoolId });
    const existingNames = existingSubjects.map(s => s.name);

    // 2. Update existing and create new subjects
    for (const subName of allSubjectNames) {
      await Subject.findOneAndUpdate(
        { name: subName, schoolId },
        { 
          name: subName, 
          classes: subjectToClassesMap[subName],
          schoolId 
        },
        { upsert: true, new: true }
      );
    }

    // 3. Cleanup: For subjects that exist in DB but are not in this update, 
    // clear their classes array (since this bulk update represents the full institutional structure)
    await Subject.updateMany(
      { 
        schoolId, 
        name: { $nin: Array.from(allSubjectNames) } 
      },
      { $set: { classes: [] } }
    );

    res.status(200).json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Class configuration deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
