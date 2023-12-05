import { Logger } from './logger';
import { Status } from './status';
import { MaintenanceTask } from './task';
import { TaskRun } from './task-run';
export interface TaskRunCreateInput {
    startedAt: Date;
    status: Status;
    taskName: string;
}
export type TaskRunCreateFn = (input: TaskRunCreateInput) => Promise<TaskRun>;
export type TaskRunUpdateFn = (input: TaskRun) => Promise<void>;
export type GenerateIdFn = () => string;
export interface MaintenanceRunnerOptions {
    generateId: GenerateIdFn;
    logger?: Logger;
    taskRunCreate: TaskRunCreateFn;
    taskRunUpdate: TaskRunUpdateFn;
}
export declare class MaintenanceRunner<Entity = any> {
    id: string;
    itemCursor: number;
    itemProgress: number;
    itemSize: number;
    logger?: Logger;
    startTime?: [number, number];
    status?: Status;
    taskRunCreate: TaskRunCreateFn;
    taskRunUpdate: TaskRunUpdateFn;
    get timeRunning(): number;
    constructor({ generateId, logger, taskRunCreate, taskRunUpdate, }: MaintenanceRunnerOptions);
    run(task: MaintenanceTask<Entity>): Promise<TaskRun>;
    private enqueue;
    private process;
    private complete;
    private fail;
    private buildErrorAttributes;
}
