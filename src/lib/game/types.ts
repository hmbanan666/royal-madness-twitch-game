import type { Container, TilingSprite } from 'pixi.js'
import type { GameAction } from '$lib/game/actions/interface'
import type {
  GameActionService,
  GameEventService,
  GameRouteService,
  GameService,
  GameWagonService,
  IGameEvent,
  IGameRoute, Wagon,
} from '$lib/game/services/interface'
import type {
  GameChunk,
  GameChunkService, IGameChunkTheme,
} from '$lib/game/services/chunk/interface'
import type { GamePlayerService } from '$lib/game/services/player/interface'

export interface Game extends Container {
  children: GameObject[]
  tick: number
  audio: GameAudio
  scene: GameScene
  bg: GameBackground
  group: IGameGroup
  activePlayers: GameObjectPlayer[]
  actionService: GameActionService
  eventService: GameEventService
  tradeService: GameService
  wagonService: GameWagonService
  routeService: GameRouteService
  chunkService: GameChunkService
  playerService: GamePlayerService
  play: () => void
  checkIfThisFlagIsTarget: (id: string) => boolean
  initScene: (scene: GameSceneType) => void
  removeObject: (obj: GameObject) => void
  stopRaid: () => void
  initRaiders: (count: number) => void
}

export interface GameScene {
  game: Game
  destroy: () => void
}

export interface GameBackground {
  generateBackgroundTilingSprite: (theme: IGameChunkTheme) => TilingSprite
}

export interface GameAudio {
  playSound: (name: GameAudioName) => void
  isEnabled: boolean
  destroy: () => void
}

export type GameAudioName =
  | 'CHOP_HIT'
  | 'MINE_HIT'
  | 'HAND_HIT'
  | 'MARCHING_WITH_HORNS'
  | 'FOREST_BACKGROUND'
  | 'WAGON_MOVING'
  | 'FIRE_BURN'
  | 'YEAH'

export interface GameObject extends Container {
  id: string
  type: GameObjectType
  state: IGameObjectState
  direction: IGameObjectDirection
  target: GameObject | undefined
  health: number
  speedPerSecond: number
  size: number
  chunkId: string | undefined
  isOnWagonPath: boolean
  game: Game
  script: IGameScript | undefined
  init: () => void
  live: () => void
  animate: () => void
  move: () => boolean
  setTarget: (obj: GameObject) => void
}

type GameObjectType =
  | 'RABBIT'
  | 'WOLF'
  | 'PLAYER'
  | 'RAIDER'
  | 'TREE'
  | 'STONE'
  | 'WATER'
  | 'LAKE'
  | 'FLAG'
  | 'AREA'
  | 'TRADER'
  | 'VILLAGE_UNIT'
  | 'MECHANIC'
  | 'WAGON'
  | GameObjectBuildingType

export interface TwitchAccessTokenResponse {
  access_token: string
  refresh_token: string
  scope: string[]
  expires_in: number
  token_type: 'bearer'
}

export interface TwitchAccessToken {
  userId: string
  accessToken: string
  refreshToken: string | null
  scope: string[]
  expiresIn: number | null
  obtainmentTimestamp: number
}

export interface IGameActionResponse {
  ok: boolean
  message: string | null
}

export type IGameSceneAction =
  | 'HELP'
  | 'GIFT'
  | 'TRADE'
  | 'DONATE'
  | 'REFUEL'
  | 'STEAL_FUEL'
  | 'CHOP'
  | 'MINE'
  | 'PLANT'
  | 'START_GROUP_BUILD'
  | 'DISBAND_GROUP'
  | 'JOIN_GROUP'
  | 'START_POLL'
  | 'VOTE'
  | 'START_CHANGING_SCENE'
  | 'START_RAID'
  | 'CREATE_NEW_PLAYER'
  | 'START_CREATING_NEW_ADVENTURE'
  | 'SHOW_MESSAGE'
  | 'GITHUB'
  | 'CREATE_IDEA'

