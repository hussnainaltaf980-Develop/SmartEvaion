const InterviewTemplate = require('../models/interviewTemplate.js');

exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await InterviewTemplate.findAll();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const newTemplate = await InterviewTemplate.create(req.body);
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const success = await InterviewTemplate.delete(req.params.id);
        if (success) {
            res.json({ success: true, message: 'Template deleted' });
        } else {
            res.status(404).json({ success: false, message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};