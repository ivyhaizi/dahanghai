import type { Rect } from "../data/schema/MapTypes";

export type TileCoord = {
  z: number;
  x: number;
  y: number;
};

export type TileGridSize = {
  columns: number;
  rows: number;
};

export type WorldTile = TileCoord & {
  id: string;
  path: string;
  worldRect: Rect;
};

export type TileRange = {
  z: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type VisibleTileQuery = {
  viewRect: Rect;
  zoom: number;
  paddingTiles?: number;
};