export type ItemType = 'WOOD' | 'STONE' | 'AXE' | 'PICKAXE' | 'COIN'

export interface IGameInventory {
  id: string
  objectId: string
  items: IGameInventoryItem[]
  reduceOrDestroyItem: (type: ItemType, amount: number) => Promise<boolean>
  addOrCreateItem: (type: ItemType, amount: number) => Promise<void>
}

export interface IGameInventoryItem {
  id: string
  createdAt: Date
  updatedAt: Date
  inventoryId: string
  type: ItemType
  amount: number
  durability: number
}

export interface IGameSkill {
  id: string
  type: 'WOODSMAN' | 'MINER'
  objectId: string | null
  lvl: number
  xp: number
  xpNextLvl: number
}

export interface IGameQuest {
  id: string
  type: 'MAIN' | 'SIDE'
  title: string
  description: string
  tasks: IGameQuestTask[]
  status: 'INACTIVE' | 'ACTIVE' | 'FAILED' | 'SUCCESS'
  creatorId: string
  conditions: {
    chunks?: number
    limitSeconds?: number
    reward?: string
  }
}

export interface IGameQuestTask {
  id: string
  description: string
  status: 'INACTIVE' | 'ACTIVE' | 'FAILED' | 'SUCCESS'
  progressNow: number | boolean
  progressToSuccess: number | boolean
  updateProgress: IGameQuestTaskFunc
  command?: string
  action?: GameAction
}

export type IGameQuestTaskFunc = (
  progressToSuccess?: IGameQuestTask['progressToSuccess'],
) => Partial<IGameQuestTask>

export type IGameObjectState =
  | 'MOVING'
  | 'IDLE'
  | 'WAITING'
  | 'CHOPPING'
  | 'MINING'
  | 'DESTROYED'
export type IGameObjectDirection = 'LEFT' | 'RIGHT'

export interface WebSocketMessage {
  id: string
  event:
    | 'OBJECT_UPDATED'
    | 'RAID_STARTED'
    | 'GROUP_FORM_STARTED'
    | 'SCENE_CHANGING_STARTED'
    | 'COUNTDOWN_NEXT_WAVE_STARTED'
    | 'SCENE_CHANGED'
    | 'VOTING_FOR_NEW_MAIN_QUEST_STARTED'
    | 'MAIN_QUEST_STARTED'
    | 'SIDE_QUEST_STARTED'
    | 'TRADE_STARTED'
    | 'IDEA_CREATED'
  object?: Partial<GameObject>
}

export type GameObjectBuildingType =
  | 'CAMPFIRE'
  | 'WAREHOUSE'
  | 'WAGON_STOP'
  | 'STORE'
  | 'CONSTRUCTION_AREA'

export interface IGameObjectBuilding extends GameObject {
  inventory: IGameInventory
}

export interface IGameBuildingCampfire extends IGameObjectBuilding {}

export interface IGameBuildingWarehouse extends IGameObjectBuilding {}

export interface IGameBuildingStore extends IGameObjectBuilding {}

export interface IGameBuildingWagonStop extends IGameObjectBuilding {}

export interface IGameBuildingConstructionArea extends IGameObjectBuilding {}

export interface GameObjectFlag extends GameObject {
  variant:
    | 'MOVEMENT'
    | 'WAGON_MOVEMENT'
    | 'WAGON_NEAR_MOVEMENT'
    | 'RESOURCE'
    | 'SPAWN_LEFT'
    | 'SPAWN_RIGHT'
    | 'OUT_OF_SCREEN'
    | 'TRADE_POINT'
}

export interface IGameObjectWater extends GameObject {}

export interface IGameObjectLake extends GameObject {
  water: IGameObjectWater[]
}

export interface IGameObjectArea extends GameObject {
  theme: IGameChunkTheme
  area: {
    startX: number
    endX: number
    startY: number
    endY: number
  }
}

export interface GameObjectTree extends GameObject {
  variant: '1' | '2' | '3' | '4' | '5'
  theme: IGameChunkTheme
  resource: number
  isReadyToChop: boolean
}

