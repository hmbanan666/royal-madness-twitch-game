import {
  type IGameChunkTheme,
  type IGameRoute,
  getRandomInRange,
} from "../../../../../packages/api-sdk/src"
import { Forest, LakeChunk, Village } from "../chunks"
import { Route } from "../common"
import { Stone, Tree } from "../objects"
import type { GameScene } from "../scenes"

interface IRouteServiceOptions {
  scene: GameScene
}

export class RouteService {
  public route: Route | undefined
  public scene: GameScene

  constructor({ scene }: IRouteServiceOptions) {
    this.scene = scene
  }

  public update() {
    if (!this.route?.flags || this.route.flags.length <= 0) {
      return this.finishAdventure()
    }

    for (const flag of this.route.flags) {
      void flag.live()
    }
  }

  public getRoute(): IGameRoute | null {
    if (!this.route) {
      return null
    }

    return {
      startPoint: this.route.startPoint,
      endPoint: this.route.endPoint,
      chunks: this.route.chunks,
    }
  }

  generateAdventure(village: Village, chunks: number) {
    const wagonStartPoint = village.getWagonStopPoint()
    const villageOutPoint = village.getRandomOutPointOnRight()

    this.route = new Route()
    this.route.addGlobalFlag(wagonStartPoint)
    this.route.startPoint = wagonStartPoint
    this.route.addChunk(village)

    this.generateChunks({ x: villageOutPoint.x, y: villageOutPoint.y }, chunks)
    this.markObjectsAsOnWagonPath(this.route)
  }

  generateChunks(startPoint: { x: number; y: number }, amount: number) {
    let outPoint = startPoint

    for (let i = 1; i <= amount; i++) {
      const chunk = this.generateRandomChunk(outPoint)
      if (!chunk) {
        continue
      }

      outPoint = chunk.getRandomOutPointOnRight()
      this.route?.addGlobalFlag(outPoint)
      this.route?.addChunk(chunk)
    }

    // Generate last chunk
    const finalVillage = this.generateRandomVillage({
      center: { x: outPoint.x + 2500 / 2, y: outPoint.y },
      width: 2500,
      height: 2000,
      theme: this.getRandomTheme(),
    })
    this.scene.chunks.push(finalVillage)
    const stopPoint = finalVillage.getWagonStopPoint()
    this.route?.addGlobalFlag(stopPoint)
    this.route?.addChunk(finalVillage)
    this.route?.setEndPoint(stopPoint)
  }

  generateRandomChunk(startPoint: { x: number; y: number }) {
    const random = getRandomInRange(1, 2)

    const width = getRandomInRange(1500, 2500)
    const height = getRandomInRange(2200, 3000)
    const center = {
      x: startPoint.x + width / 2,
      y: startPoint.y,
    }

    switch (random) {
      case 1:
        return this.generateRandomForest({
          center: center,
          width: width,
          height: height,
          theme: this.getRandomTheme(),
        })
      case 2:
        return this.generateRandomLake({
          center: center,
          width: width,
          height: height,
          theme: this.getRandomTheme(),
        })
      default:
        return undefined
    }
  }

  markObjectsAsOnWagonPath(route: Route) {
    for (const chunk of this.scene.chunks) {
      for (const object of chunk.objects) {
        if (object instanceof Tree || object instanceof Stone) {
          const isOnPath = route.checkIfPointIsOnWagonPath({
            x: object.x,
            y: object.y,
          })
          if (isOnPath) {
            object.isOnWagonPath = true
          }
        }
      }
    }
  }

  generateRandomVillage({
    center,
    width,
    height,
    theme,
  }: {
    center: { x: number; y: number }
    width: number
    height: number
    theme: IGameChunkTheme
  }) {
    return new Village({ width, height, center, theme })
  }

  generateRandomForest({
    center,
    width,
    height,
    theme,
  }: {
    center: { x: number; y: number }
    width: number
    height: number
    theme: IGameChunkTheme
  }) {
    const forest = new Forest({ width, height, center, theme })
    this.scene.chunks.push(forest)
    return forest
  }

  generateRandomLake({
    center,
    width,
    height,
    theme,
  }: {
    center: { x: number; y: number }
    width: number
    height: number
    theme: IGameChunkTheme
  }) {
    const lake = new LakeChunk({ width, height, center, theme })
    this.scene.chunks.push(lake)
    return lake
  }

  getRandomTheme(): IGameChunkTheme {
    const themes: IGameChunkTheme[] = [
      "GREEN",
      "BLUE",
      "STONE",
      "TEAL",
      "VIOLET",
      "TOXIC",
    ]
    return themes[Math.floor(Math.random() * themes.length)]
  }

  finishAdventure() {
    this.route = undefined
    this.scene.wagonService.wagon.emptyCargo()
  }
}
