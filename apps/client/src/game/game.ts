import { Container } from "pixi.js";
import type {
  IGameObject,
  IGameObjectBuilding,
  IGameObjectCourier,
  IGameObjectFarmer,
  IGameObjectFlag,
  IGameObjectPlayer,
  IGameObjectRabbit,
  IGameObjectRaider,
  IGameObjectStone,
  IGameObjectTree,
  IGameObjectWagon,
  IGameObjectWolf,
  WebSocketMessage,
} from "../../../../packages/api-sdk/src";
import {
  Building,
  Courier,
  Farmer,
  Flag,
  type GameObjectContainer,
  Player,
  Rabbit,
  Raider,
  Stone,
  Tree,
  Wolf,
} from "./objects";
import { Wagon } from "./objects/wagon.ts";
import {
  AssetsManager,
  AudioManager,
  SceneManager,
  WebSocketManager,
} from "./utils";

export interface GameOptions {
  viewWidth: number;
  viewHeight: number;
}

export class Game extends Container {
  public children: GameObjectContainer[] = [];
  public audio: AudioManager;
  public scene: SceneManager;

  public viewWidth: number;
  public viewHeight: number;

  public cameraOffsetX = 0;
  public cameraMovementSpeedX = 0.005;
  public cameraOffsetY = 0;
  public cameraMovementSpeedY = 0.005;
  public cameraX = 0;
  public cameraY = 0;
  public cameraPerfectX = 0;
  public cameraPerfectY = 0;

  constructor(options: GameOptions) {
    super();

    this.viewWidth = options.viewWidth;
    this.viewHeight = options.viewHeight;

    this.audio = new AudioManager();
    this.scene = new SceneManager();
  }

  async play() {
    await AssetsManager.init();

    this.audio.playBackgroundSound();

    // const bg = AssetsManager.generateSceneBackground({
    //   width: this.viewWidth,
    //   height: this.viewHeight,
    // });
    // this.scene.app.stage.addChild(...bg);

    const bg = AssetsManager.getGeneratedBackground();
    bg.x = -10000;
    bg.y = -10000;
    bg.width = 50000;
    bg.height = 50000;
    this.scene.app.stage.addChild(bg);

    this.scene.app.stage.addChild(this);

    this.scene.app.ticker.add(() => {
      this.animateObjects();

      const wagon = this.children.find((child) => child instanceof Wagon);
      if (wagon) {
        this.moveCameraToWagon(wagon as Wagon);
      }
    });

    WebSocketManager.init(this);

    setInterval(() => {
      console.log("FPS", this.scene.app.ticker.FPS);
      console.log("Objects", this.children.length);
    }, 1000);
  }

