import { createId } from "@paralleldrive/cuid2"
import type {
  IGameObject,
  IGameScript,
  IGameTask,
} from "../../../../../packages/api-sdk/src"
import type { GameObject } from "../objects"

interface IScriptOptions {
  object: GameObject
}

export class Script implements IGameScript {
  public id: string
  public tasks!: IGameScript["tasks"]

  public object!: GameObject

  constructor({ object }: IScriptOptions) {
    this.id = createId()
    this.object = object
  }

  live() {
    const activeTask = this.getActiveTask()
    if (!activeTask) {
      const nextTask = this.getNextIdleTask()
      if (!nextTask) {
        return this.markScriptAsFinished()
      }

      return this.markTaskAsActive(nextTask)
    }

    return activeTask.live()
  }

  getActiveTask() {
    return this.tasks.find((t) => t.status === "ACTIVE")
  }

  getNextIdleTask() {
    return this.tasks.find((t) => t.status === "IDLE")
  }

  markTaskAsActive(task: IGameTask) {
    task.status = "ACTIVE"
  }

  markTaskAsDone() {
    const activeTask = this.getActiveTask()
    if (!activeTask) {
      return
    }

    activeTask.status = "DONE"
  }

  markScriptAsFinished() {
    this.object.script = undefined
  }

  setTarget(target: IGameObject): IGameTask {
    return {
      id: createId(),
      status: "IDLE",
      live: () => {
        this.object.target = target
        this.object.state = "MOVING"
        this.markTaskAsDone()
      },
    }
  }

  runToTarget(): IGameTask {
    return {
      id: createId(),
      status: "IDLE",
      live: () => {
        const isMoving = this.object.move()
        if (!isMoving) {
          this.markTaskAsDone()
        }
      },
    }
  }
}