import type {
  GameSceneType,
  IGameSceneAction,
  ItemType,
} from "../../../../../packages/api-sdk/src"
import {
  ADMIN_PLAYER_ID,
  DISCORD_SERVER_INVITE_URL,
  DONATE_URL,
  GITHUB_REPO_URL,
} from "../../config"
import { Village } from "../chunks"
import { Group } from "../common"
import type { Warehouse } from "../objects/buildings/warehouse"
import type { Player } from "../objects/units"
import type { GameScene } from "../scenes"

const ANSWER = {
  OK: {
    ok: true,
    message: null,
  },
  ERROR: {
    ok: false,
    message: null,
  },
  CANT_DO_THIS_NOW_ERROR: {
    ok: false,
    message: "Сейчас этого сделать нельзя.",
  },
  NO_PLAYER_ERROR: {
    ok: false,
    message: "Тебя нет в активной игре :(",
  },
  NO_TARGET_ERROR: {
    ok: false,
    message: "Не указана цель.",
  },
  WRONG_AMOUNT_ERROR: {
    ok: false,
    message: "Неверно указано количество.",
  },
  ALREADY_VOTED_ERROR: {
    ok: false,
    message: "Ты уже проголосовал.",
  },
}

interface IActionServiceOptions {
  scene: GameScene
}

export class ActionService {
  public possibleActions: IGameSceneAction[]
  public scene: GameScene

  constructor({ scene }: IActionServiceOptions) {
    this.scene = scene
    this.possibleActions = [
      "HELP",
      "REFUEL",
      "CHOP",
      "MINE",
      "GIFT",
      "TRADE",
      "DONATE",
      "START_GROUP_BUILD",
      "DISBAND_GROUP",
      "JOIN_GROUP",
      "START_POLL",
      "VOTE",
      "STEAL_FUEL",
      "START_CHANGING_SCENE",
      "CREATE_NEW_PLAYER",
      "START_CREATING_NEW_ADVENTURE",
      "SHOW_MESSAGE",
      "START_RAID",
    ]
  }

  public async handle(
    action: IGameSceneAction,
    playerId: string,
    params?: string[],
  ) {
    const player = await this.scene.findOrCreatePlayer(playerId)
    if (!player) {
      return ANSWER.NO_PLAYER_ERROR
    }

    this.scene.group.join(player)

    if (action === "SHOW_MESSAGE") {
      return this.showMessageAction(player, params)
    }
    if (action === "REFUEL") {
      return this.refuelAction(player, params)
    }
    if (action === "CHOP") {
      return this.chopAction(player)
    }
    if (action === "MINE") {
      return this.mineAction(player)
    }
    if (action === "START_RAID") {
      return this.startRaidAction(player, params)
    }
    if (action === "START_CHANGING_SCENE") {
      // Admin only
      if (player.id !== ADMIN_PLAYER_ID) {
        return ANSWER.ERROR
      }
      return this.startChangingSceneAction(player, params)
    }
    if (action === "START_GROUP_BUILD") {
      // Admin only
      if (player.id !== ADMIN_PLAYER_ID) {
        return ANSWER.ERROR
      }
      return this.startGroupBuildAction(player, params)
    }
    if (action === "DISBAND_GROUP") {
      // Admin only
      if (player.id !== ADMIN_PLAYER_ID) {
        return ANSWER.ERROR
      }
      return this.disbandGroupAction()
    }
    if (action === "VOTE") {
      return this.voteAction(player, params)
    }
    if (action === "STEAL_FUEL") {
      return this.stealFuelAction(player)
    }
    if (action === "HELP") {
      return this.helpAction(player)
    }
    if (action === "GITHUB") {
      return this.githubAction(player)
    }
    if (action === "DONATE") {
      return this.donateAction(player)
    }
    if (action === "GIFT") {
      return this.giftAction(player, params)
    }
    if (action === "TRADE") {
      return this.tradeAction(player, params)
    }

    return ANSWER.ERROR
  }

  public getAvailableCommands() {
    const commands: string[] = []
    for (const action of this.possibleActions) {
      if (action === "HELP") {
        commands.push("!помощь")
      }
      if (action === "REFUEL") {
        commands.push("!заправить [кол-во]")
      }
      if (action === "CHOP") {
        commands.push("!рубить")
      }
      if (action === "MINE") {
        commands.push("!добыть")
      }
      if (action === "GIFT") {
        commands.push("!подарить [название] [кол-во]")
      }
      if (action === "DONATE") {
        commands.push("!донат")
      }
    }

    return commands
  }

  public isActionPossible(action: IGameSceneAction): boolean {
    return !!this.possibleActions.find((a) => a === action)
  }