  async saveScreenshot(imageName = "untitled") {
    const blob = await this.scene.app.renderer.extract.image(
      this.scene.app.stage,
    );

    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);
    link.setAttribute("download", `${imageName}.png`);
    link.setAttribute(
      "href",
      blob.src.replace("image/png", "image/octet-stream"),
    );
    link.click();
  }

  moveCameraToWagon(wagon: Wagon) {
    const columnWidth = this.scene.app.screen.width / 6;
    const leftPadding =
      wagon.direction === "LEFT" ? columnWidth * 5 : columnWidth * 2;

    const topPadding = this.scene.app.screen.height / 2;

    this.cameraPerfectX = -wagon.x + this.cameraOffsetX + leftPadding;
    this.cameraPerfectY = -wagon.y + this.cameraOffsetY + topPadding;

    this.cameraX = this.cameraPerfectX;
    this.cameraY = this.cameraPerfectY;

    if (Math.abs(this.cameraOffsetX) >= 20) {
      this.cameraMovementSpeedX *= -1;
    }
    this.cameraOffsetX += this.cameraMovementSpeedX;

    if (Math.abs(this.cameraOffsetY) >= 30) {
      this.cameraMovementSpeedY *= -1;
    }
    this.cameraOffsetY += this.cameraMovementSpeedY;

    this.parent.x = this.cameraX;
    this.parent.y = this.cameraY;
  }

  rebuildScene() {
    this.children = [];
  }

  findObject(id: string) {
    return this.children.find((obj) => obj.id === id);
  }

  initWagon(object: IGameObjectWagon) {
    const wagon = new Wagon({ game: this, object });
    this.addChild(wagon);
  }

  updateWagon(object: IGameObjectWagon) {
    const wagon = this.findObject(object.id);
    if (wagon instanceof Wagon) {
      wagon.update(object);
    }
  }

  initTree(object: IGameObjectTree) {
    const tree = new Tree({ game: this, object });
    this.addChild(tree);
  }

  updateTree(object: IGameObjectTree) {
    const tree = this.findObject(object.id);
    if (tree instanceof Tree) {
      tree.update(object);
    }
  }

  initStone(object: IGameObjectStone) {
    const stone = new Stone({ game: this, object });
    this.addChild(stone);
  }

  updateStone(object: IGameObjectStone) {
    const stone = this.findObject(object.id);
    if (stone instanceof Stone) {
      stone.update(object);
    }
  }

  initPlayer(object: IGameObjectPlayer) {
    const player = new Player({ game: this, object });
    this.addChild(player);
  }

  updatePlayer(object: IGameObjectPlayer) {
    const player = this.findObject(object.id);
    if (player instanceof Player) {
      player.update(object);
    }
  }

  initCourier(object: IGameObjectCourier) {
    const courier = new Courier({ game: this, object });
    this.addChild(courier);
  }

  updateCourier(object: IGameObjectCourier) {
    const courier = this.findObject(object.id);
    if (courier instanceof Courier) {
      courier.update(object);
    }
  }

  initFarmer(object: IGameObjectFarmer) {
    const farmer = new Farmer({ game: this, object });
    this.addChild(farmer);
  }

  updateFarmer(object: IGameObjectFarmer) {
    const farmer = this.findObject(object.id);
    if (farmer instanceof Farmer) {
      farmer.update(object);
    }
  }

  initRaider(object: IGameObjectRaider) {
    const raider = new Raider({ game: this, object });
    this.addChild(raider);
  }

  updateRaider(object: IGameObjectRaider) {
    const raider = this.findObject(object.id);
    if (raider instanceof Raider) {
      raider.update(object);
    }
  }

  initRabbit(object: IGameObjectRabbit) {
    const rabbit = new Rabbit({ game: this, object });
    this.addChild(rabbit);
  }

  updateRabbit(object: IGameObjectRabbit) {
    const rabbit = this.findObject(object.id);
    if (rabbit instanceof Rabbit) {
      rabbit.update(object);
    }
  }

  initWolf(object: IGameObjectWolf) {
    const wolf = new Wolf({ game: this, object });
    this.addChild(wolf);
  }

  updateWolf(object: IGameObjectWolf) {
    const wolf = this.findObject(object.id);
    if (wolf instanceof Wolf) {
      wolf.update(object);
    }
  }

  initBuilding(object: IGameObjectBuilding) {
    const building = new Building({ game: this, object });
    this.addChild(building);
  }

  updateBuilding(object: IGameObjectBuilding) {
    const building = this.findObject(object.id);
    if (building instanceof Building) {
      building.update(object);
    }
  }

  initFlag(object: IGameObjectFlag) {
    const flag = new Flag({ game: this, object });
    this.addChild(flag);
  }

  updateFlag(object: IGameObjectFlag) {
    const flag = this.findObject(object.id);
    if (flag instanceof Flag) {
      flag.update(object);
    }
  }

  checkIfThisFlagIsTarget(id: string) {
    for (const obj of this.children) {
      if (obj.target?.id === id) {
        return true;
      }
    }
  }

  animateObjects() {
    for (const object of this.children) {
      object.animate();
    }
  }

  handleMessage(message: WebSocketMessage) {
    if (message.object) {
      this.handleMessageObject(message.object);
    }
    if (message.event) {
      this.handleMessageEvent(message.event);
    }
  }

  handleMessageObject(object: Partial<IGameObject>) {
    if (!object.id) {
      return;
    }

    const obj = this.findObject(object.id);
    if (!obj) {
      if (object.entity === "WAGON") {
        this.initWagon(object as IGameObjectWagon);
        return;
      }
      if (object.entity === "TREE") {
        this.initTree(object as IGameObjectTree);
        return;
      }
      if (object.entity === "STONE") {
        this.initStone(object as IGameObjectStone);
        return;
      }
      if (object.entity === "PLAYER") {
        this.initPlayer(object as IGameObjectPlayer);
        return;
      }
      if (object.entity === "COURIER") {
        this.initCourier(object as IGameObjectCourier);
        return;
      }
      if (object.entity === "FARMER") {
        this.initFarmer(object as IGameObjectFarmer);
        return;
      }
      if (object.entity === "RAIDER") {
        this.initRaider(object as IGameObjectRaider);
        return;
      }
      if (object.entity === "RABBIT") {
        this.initRabbit(object as IGameObjectRabbit);
        return;
      }
      if (object.entity === "WOLF") {
        this.initWolf(object as IGameObjectWolf);
        return;
      }
      if (object.entity === "BUILDING") {
        this.initBuilding(object as IGameObjectBuilding);
        return;
      }
      if (object.entity === "FLAG") {
        this.initFlag(object as IGameObjectFlag);
        return;
      }
      return;
    }

    if (object.entity === "WAGON") {
      this.updateWagon(object as IGameObjectWagon);
      return;
    }
    if (object.entity === "TREE") {
      this.updateTree(object as IGameObjectTree);
      return;
    }
    if (object.entity === "STONE") {
      this.updateStone(object as IGameObjectStone);
      return;
    }
    if (object.entity === "PLAYER") {
      this.updatePlayer(object as IGameObjectPlayer);
      return;
    }
    if (object.entity === "COURIER") {
      this.updateCourier(object as IGameObjectCourier);
      return;
    }
    if (object.entity === "FARMER") {
      this.updateFarmer(object as IGameObjectFarmer);
      return;
    }
    if (object.entity === "RAIDER") {
      this.updateRaider(object as IGameObjectRaider);
      return;
    }
    if (object.entity === "RABBIT") {
      this.updateRabbit(object as IGameObjectRabbit);
      return;
    }
    if (object.entity === "WOLF") {
      this.updateWolf(object as IGameObjectWolf);
      return;
    }
    if (object.entity === "BUILDING") {
      this.updateBuilding(object as IGameObjectBuilding);
      return;
    }
    if (object.entity === "FLAG") {
      this.updateFlag(object as IGameObjectFlag);
      return;
    }
  }

  handleMessageEvent(event: WebSocketMessage["event"]) {
    if (event === "RAID_STARTED") {
      this.audio.playRaidSound();
    }
    if (event === "GROUP_FORM_STARTED") {
      this.audio.playRaidSound();
    }
    if (event === "SCENE_CHANGED") {
      this.rebuildScene();
    }
  }
}