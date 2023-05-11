const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index');
const ScheduleModel = require('../models/schedule.model');

const add = async (req, res) => {
    const schedule = await ScheduleModel.create(req.body);
    res.status(StatusCodes.CREATED).json({ message: 'New schedule added', payload: schedule });
}

const list = async (req, res) => {
    const schedules = await ScheduleModel.find();
    res.status(StatusCodes.OK).json({ nbHits: schedules.length, schedules })
}

const findById = async (req, res) => {
    const schedule = await ScheduleModel.findById(req.query.id);
    if(!schedule){
        throw new BadRequestError(`No schedule found!`)
    }
    res.status(StatusCodes.OK).json({ schedule })
}

const findByPostDate = async (req, res) => {
    const schedule = await ScheduleModel.find({ postDate: req.query.postDate });
    if(!schedule){
        throw new BadRequestError(`No schedule was posted on this date!`)
    }
    res.status(StatusCodes.OK).json({ schedule })    
}

const edit = async (req, res) => {
    const schedule = await ScheduleModel.findByIdAndUpdate({ _id: req.query.id }, req.body);
    const updatedSchedule = await ScheduleModel.findById(schedule._id);

    if (!updatedSchedule) {
        throw new NotFoundError(`Schedule not updated!`);
    }

    res.status(StatusCodes.OK).json({ message: 'Schedule updated', payload: updatedSchedule});
}

module.exports = {
    list,
    add, 
    findById, 
    findByPostDate,
    edit,
}