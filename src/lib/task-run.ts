import { Status } from './status';

/**
 * A record of each maintenance task run.
 *
 * You can use this record to store additional data to debug,
 * or track for each run.
 */
export interface TaskRun {
  /**
   * The date the run was created
   */
  createdAt: Date;
  /**
   * The date the run finished at
   */
  endedAt: Date | null;
  /**
   * If the run failed, the associated error message
   */
  errorMessage: string | null;
  /**
   * If the run failed, the associated error name
   */
  errorName: string | null;
  /**
   * If the run failed, the associated error stack
   */
  errorStack: string | null;
  /**
   * The id of the run
   */
  id: string;
  /**
   * Any additional metadata about the run
   */
  metadata: string | null;
  /**
   * The date the run started at
   */
  startedAt: Date | null;
  /**
   * The status of the run
   */
  status: Status;
  /**
   * The name of the task that was ran
   */
  taskName: string;
  /**
   * The milliseconds it took to run the task
   */
  timeRunning: number | null;
  /**
   * The date the run was last updated at
   */
  updatedAt: Date;
}