export interface GameObjectStone extends GameObject {
  variant: '1'
  resource: number
}

export interface IGameObjectUnit extends GameObject {
  userName: string
  coins: number
  inventory: IGameInventory
  visual: {
    head: '1'
    hairstyle: 'BOLD' | 'CLASSIC' | 'COAL_LONG' | 'ORANGE_WITH_BEARD'
    top:
      | 'VIOLET_SHIRT'
      | 'BLACK_SHIRT'
      | 'GREEN_SHIRT'
      | 'BLUE_SHIRT'
      | 'DARK_SILVER_SHIRT'
  }
  dialogue: {
    messages: { id: string, text: string }[]
  }
  chopTree: () => void
}

export interface IGameObjectTrader extends IGameObjectUnit {}

export interface IGameObjectCourier extends IGameObjectUnit {}

export interface IGameObjectFarmer extends IGameObjectUnit {}

export interface IGameObjectMechanic extends IGameObjectUnit {}

export interface GameObjectPlayer extends IGameObjectUnit {
  reputation: number
  villainPoints: number
  refuellerPoints: number
  raiderPoints: number
  skills: IGameSkill[]
  lastActionAt: Date
  addReputation: (amount: number) => void
}

export interface IGameObjectRaider extends IGameObjectUnit {}

export interface IGameObjectRabbit extends GameObject {}

export interface IGameObjectWolf extends GameObject {}

export interface ITradeOffer {
  id: string
  type: 'BUY' | 'SELL'
  amount: number
  unitPrice: number
  item: ItemType
  commandToTrade: string
}

export interface IGameScript {
  id: string
  tasks: IGameTask[]
  isInterruptible: boolean
  live: () => void
}

export interface IGameTask {
  id: string
  status: 'IDLE' | 'ACTIVE' | 'DONE'
  target?: GameObject
  live: () => void
}

export interface IGamePoll {
  status: 'ACTIVE' | 'SUCCESS' | 'FINISHED'
  id: string
  action: GameAction
  votesToSuccess: number
  votes: { id: string, userName: string }[]
}

export type GameSceneType = 'VILLAGE' | 'DEFENCE' | 'MOVING'

export interface GameStateResponse {
  id: string
  commands: string[]
  chunk: GameChunk | undefined
  events: IGameEvent[]
  group: IGameGroup
  wagon: Wagon
  route: IGameRoute | null
  warehouseItems: IGameInventoryItem[] | undefined
}

export interface IGameGroup {
  id: string
  players: GameObjectPlayer[]
}

export interface PlayerTitle {
  title: string
  type:
    | 'RICH'
    | 'FAMOUS'
    | 'VIEWER'
    | 'RAIDER'
    | 'VILLAIN'
    | 'REFUELLER'
    | 'WOODSMAN'
    | 'MINER'
}

export type GraphicsContainerType =
  | 'INTERFACE'
  | 'PLAYER_IDLE'
  | 'PLAYER_COINS'
  | 'PLAYER_WOOD'
  | 'PLAYER_STONE'
  | 'PLAYER_AXE'
  | 'PLAYER_PICKAXE'
  | 'UNIT_TOP'
  | 'UNIT_HEAD'
  | 'UNIT_HAIR'
  | 'WAGON_WHEEL'
  | 'WAGON_ENGINE'
  | 'WAGON_ENGINE_CLOUD'
  | 'WAGON_CARGO'
  | 'WAGON_FUEL'
  | 'FIRE_PARTICLE'

interface PlayerWithPoints {
  player: GameObjectPlayer
  points: number
}

export interface TopPlayersResponse {
  famous: PlayerWithPoints | null
  rich: PlayerWithPoints | null
  viewer: PlayerWithPoints | null
  raider: PlayerWithPoints | null
  woodsman: PlayerWithPoints | null
  miner: PlayerWithPoints | null
  villain: PlayerWithPoints | null
  refueller: PlayerWithPoints | null
}
