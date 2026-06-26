import type { IndexedWorldObject, PortData, Rect, VillageData, WorldCoord } from "../data/schema/MapTypes";
import type { WorldDatabase } from "../data/WorldDatabase";
import type { WorldTile } from "./TileTypes";
import { WorldTileMap } from "./WorldTileMap";

export type CameraState = {
  center: WorldCoord;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type MapEngineOptions = {
  initialCamera: CameraState;
};

export type VisibleWorldObjects = {
  ports: IndexedWorldObject<PortData>[];
  villages: IndexedWorldObject<VillageData>[];
};

export type VisibleMapState = {
  rect: Rect;
  tiles: WorldTile[];
  objects: VisibleWorldObjects;
};

export class MapEngine {
  private database?: WorldDatabase;
  private camera?: CameraState;
  private tileMap?: WorldTileMap;

  public init(database: WorldDatabase, options: MapEngineOptions): void {
    this.database = database;
    this.tileMap = new WorldTileMap(database.getConfig());
    this.camera = this.clampCamera(options.initialCamera);
  }

  public update(_deltaTime: number): void {
    this.requireReady();
  }

  public destroy(): void {
    this.database = undefined;
    this.camera = undefined;
    this.tileMap = undefined;
  }

  public setCamera(camera: CameraState): void {
    this.requireReady();
    this.camera = this.clampCamera(camera);
  }

  public getCamera(): CameraState {
    this.requireReady();

    return {
      ...this.camera!,
      center: { ...this.camera!.center },
    };
  }

  public getVisibleWorldRect(): Rect {
    this.requireReady();

    const camera = this.camera!;
    const width = camera.viewportWidth / camera.zoom;
    const height = camera.viewportHeight / camera.zoom;

    return {
      x: camera.center.x - width / 2,
      y: camera.center.y - height / 2,
      width,
      height,
    };
  }

  public getVisibleObjects(): VisibleWorldObjects {
    this.requireReady();

    const rect = this.getVisibleWorldRect();

    return {
      ports: this.database!.getPortsInRect(rect),
      villages: this.database!.getVillagesInRect(rect),
    };
  }

  public getVisibleTiles(paddingTiles = 1): WorldTile[] {
    this.requireReady();

    return this.tileMap!.getVisibleTiles({
      viewRect: this.getVisibleWorldRect(),
      zoom: this.camera!.zoom,
      paddingTiles,
    });
  }

  public getVisibleMapState(paddingTiles = 1): VisibleMapState {
    this.requireReady();

    const rect = this.getVisibleWorldRect();

    return {
      rect,
      tiles: this.tileMap!.getVisibleTiles({
        viewRect: rect,
        zoom: this.camera!.zoom,
        paddingTiles,
      }),
      objects: {
        ports: this.database!.getPortsInRect(rect),
        villages: this.database!.getVillagesInRect(rect),
      },
    };
  }

  public screenToWorld(screen: WorldCoord): WorldCoord {
    this.requireReady();

    const camera = this.camera!;
    const rect = this.getVisibleWorldRect();

    return {
      x: rect.x + screen.x / camera.zoom,
      y: rect.y + screen.y / camera.zoom,
    };
  }

  public worldToScreen(world: WorldCoord): WorldCoord {
    this.requireReady();

    const camera = this.camera!;
    const rect = this.getVisibleWorldRect();

    return {
      x: (world.x - rect.x) * camera.zoom,
      y: (world.y - rect.y) * camera.zoom,
    };
  }

  private clampCamera(camera: CameraState): CameraState {
    const database = this.database;

    if (!database) {
      return camera;
    }

    const world = database.getConfig().world;
    const zoom = Math.max(camera.zoom, 0.01);
    const width = camera.viewportWidth / zoom;
    const height = camera.viewportHeight / zoom;

    return {
      ...camera,
      zoom,
      center: {
        x: this.clampCenterAxis(camera.center.x, width, world.width),
        y: this.clampCenterAxis(camera.center.y, height, world.height),
      },
    };
  }

  private clampCenterAxis(value: number, viewportSize: number, worldSize: number): number {
    if (viewportSize >= worldSize) {
      return worldSize / 2;
    }

    return Math.min(Math.max(value, viewportSize / 2), worldSize - viewportSize / 2);
  }

  private requireReady(): void {
    if (!this.database || !this.camera || !this.tileMap) {
      throw new Error("MapEngine has not been initialized.");
    }
  }
}
