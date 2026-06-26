import type { Rect, WorldConfig, WorldCoord } from "../data/schema/MapTypes";
import type { TileCoord, TileGridSize, TileRange, VisibleTileQuery, WorldTile } from "./TileTypes";

export class WorldTileMap {
  public constructor(private readonly config: WorldConfig) {}

  public getZoomLevels(): number[] {
    return [...this.config.tile.zoomLevels].sort((a, b) => a - b);
  }

  public selectTileZoom(cameraZoom: number): number {
    const levels = this.getZoomLevels();

    if (levels.length === 0) {
      throw new Error("World tile zoomLevels cannot be empty.");
    }

    let selected = levels[0];

    for (const level of levels) {
      if (cameraZoom >= this.getZoomScale(level)) {
        selected = level;
      }
    }

    return selected;
  }

  public getTileSize(z: number): number {
    return this.config.tile.baseTileSize / this.getZoomScale(z);
  }

  public getGridSize(z: number): TileGridSize {
    const tileSize = this.getTileSize(z);

    return {
      columns: Math.ceil(this.config.world.width / tileSize),
      rows: Math.ceil(this.config.world.height / tileSize),
    };
  }

  public worldToTile(coord: WorldCoord, z: number): TileCoord {
    const tileSize = this.getTileSize(z);
    const grid = this.getGridSize(z);

    return {
      z,
      x: this.clampIndex(Math.floor(coord.x / tileSize), grid.columns),
      y: this.clampIndex(Math.floor(coord.y / tileSize), grid.rows),
    };
  }

  public tileToWorldRect(tile: TileCoord): Rect {
    const tileSize = this.getTileSize(tile.z);
    const x = tile.x * tileSize;
    const y = tile.y * tileSize;

    return {
      x,
      y,
      width: Math.min(tileSize, this.config.world.width - x),
      height: Math.min(tileSize, this.config.world.height - y),
    };
  }

  public getVisibleTiles(query: VisibleTileQuery): WorldTile[] {
    const z = this.selectTileZoom(query.zoom);
    const range = this.getVisibleTileRange(query.viewRect, z, query.paddingTiles ?? 1);
    const tiles: WorldTile[] = [];

    for (let y = range.minY; y <= range.maxY; y += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) {
        tiles.push(this.createWorldTile({ z, x, y }));
      }
    }

    return tiles;
  }

  public getVisibleTileRange(viewRect: Rect, z: number, paddingTiles = 1): TileRange {
    const tileSize = this.getTileSize(z);
    const grid = this.getGridSize(z);
    const left = Math.max(0, viewRect.x);
    const top = Math.max(0, viewRect.y);
    const right = Math.min(this.config.world.width, viewRect.x + viewRect.width);
    const bottom = Math.min(this.config.world.height, viewRect.y + viewRect.height);

    return {
      z,
      minX: this.clampIndex(Math.floor(left / tileSize) - paddingTiles, grid.columns),
      maxX: this.clampIndex(Math.floor(Math.max(right - 1, 0) / tileSize) + paddingTiles, grid.columns),
      minY: this.clampIndex(Math.floor(top / tileSize) - paddingTiles, grid.rows),
      maxY: this.clampIndex(Math.floor(Math.max(bottom - 1, 0) / tileSize) + paddingTiles, grid.rows),
    };
  }

  public createWorldTile(tile: TileCoord): WorldTile {
    const normalized = this.clampTileCoord(tile);

    return {
      ...normalized,
      id: this.getTileId(normalized),
      path: this.resolveTilePath(normalized),
      worldRect: this.tileToWorldRect(normalized),
    };
  }

  public clampTileCoord(tile: TileCoord): TileCoord {
    const grid = this.getGridSize(tile.z);

    return {
      z: tile.z,
      x: this.clampIndex(tile.x, grid.columns),
      y: this.clampIndex(tile.y, grid.rows),
    };
  }

  public getTileId(tile: TileCoord): string {
    return `z${tile.z}_${tile.x}_${tile.y}`;
  }

  public resolveTilePath(tile: TileCoord): string {
    return this.config.tile.pathPattern
      .replace("{z}", String(tile.z))
      .replace("{x}", String(tile.x))
      .replace("{y}", String(tile.y));
  }

  private getZoomScale(z: number): number {
    return 2 ** z;
  }

  private clampIndex(value: number, count: number): number {
    if (count <= 0) {
      return 0;
    }

    return Math.min(Math.max(value, 0), count - 1);
  }
}
