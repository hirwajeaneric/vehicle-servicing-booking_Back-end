const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors/index');
const ScheduleModel = require('../models/schedule.model');
const newScheduleTemplate = require('../utils/data/scheduleTemplate.json');

const add = async (req, res) => {
    // Check to make sure the schedule is for the next day
    let newScheduleDate = new Date(Date.now());
    // Find all existing schedules
    const existingSchedules = await ScheduleModel.find();
    // Generate the next days date
    var nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    // Checking to make sure that there are no schedules with the same date.
    let existTodaysSchedule = false;
    let existTomorrowsSchedule = false;
    existingSchedules.forEach((schedule) => {
        if (schedule.postDate.getDate() === newScheduleDate.getDate()) {
            existTodaysSchedule = true;
        } else if (schedule.postDate.getDate() === nextDay.getDate()) {
            existTomorrowsSchedule = true;
        }
    });

    if (existTodaysSchedule && !existTomorrowsSchedule) {
        var schedule = await ScheduleModel.create(newScheduleTemplate);
        schedule = await ScheduleModel.findByIdAndUpdate({ _id: schedule._id }, { postDate: nextDay });
    } else if (!existTodaysSchedule) {
        var schedule = await ScheduleModel.create(newScheduleTemplate);
    } else if (existTomorrowsSchedule) {
       throw new BadRequestError('Sorry, you can not create a schedule for three consecutive days.');
    }

    const createdSchedule = await ScheduleModel.findById(schedule._id);

    res.status(StatusCodes.CREATED).json({ message: 'New schedule added', payload: createdSchedule });
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