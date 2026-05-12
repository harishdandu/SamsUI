import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

export const getAllClasses = async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required.' });
    }

    const classes = await Class.find({ schoolId })
      .populate('subjects')
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
    const populatedClass = await Class.findById(classObj._id).populate('subjects');
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
    for (const config of configs) {
      const { name, sections, subjects } = config;
      
      const updatedClass = await Class.findOneAndUpdate(
        { name, schoolId },
        { sections, subjects, schoolId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate('subjects');
      
      results.push(updatedClass);
    }

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
