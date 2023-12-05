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

export class MaintenanceRunner<Entity = any> {
  id: string;
  itemCursor: number;
  itemProgress: number;
  itemSize: number;
  logger?: Logger;
  startTime?: [number, number];
  status?: Status;
  taskRunCreate: TaskRunCreateFn;
  taskRunUpdate: TaskRunUpdateFn;

  get timeRunning() {
    if (!this.startTime) {
      return 0;
    }

    const endTime = process.hrtime(this.startTime);
    return endTime[0] * 1000 + endTime[1] / 1000000;
  }

  constructor({
    generateId,
    logger,
    taskRunCreate,
    taskRunUpdate,
  }: MaintenanceRunnerOptions) {
    this.id = generateId();
    this.itemCursor = 0;
    this.itemProgress = 0;
    this.itemSize = 0;
    this.logger = logger;
    this.taskRunCreate = taskRunCreate;
    this.taskRunUpdate = taskRunUpdate;
  }

  async run(task: MaintenanceTask<Entity>): Promise<TaskRun> {
    const taskRun = await this.enqueue(task);
    this.startTime = process.hrtime();
    taskRun.status = 'running';

    this.logger?.info(`${task.name} running...`);

    const items = await task.collection({ runner: this, taskRun });
    this.itemSize = items.length;

    this.logger?.info(`${task.name} collected ${items.length} records`);

    try {
      await this.taskRunUpdate(taskRun);
      await this.process(task, taskRun, items);
      await this.complete(task, taskRun);
    } catch (err) {
      await this.fail(task, taskRun, err);
    }

    return taskRun;
  }

  private async enqueue(task: MaintenanceTask<Entity>) {
    this.logger?.info(`${task.name} enqueuing...`);

    return this.taskRunCreate({
      startedAt: new Date(),
      status: 'enqueued',
      taskName: task.name,
    });
  }

  private async process(
    task: MaintenanceTask<Entity>,
    taskRun: TaskRun,
    items: Entity[],
  ) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.itemCursor = i + 1;

      await task.process({ runner: this, taskRun }, item);

      taskRun.timeRunning = this.timeRunning;
      this.itemProgress = Math.floor(this.itemCursor / this.itemSize) * 100;

      this.logger?.info(
        `${task.name} processed ${this.itemCursor}/${this.itemSize} records`,
      );
    }

    return this;
  }

  private async complete(task: MaintenanceTask<Entity>, taskRun: TaskRun) {
    this.logger?.info(`${task.name} completed in ${this.timeRunning}ms`);

    taskRun.endedAt = new Date();
    taskRun.status = 'succeeded';
    taskRun.timeRunning = this.timeRunning;

    await this.taskRunUpdate(taskRun);
  }

  private async fail(
    task: MaintenanceTask<Entity>,
    taskRun: TaskRun,
    err: unknown,
  ) {
    this.logger?.error(`${task.name} failed`, {
      err,
    });
    const errorAttrs = this.buildErrorAttributes(err);

    taskRun.errorMessage = errorAttrs.errorMessage;
    taskRun.errorName = errorAttrs.errorName;
    taskRun.errorStack = errorAttrs.errorStack;
    taskRun.endedAt = new Date();
    taskRun.status = 'failed';
    taskRun.timeRunning = this.timeRunning;

    await this.taskRunUpdate(taskRun);
  }

  private buildErrorAttributes(err: unknown) {
    if (typeof err === 'object') {
      const errorMessage = (err as any)?.message ?? null;
      const errorName = (err as any)?.name ?? null;
      const errorStack = (err as any)?.stack ?? null;

      return { errorMessage, errorName, errorStack };
    } else {
      return {};
    }
  }
}
