"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRunner = void 0;
class MaintenanceRunner {
    id;
    itemCursor;
    itemProgress;
    itemSize;
    logger;
    startTime;
    status;
    taskRunCreate;
    taskRunUpdate;
    get timeRunning() {
        if (!this.startTime) {
            return 0;
        }
        const endTime = process.hrtime(this.startTime);
        return endTime[0] * 1000 + endTime[1] / 1000000;
    }
    constructor({ generateId, logger, taskRunCreate, taskRunUpdate, }) {
        this.id = generateId();
        this.itemCursor = 0;
        this.itemProgress = 0;
        this.itemSize = 0;
        this.logger = logger;
        this.taskRunCreate = taskRunCreate;
        this.taskRunUpdate = taskRunUpdate;
    }
    async run(task) {
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
        }
        catch (err) {
            await this.fail(task, taskRun, err);
        }
        return taskRun;
    }
    async enqueue(task) {
        this.logger?.info(`${task.name} enqueuing...`);
        return this.taskRunCreate({
            startedAt: new Date(),
            status: 'enqueued',
            taskName: task.name,
        });
    }
    async process(task, taskRun, items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            this.itemCursor = i + 1;
            await task.process({ runner: this, taskRun }, item);
            taskRun.timeRunning = this.timeRunning;
            this.itemProgress = Math.floor(this.itemCursor / this.itemSize) * 100;
            this.logger?.info(`${task.name} processed ${this.itemCursor}/${this.itemSize} records`);
        }
        return this;
    }
    async complete(task, taskRun) {
        this.logger?.info(`${task.name} completed in ${this.timeRunning}ms`);
        taskRun.endedAt = new Date();
        taskRun.status = 'succeeded';
        taskRun.timeRunning = this.timeRunning;
        await this.taskRunUpdate(taskRun);
    }
    async fail(task, taskRun, err) {
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
    buildErrorAttributes(err) {
        if (typeof err === 'object') {
            const errorMessage = err?.message ?? null;
            const errorName = err?.name ?? null;
            const errorStack = err?.stack ?? null;
            return { errorMessage, errorName, errorStack };
        }
        else {
            return {};
        }
    }
}
exports.MaintenanceRunner = MaintenanceRunner;
//# sourceMappingURL=runner.js.map