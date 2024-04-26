import type {
  IGameObject,
  IGameObjectDirection,
  IGameObjectState,
} from "../../../../../packages/api-sdk/src";
import { sendMessage } from "../../websocket/websocket.server";

interface IGameObjectOptions {
  id: string;
  x: number;
  y: number;
  entity: IGameObject["entity"];
  isVisibleOnClient?: boolean;
}

export class GameObject implements IGameObject {
  public id: string;
  public x: number;
  public y: number;
  public health = 100;
  public isVisibleOnClient: boolean;

  public entity: IGameObject["entity"];
  public direction: IGameObjectDirection = "RIGHT";
  public state: IGameObjectState = "IDLE";

  public target: IGameObject | undefined;

  constructor({ id, x, y, entity, isVisibleOnClient }: IGameObjectOptions) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.entity = entity;
    this.isVisibleOnClient = isVisibleOnClient ?? false;
  }

  live(): void {}

  move(speed: number, minDistance?: number) {
    const isOnTarget = this.checkIfIsOnTarget(minDistance);
    if (isOnTarget) {
      this.stop();
      return false;
    }

    if (!this.target || !this.target.x || !this.target.y) {
      this.stop();
      return false;
    }

    const distanceToX = this.getDistanceToTargetX();
    const distanceToY = this.getDistanceToTargetY();

    // Fix diagonal speed
    const finalSpeed =
      distanceToX > 0 && distanceToY > 0 ? speed * 0.75 : speed;

    this.moveX(finalSpeed > distanceToX ? distanceToX : finalSpeed);
    this.moveY(finalSpeed > distanceToY ? distanceToY : finalSpeed);
    return true;
  }

  moveX(speed: number) {
    if (!this.target?.x || this.target.x === this.x) {
      return;
    }

    if (this.x < this.target.x) {
      this.direction = "RIGHT";
      this.x += speed;
    }
    if (this.x > this.target.x) {
      this.x -= speed;
      this.direction = "LEFT";
    }
  }

  moveY(speed: number) {
    if (!this.target?.y || this.target.y === this.y) {
      return;
    }

    if (this.y < this.target.y) {
      this.y += speed;
    }
    if (this.y > this.target.y) {
      this.y -= speed;
    }
  }

  stop() {
    this.state = "IDLE";
  }

  checkIfIsOnTarget(minDistance = 1) {
    return (
      this.getDistanceToTargetX() + this.getDistanceToTargetY() <= minDistance
    );
  }

  getDistanceToTargetX() {
    if (!this.target?.x) {
      return 0;
    }
    return Math.abs(this.target.x - this.x);
  }

  getDistanceToTargetY() {
    if (!this.target?.y) {
      return 0;
    }
    return Math.abs(this.target.y - this.y);
  }

  public setTarget(target: IGameObject) {
    this.target = target;
    this.state = "MOVING";
  }

  public sendMessageObjectUpdated(object: Partial<IGameObject> = this) {
    if (!this.isVisibleOnClient) {
      return; // No need to send message
    }
    sendMessage("OBJECT_UPDATED", object);
  }
}