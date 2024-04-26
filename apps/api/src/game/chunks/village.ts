import {
  type IGameObjectFlag,
  type IGameVillageChunk,
  getRandomInRange,
} from "../../../../../packages/api-sdk/src";
import {
  Building,
  Flag,
  Stone,
  Tree,
  VillageCourier,
  VillageFarmer,
} from "../objects";
import { GameChunk } from "./gameChunk";

interface IVillageOptions {
  center: IGameVillageChunk["center"];
}

export class Village extends GameChunk implements IGameVillageChunk {
  constructor({ center }: IVillageOptions) {
    super({ center, title: "", type: "VILLAGE", width: 3000, height: 1600 });

    this.title = this.getRandomTitle();

    this.initFlags("RESOURCE", 40);
    this.initFlags("MOVEMENT", 30);
    this.initTrees(20);
    this.initStones(5);

    this.initCourier();
    this.initFarmer();
    this.initBuildings();
  }

  live() {
    super.live();

    for (const obj of this.objects) {
      void obj.live();
    }
  }

  initFlag(type: IGameObjectFlag["type"]) {
    const randomPoint = this.getRandomPoint();
    this.objects.push(new Flag({ type, x: randomPoint.x, y: randomPoint.y }));
  }

  initFlags(type: IGameObjectFlag["type"], count: number) {
    for (let i = 0; i < count; i++) {
      this.initFlag(type);
    }
  }

  initTrees(count: number) {
    for (let i = 0; i < count; i++) {
      const flag = this.getRandomEmptyResourceFlagInVillage();
      if (flag) {
        const size = getRandomInRange(75, 90);
        const tree = new Tree({ x: flag.x, y: flag.y, size, resource: 1 });
        flag.target = tree;
        this.objects.push(tree);
      }
    }
  }

  initStones(count: number) {
    for (let i = 0; i < count; i++) {
      const flag = this.getRandomEmptyResourceFlagInVillage();
      if (flag) {
        const stone = new Stone({ x: flag.x, y: flag.y, resource: 1 });
        flag.target = stone;
        this.objects.push(stone);
      }
    }
  }

  initCourier() {
    const randomPoint = this.getRandomPoint();
    this.objects.push(
      new VillageCourier({
        village: this,
        x: randomPoint.x,
        y: randomPoint.y,
      }),
    );
  }

  initFarmer() {
    const randomPoint = this.getRandomPoint();
    this.objects.push(
      new VillageFarmer({
        village: this,
        x: randomPoint.x,
        y: randomPoint.y,
      }),
    );
  }

  initBuildings() {
    this.objects.push(
      new Building({
        type: "CAMP_FIRE",
        x: this.center.x,
        y: this.center.y,
      }),
    );
    this.objects.push(
      new Building({
        type: "WAREHOUSE",
        x: this.center.x + 300,
        y: this.center.y - 140,
      }),
    );
  }

  getRandomEmptyResourceFlagInVillage() {
    const flags = this.objects.filter(
      (f) => f instanceof Flag && f.type === "RESOURCE" && !f.target,
    );
    return flags.length > 0
      ? flags[Math.floor(Math.random() * flags.length)]
      : undefined;
  }

  getRandomMovementFlagInVillage() {
    const flags = this.objects.filter(
      (f) => f instanceof Flag && f.type === "MOVEMENT",
    );
    return flags.length > 0
      ? flags[Math.floor(Math.random() * flags.length)]
      : undefined;
  }

  getRandomTitle() {
    const titles = [
      "Ветреный Пик",
      "Зеленая Роща",
      "Дубовый Берег",
      "Лесная Гавань",
      "Эльфийский Лес",
      "Каменная Застава",
      "Арбузный Рай",
      "Магическая Долина",
      "Королевское Пристанище",
      "Призрачный Утес",
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  checkIfNeedToPlantTree() {
    const treesNow = this.objects.filter(
      (t) => t instanceof Tree && t.state !== "DESTROYED",
    );
    if (treesNow.length < 40) {
      return this.getRandomEmptyResourceFlagInVillage();
    }
  }

  plantNewTree(flag: Flag, tree: Tree) {
    flag.target = tree;
    this.objects.push(tree);
  }
}