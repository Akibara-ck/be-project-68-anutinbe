const Interview = require('../models/Interview');
const Company = require('../models/Company');

exports.getInterviews = async (req, res, next) => {
    let query;

    if (req.user.role !== 'admin') {
        query = Interview.find({ user: req.user.id }).populate({
            path: 'company',
            select: 'name description telephone'
        });
    } else {
        if (req.params.companyId) {
            query = Interview.find({ company: req.params.companyId }).populate({
                path: 'company',
                select: 'name description telephone'
            });
        } else {
            query = Interview.find().populate({
                path: 'company',
                select: 'name description telephone'
            });
        }
    }

    try {
        const interviews = await query;
        res.status(200).json({
            success: true,
            count: interviews.length,
            data: interviews
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Cannot find Interview"
        });
    }
};

exports.getInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id).populate({
            path: 'company',
            select: 'name description telephone'
        });

        if (!interview) {
            return res.status(400).json({
                success: false,
                message: `No interview with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot find Interview"
        });
    }
};

exports.addInterview = async (req, res, next) => {
    try {
        req.body.company = req.params.companyId;

        const company = await Company.findById(req.params.companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: `No company with the id of ${req.params.companyId}`
            });
        }

        req.body.user = req.user.id;

        const existedInterviews = await Interview.find({ user: req.user.id });

        if (existedInterviews.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 interviews`
            });
        }

        const interview = await Interview.create(req.body);

        res.status(200).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot create Interview"
        });
    }
};

exports.updateInterview = async (req, res, next) => {
    try {
        let interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: `No interview with the id of ${req.params.id}`
            });
        }

        if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this interview`
            });
        }

        interview = await Interview.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot update Interview"
        });
    }
};

exports.deleteInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id);
        
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: `No interview with the id of ${req.params.id}`
            });
        }
        
        if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        await interview.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot delete Interview"
        });
    }
};