  private startRaidAction(player: Player, params?: string[]) {
    // First param is raidersCount
    const raidersCount = params ? Number(params[0]) : 0

    this.scene.eventService.init({
      title: "Начался рейд!",
      type: "RAID_STARTED",
      secondsToEnd: 60 * 5,
    })
    this.scene.initRaiders(raidersCount)

    // Raider points
    void player.addRaiderPoints(raidersCount)

    return ANSWER.OK
  }

  private async showMessageAction(player: Player, params?: string[]) {
    if (!this.isActionPossible("SHOW_MESSAGE")) {
      return ANSWER.ERROR
    }

    if (!params || !params[0]) {
      return ANSWER.ERROR
    }

    const message = params[0]
    player.addMessage(message)

    return ANSWER.OK
  }

  private async stealFuelAction(player: Player) {
    if (!this.isActionPossible("STEAL_FUEL")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    this.scene.wagonService.wagon.emptyFuel()

    await player.addVillainPoints(1)

    return {
      ok: true,
      message: `${player.userName}, а ты Злодей!`,
    }
  }

  private async refuelAction(player: Player, params?: string[]) {
    if (!this.isActionPossible("REFUEL")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return ANSWER.NO_TARGET_ERROR
    }

    const count = this.getAmountFromChatCommand(params[0])
    if (!count) {
      return ANSWER.WRONG_AMOUNT_ERROR
    }

    const items = player.inventory?.items ?? []
    const itemExist = items.find((item) => item.type === "WOOD")
    if (!itemExist) {
      return {
        ok: false,
        message: `${player.userName}, у тебя нет древесины.`,
      }
    }

    const isSuccess = await player.inventory?.reduceOrDestroyItem(
      itemExist.type,
      count,
    )
    if (!isSuccess) {
      return {
        ok: false,
        message: `${player.userName}, недостаточно древесины.`,
      }
    }

    await player.addRefuellerPoints(count)

    this.scene.wagonService.wagon.refuel(count)

    return {
      ok: true,
      message: `${player.userName}, ты помог заправить Машину.`,
    }
  }

  getAmountFromChatCommand(text: string): number | null {
    if (typeof Number(text) === "number" && Number(text) > 0) {
      return Math.round(Number(text))
    }

    return null
  }

  private async chopAction(player: Player) {
    if (!this.isActionPossible("CHOP")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }
    if (player.state === "CHOPPING") {
      return {
        ok: false,
        message: `${player.userName}, ты пока занят(а).`,
      }
    }

    const tree = this.scene.getTreeToChop()
    if (!tree) {
      return {
        ok: false,
        message: `${player.userName}, нет свободного дерева.`,
      }
    }

    player.setTarget(tree)

    return ANSWER.OK
  }

  private async mineAction(player: Player) {
    if (!this.isActionPossible("MINE")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }
    if (player.state === "MINING") {
      return {
        ok: false,
        message: `${player.userName}, ты пока занят(а).`,
      }
    }

    const stone = this.scene.getStoneToMine()
    if (!stone) {
      return {
        ok: false,
        message: `${player.userName}, нет свободного камня.`,
      }
    }

    player.setTarget(stone)

    return ANSWER.OK
  }

  private startChangingSceneAction(_: Player, params?: string[]) {
    if (!this.isActionPossible("START_CHANGING_SCENE")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return ANSWER.NO_TARGET_ERROR
    }

    const scene = this.getSceneTypeFromChatCommand(params[1])
    if (!scene) {
      return ANSWER.NO_TARGET_ERROR
    }

    this.scene.eventService.init({
      type: "SCENE_CHANGING_STARTED",
      title: "Меняем локацию",
      scene,
      secondsToEnd: 10,
    })

    return ANSWER.OK
  }

  getSceneTypeFromChatCommand(text: string): GameSceneType | null {
    if (text === "деревня" || text === "деревню") {
      return "VILLAGE"
    }
    if (text === "защиту" || text === "защита") {
      return "DEFENCE"
    }

    return null
  }

  private startGroupBuildAction(player: Player, params?: string[]) {
    if (!this.isActionPossible("START_GROUP_BUILD")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return ANSWER.NO_TARGET_ERROR
    }

    const scene = this.getSceneTypeFromChatCommand(params[1])
    if (!scene) {
      return ANSWER.NO_TARGET_ERROR
    }

    this.scene.group = new Group()

    this.scene.eventService.init({
      type: "GROUP_FORM_STARTED",
      title: "Идет набор в группу!",
      scene,
      secondsToEnd: 120,
    })

    return ANSWER.OK
  }

  private disbandGroupAction() {
    if (!this.isActionPossible("DISBAND_GROUP")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    this.scene.group?.disband()

    return {
      ok: true,
      message: "Группа расформирована!",
    }
  }

  private voteAction(player: Player, params?: string[]) {
    if (!this.isActionPossible("VOTE")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return ANSWER.NO_TARGET_ERROR
    }

    const voteStatus =
      this.scene.eventService.pollService.findActivePollAndVote(
        params[0],
        player,
      )
    if (voteStatus === "VOTED_ALREADY") {
      return ANSWER.ALREADY_VOTED_ERROR
    }
    if (voteStatus === "POLL_NOT_FOUND") {
      return ANSWER.ERROR
    }

    return {
      ok: true,
      message: `${player.userName}, ты проголосовал(а)!`,
    }
  }

  private helpAction(player: Player) {
    if (!this.isActionPossible("HELP")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    return {
      ok: true,
      message: `${player.userName}, это интерактивная игра-чат, в которой может участвовать любой зритель! Базовые команды: !рубить, !добыть. Остальные команды появляются в событиях (на экране справа). Вступай в наше комьюнити: ${DISCORD_SERVER_INVITE_URL}`,
    }
  }

  private githubAction(player: Player) {
    if (!this.isActionPossible("GITHUB")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    return {
      ok: true,
      message: `${player.userName}, код игры находится в репозитории: ${GITHUB_REPO_URL}`,
    }
  }

  private donateAction(player: Player) {
    if (!this.isActionPossible("DONATE")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }
    return {
      ok: true,
      message: `${player.userName}, поддержи игру: ${DONATE_URL}`,
    }
  }

  private async giftAction(player: Player, params: string[] | undefined) {
    if (!this.isActionPossible("GIFT")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return {
        ok: false,
        message: `${player.userName}, укажи конкретнее, например: !подарить древесину 20`,
      }
    }

    const item = this.getItemTypeFromChatCommand(params[0])
    if (!item) {
      return {
        ok: false,
        message: `${player.userName}, укажи конкретнее, например: !подарить древесину 20`,
      }
    }

    const amount = this.getAmountFromChatCommand(params[1])
    if (!amount) {
      return {
        ok: false,
        message: `${player.userName}, укажи конкретнее, например: !подарить древесину 20`,
      }
    }

    let warehouse: Warehouse | undefined
    if (this.scene.chunkNow instanceof Village) {
      warehouse = this.scene.chunkNow.getWarehouse()
    }

    if (item === "WOOD") {
      const isSuccess = await player.inventory.reduceOrDestroyItem(item, amount)
      if (!isSuccess) {
        return {
          ok: false,
          message: `${player.userName}, у тебя не хватает древесины.`,
        }
      }

      await warehouse?.inventory.addOrCreateItem(item, amount)
      await player.addReputation(amount)

      return {
        ok: true,
        message: `${player.userName}, ты подарил(а) деревне древесину! Твоя репутация возросла.`,
      }
    }
    if (item === "STONE") {
      const isSuccess = await player.inventory.reduceOrDestroyItem(item, amount)
      if (!isSuccess) {
        return {
          ok: false,
          message: `${player.userName}, у тебя не хватает камня.`,
        }
      }

      await warehouse?.inventory.addOrCreateItem(item, amount)
      await player.addReputation(amount)

      return {
        ok: true,
        message: `${player.userName}, ты подарил(а) деревне камни! Твоя репутация возросла.`,
      }
    }

    return {
      ok: false,
      message: `${player.userName}, укажи конкретнее, например: !подарить древесину 20`,
    }
  }

  getItemTypeFromChatCommand(text: string): ItemType | null {
    if (text === "древесину" || text === "древесина") {
      return "WOOD"
    }
    if (text === "камень" || text === "камни") {
      return "STONE"
    }
    if (text === "топор") {
      return "AXE"
    }
    if (text === "кирка" || text === "кирку") {
      return "PICKAXE"
    }

    return null
  }

  private async tradeAction(player: Player, params: string[] | undefined) {
    if (!this.isActionPossible("TRADE")) {
      return ANSWER.CANT_DO_THIS_NOW_ERROR
    }

    if (!params) {
      return ANSWER.NO_TARGET_ERROR
    }

    const amount = this.getAmountFromChatCommand(params[1])
    if (!amount) {
      return ANSWER.WRONG_AMOUNT_ERROR
    }

    const status = await this.scene.tradeService.findActiveOfferAndTrade(
      params[0],
      amount,
      player,
    )
    if (status === "OFFER_ERROR") {
      return {
        ok: false,
        message: "Что-то не так. Сделка не состоялась",
      }
    }
    if (status === "OFFER_NOT_FOUND") {
      return ANSWER.NO_TARGET_ERROR
    }

    return {
      ok: true,
      message: `${player.userName}, успешная торговая сделка!`,
    }
  }
}
