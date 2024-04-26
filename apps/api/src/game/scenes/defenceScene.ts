import { getRandomInRange } from "../../../../../packages/api-sdk/src";
import type { Group } from "../common";
import type { Game } from "../game";
import { Building, Player, Stone, Tree } from "../objects";
import { GameScene } from "./gameScene";

interface IDefenceSceneOptions {
  game: Game;
  group: Group | undefined;
}

export class DefenceScene extends GameScene {
  public wood!: number;
  public stone!: number;

  constructor({ game, group }: IDefenceSceneOptions) {
    super({
      game,
      group,
      possibleActions: [
        "CHOP",
        "MINE",
        "START_CHANGING_SCENE",
        "CREATE_NEW_PLAYER",
        "HELP",
        "DONATE",
      ],
    });

    void this.init();
  }

  public async init() {
    await this.initGroupPlayers();
    this.initTrees(12);
    this.initStones(8);
    this.initBuildings();

    this.wood = 0;
    this.stone = 0;

    this.initEvent({
      type: "COUNTDOWN_NEXT_WAVE_STARTED",
      title: "Скоро будет волна",
      secondsToEnd: 60 * 5,
    });

    void this.play();
  }

  async initGroupPlayers() {
    if (!this.group) {
      return;
    }

    for (const player of this.group.players) {
      const instance = await this.initPlayer(player.id);
      this.objects.push(instance);
    }
  }

  async initPlayer(id: string) {
    const instance = new Player({ id });
    await instance.init();

    const spawnFlag = this.findSpawnFlag("SPAWN_LEFT");
    if (spawnFlag) {
      instance.x = spawnFlag.x;
      instance.y = spawnFlag.y;
    }

    const targetFlag = this.findRandomMovementFlag();
    if (targetFlag) {
      instance.target = targetFlag;
      instance.state = "MOVING";
    }

    return instance;
  }

  private initTrees(count: number) {
    for (let i = 0; i < count; i++) {
      const flag = this.findRandomEmptyResourceFlag();
      if (flag) {
        const size = getRandomInRange(75, 90);
        const tree = new Tree({ x: flag.x, y: flag.y, size, resource: 1 });
        flag.target = tree;
        this.objects.push(tree);
      }
    }
  }

  private initStones(count: number) {
    for (let i = 0; i < count; i++) {
      const flag = this.findRandomEmptyResourceFlag();
      if (flag) {
        const stone = new Stone({ x: flag.x, y: flag.y, resource: 1 });
        flag.target = stone;
        this.objects.push(stone);
      }
    }
  }

  initBuildings() {
    this.objects.push(new Building({ type: "CAMP_FIRE", x: 1275, y: 690 }));
    this.objects.push(new Building({ type: "WAREHOUSE", x: 1440, y: 610 }));
  }
}