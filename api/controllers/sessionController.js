const InterviewSession = require('../models/interviewSession');

exports.getAllSessions = async (req, res) => {
    try {
        const allSessions = await InterviewSession.findAll();
        // Filter sessions for non-admin users
        if (req.user.role === 'candidate') {
            const userSessions = allSessions.filter(s => s.userId === req.user.id);
            return res.json(userSessions);
        }
        res.json(allSessions);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createSession = async (req, res) => {
    try {
        const newSession = await InterviewSession.create(req.body);
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.completeSession = async (req, res) => {
    try {
        const session = await InterviewSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        const updateData = {
            ...req.body,
            completedAt: new Date().toISOString()
        };
        
        const updatedSession = await InterviewSession.update(req.params.id, updateData);
        res.json({ success: true, message: 'Session completed', session: updatedSession });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSessionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updatedSession = await InterviewSession.update(req.params.id, { status });
        if (!updatedSession) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, message: 'Status updated', session: updatedSession });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
