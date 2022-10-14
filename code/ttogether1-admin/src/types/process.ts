export type ProcessStatus = 'active' | 'inactive' | 'completed';
export type ProcessStepType =
    | 'schedule-session'
    | 'conduct-session'
    | 'regular';
export type ProcessStepNameType = 'New' | 'Consent' | 'Tech' | 'Decision';

export interface IProcessStep<T = {}> {
    type: ProcessStepType;
    displayType: string;
    name: ProcessStepNameType;
    displayName: string;
    data?: T;
    startDate?: string;
    tz?: string;
    sessionAcronym?: string;
    createdOn?: string;
    completedOn?: string;
}

export interface IProcess {
    name: string;
    status: ProcessStatus;
    currentStep?: IProcessStep;
    completedSteps: IProcessStep[];
}
