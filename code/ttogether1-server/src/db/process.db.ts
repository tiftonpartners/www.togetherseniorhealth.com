/**
 * CURRENTLY NOT IN USE
 *
 * Mongoose Schema, Model and Typescript interface for
 * local information about a User
 *
 * See Schemas for comments describing the objects
 *
 */
require('dotenv').config();
import moment from 'moment';
import mongoose, { Schema } from 'mongoose';
import { AdHocSessionService } from '../service/adhoc-session.service';
import { AdHocSessionType } from './session.db';

export type ProcessStatus = 'active' | 'inactive' | 'completed';
export type ProcessStepType =
    | 'schedule-session'
    | 'conduct-session'
    | 'regular';
export type ProcessStepNameType = 'New' | 'Consent' | 'Tech' | 'Decision';

export interface ProcessBaseStep {
    type: ProcessStepType;
    displayType: string;
    displayName: string;
    name: ProcessStepNameType;
}

export class ProcessService {
    private static processes: Map<string, ProcessBaseStep[]> = new Map([
        [
            'Enrollment',
            [
                {
                    type: 'schedule-session',
                    displayType: 'Schedule Session',
                    name: 'Consent',
                    displayName: 'Schedule Consent Session',
                },
                {
                    type: 'conduct-session',
                    displayType: 'Conduct Session',
                    name: 'Consent',
                    displayName: 'Conduct Consent Session',
                },
                {
                    type: 'schedule-session',
                    displayType: 'Schedule Session',
                    name: 'Tech',
                    displayName: 'Schedule Tech Session',
                },
                {
                    type: 'conduct-session',
                    displayType: 'Conduct Tech Session',
                    name: 'Tech',
                    displayName: 'Conduct Tech Session',
                },
                {
                    type: 'regular',
                    displayType: 'Regular',
                    name: 'Decision',
                    displayName: 'Decision',
                },
            ],
        ],
    ]);
    constructor() {}

    static getFirstStepByProcessName = (
        name: string
    ): ProcessBaseStep | undefined => {
        const steps = ProcessService.processes.get(name);
        return steps ? steps[0] : undefined;
    };

    static getNextStepByProcessName = (
        name: string,
        currentStep: ProcessBaseStep
    ): ProcessBaseStep | 'completed' | undefined => {
        const steps = ProcessService.processes.get(name);

        if (!steps) return undefined;
        const stepIndex = steps.findIndex(
            (step) =>
                step.name === currentStep.name && step.type === currentStep.type
        );

        if (stepIndex > -1) {
            // current step is last step
            if (stepIndex === steps.length - 1) {
                return 'completed';
            }
            return steps[stepIndex + 1];
        }

        return undefined;
    };
}

export interface ProcessStep<T = {}> extends mongoose.Document {
    type: ProcessStepType;
    displayType: string;
    name: ProcessStepNameType;
    displayName: string;
    data?: T;
    startDate?: Date;
    tz?: string;
    sessionAcronym?: string;
    createdOn?: Date;
    completedOn?: Date;
}

export const ProcessStepSchema = new Schema<ProcessStep>({
    type: {
        type: String,
        enum: ['schedule-session', 'conduct-session', 'regular'],
    },
    displayType: String,
    name: {
        type: String,
        enum: ['New', 'Consent', 'Tech', 'Decision'],
    },
    displayName: String,
    startDate: Date,
    tz: String,
    sessionAcronym: String,
    data: mongoose.SchemaTypes.Mixed,
    createdOn: { type: Date, default: Date.now },
    completedOn: Date,
});

export const ProcessStepModel = mongoose.model<ProcessStep>(
    'processStep',
    ProcessStepSchema
);

export interface Process extends mongoose.Document {
    name: string;
    status: ProcessStatus;
    currentStep?: ProcessStep;
    completedSteps: ProcessStep[];

    completeProcessStep: <T = {}>(
        processName: string,
        data: T,
        scheduleParams?: ScheduleParams
    ) => Promise<void>;

    rescheduleProcessStep: <T = {}>(
        scheduleParams: ScheduleParams
    ) => Promise<void>;
}

export const ProcessSchema = new Schema<Process>({
    name: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
    },
    completedSteps: { type: Array, of: ProcessStepSchema, default: [] },
    currentStep: { type: ProcessStepSchema, default: () => ({}) },
});

export interface ScheduleParams {
    instructorId: string;
    participantIds: string[];
    startDate: string;
    tz: string;
}
/**
 * Sets the current step to the next one in the process. Moves current step to
 * completed steps array with any additional data or the step
 */
ProcessSchema.methods.completeProcessStep = async function <T = {}>(
    processName: string,
    data?: T,
    scheduleParams?: ScheduleParams
) {
    const process = this as Partial<Process>;
    const step = process.currentStep;

    if (process.status === 'completed') {
        throw 'Process has already been completed';
    }

    if (!step) {
        throw 'No current step';
    }
    // if current step state is to schedule, then a date must be provided
    if (step.type === 'schedule-session' && !scheduleParams) {
        throw 'Current step is to schedule a session and must include sceduling params';
    }

    if (data) {
        step.data = data;
    }

    step.completedOn = new Date();
    process.completedSteps?.push(step);

    const nextStep = ProcessService.getNextStepByProcessName(processName, step);

    if (nextStep) {
        if (nextStep === 'completed') {
            process.status = 'completed';
            process.currentStep = undefined;
        } else {
            const nextStepModel = new ProcessStepModel(nextStep);

            // if we are completing a schedule session step
            // then schedule the session in the AV platform
            if (step.type === 'schedule-session' && scheduleParams) {
                const roundedStartDate =
                    Math.ceil(moment(scheduleParams.startDate).minute() / 15) *
                    15;
                // TODO: will need updated if using process again
                const session = await AdHocSessionService.scheduleSession(
                    `${step.displayType} with `,
                    AdHocSessionType.ResearchInformation,
                    moment(scheduleParams.startDate)
                        .minute(roundedStartDate)
                        .second(0),
                    scheduleParams.tz || '',
                    60, // need to allow choosing
                    scheduleParams.instructorId,
                    scheduleParams.participantIds
                );

                // make sure start date is updated to reflect session
                nextStepModel.startDate = session.scheduledStartTime;
                nextStepModel.tz = session.tz;
                nextStepModel.sessionAcronym = session.acronym;
            }

            process.currentStep = nextStepModel;
        }
    }
};

/**
 * Sets the current step to the next one in the process. Moves current step to
 * completed steps array with any additional data or the step
 */
ProcessSchema.methods.rescheduleProcessStep = async function <T = {}>(
    scheduleParams: Partial<ScheduleParams>
) {
    const process = this as Partial<Process>;
    const step = process.currentStep;

    if (process.status === 'completed') {
        throw 'Process has already been completed';
    }

    if (!step) {
        throw 'No current step';
    }
    // if current step state is to conduct, then it cannot be rescheduled
    if (step.type !== 'conduct-session') {
        throw 'Current step is not one that can be rescheduled';
    }

    if (scheduleParams) {
        const roundedStartDate =
            Math.ceil(moment(scheduleParams.startDate).minute() / 15) * 15;
        // const session = await AdHocSessionService.rescheduleSession(
        //     step.sessionAcronym as string,
        //     moment(scheduleParams.startDate).minute(roundedStartDate).second(0)
        // );

        //step.startDate = session?.scheduledStartTime;
    }
};

export const ProcessModel = mongoose.model<Process>('process', ProcessSchema);
