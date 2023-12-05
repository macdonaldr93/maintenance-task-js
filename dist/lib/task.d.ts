import { MaintenanceRunner } from './runner';
import { TaskRun } from './task-run';
export interface MaintenanceTaskDeps<Entity = any> {
    runner: MaintenanceRunner<Entity>;
    taskRun: TaskRun;
}
export interface MaintenanceTask<Entity = any> {
    /**
     * The unique identifier for the task
     * @link [Generate UUID](https://www.uuidgenerator.net/version4)
     */
    id: string;
    /**
     * The name of the task
     */
    name: string;
    /**
     * The description of the task and affected entities
     */
    description: string;
    /**
     * The string output of the file's source
     *
     * Use `Class.toString()` to build the source
     */
    source: string;
    /**
     * Collect all entities to be processed
     */
    collection(deps: MaintenanceTaskDeps<Entity>): Promise<Entity[]>;
    /**
     * Process one entity at a time
     */
    process(deps: MaintenanceTaskDeps<Entity>, item: Entity): Promise<void>;
}
