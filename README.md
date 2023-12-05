# @bloombug/maintenance-tasks

Some helpers for running maintenance tasks.

## Getting started

```bash
# for npm
npm install @bloombug/liquidlite
# for yarn
yarn add @bloombug/liquidlite
```

## Usage

```ts
import { PrismaClient } from '@prisma/client';
import {
  MaintenanceRunner,
  MaintenanceTask,
} from '@bloombug/maintenance-tasks';
import { v4 } from 'uuid';
import logger from './logger';

const db = new PrismaClient();

class ExampleTask implements MaintenanceTask {
  constructor() {
    this.id = '5f609566-d722-4f4c-b296-689596a05e2b';
    this.name = 'ExampleTask';
    this.description = 'Iterates over all posts and creates a snapshot';
    this.source = ExampleTask.toString();
  }

  collection() {
    return db.post.findMany();
  }

  async process({ runner, taskRun }, post) {
    await db.snapshot.create({
      data: {
        taskRunId: taskRun.id,
        owner: post.author,
        entity: post.id,
        metadata: JSON.stringify(post),
      },
    });
  }
}

const runner = new MaintenanceRunner({
  generateId: () => v4(),
  logger,
  taskRunCreate: data => db.taskRun.create({ data }),
  taskRunUpdate: data => db.taskRun.update({ where: { id: data.id }, data }),
});
const task = new ExampleTask();

await runner.run(task);
```
