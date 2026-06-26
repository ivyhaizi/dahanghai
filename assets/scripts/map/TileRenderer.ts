import { Node, resources, Sprite, SpriteFrame, UITransform, Vec3 } from "cc";
import type { Rect } from "../data/schema/MapTypes";
import type { WorldTile } from "./TileTypes";

export type TileRenderViewport = {
  viewRect: Rect;
  zoom: number;
};

export type TileRendererOptions = {
  root: Node;
  poolWarmSize?: number;
  onTileLoadError?: (tile: WorldTile, error: Error) => void;
};

type ActiveTileNode = {
  tile: WorldTile;
  node: Node;
  sprite: Sprite;
  transform: UITransform;
  loadVersion: number;
};

export class TileRenderer {
  private readonly root: Node;
  private readonly onTileLoadError?: (tile: WorldTile, error: Error) => void;
  private readonly activeTiles = new Map<string, ActiveTileNode>();
  private readonly nodePool: Node[] = [];
  private readonly spriteFrameCache = new Map<string, Promise<SpriteFrame>>();
  private renderVersion = 0;

  public constructor(options: TileRendererOptions) {
    this.root = options.root;
    this.onTileLoadError = options.onTileLoadError;

    for (let i = 0; i < (options.poolWarmSize ?? 0); i += 1) {
      this.nodePool.push(this.createTileNode());
    }
  }

  public render(tiles: WorldTile[], viewport: TileRenderViewport): void {
    this.renderVersion += 1;

    const loadVersion = this.renderVersion;
    const visibleIds = new Set(tiles.map((tile) => tile.id));

    this.recycleHiddenTiles(visibleIds);

    for (const tile of tiles) {
      void this.renderTile(tile, viewport, loadVersion).catch((error: Error) => {
        this.onTileLoadError?.(tile, error);
      });
    }
  }

  public clear(): void {
    for (const active of this.activeTiles.values()) {
      this.recycleNode(active.node);
    }

    this.activeTiles.clear();
  }

  public destroy(): void {
    for (const active of this.activeTiles.values()) {
      active.node.destroy();
    }

    for (const node of this.nodePool) {
      node.destroy();
    }

    this.activeTiles.clear();
    this.nodePool.length = 0;
    this.spriteFrameCache.clear();
  }

  private async renderTile(tile: WorldTile, viewport: TileRenderViewport, loadVersion: number): Promise<void> {
    const active = this.getOrCreateActiveTile(tile);

    active.tile = tile;
    active.loadVersion = loadVersion;
    active.node.name = `tile_${tile.id}`;
    active.node.active = true;

    this.updateTileTransform(active, viewport);

    const spriteFrame = await this.loadSpriteFrame(tile.path);
    const latest = this.activeTiles.get(tile.id);

    if (!latest || latest.tile.path !== tile.path || latest.loadVersion !== loadVersion) {
      return;
    }

    latest.sprite.spriteFrame = spriteFrame;
  }

  private getOrCreateActiveTile(tile: WorldTile): ActiveTileNode {
    const active = this.activeTiles.get(tile.id);

    if (active) {
      return active;
    }

    const node = this.acquireNode();
    const sprite = this.ensureComponent(node, Sprite);
    const transform = this.ensureComponent(node, UITransform);
    const created: ActiveTileNode = {
      tile,
      node,
      sprite,
      transform,
      loadVersion: this.renderVersion,
    };

    this.activeTiles.set(tile.id, created);

    return created;
  }

  private updateTileTransform(active: ActiveTileNode, viewport: TileRenderViewport): void {
    const rect = active.tile.worldRect;
    const width = rect.width * viewport.zoom;
    const height = rect.height * viewport.zoom;
    const viewportWidth = viewport.viewRect.width * viewport.zoom;
    const viewportHeight = viewport.viewRect.height * viewport.zoom;
    const localX = (rect.x - viewport.viewRect.x) * viewport.zoom + width / 2 - viewportWidth / 2;
    const localY = viewportHeight / 2 - ((rect.y - viewport.viewRect.y) * viewport.zoom + height / 2);

    active.transform.setContentSize(width, height);
    active.node.setPosition(new Vec3(localX, localY, 0));
  }

  private recycleHiddenTiles(visibleIds: Set<string>): void {
    for (const [id, active] of this.activeTiles) {
      if (!visibleIds.has(id)) {
        this.activeTiles.delete(id);
        this.recycleNode(active.node);
      }
    }
  }

  private acquireNode(): Node {
    const node = this.nodePool.pop() ?? this.createTileNode();

    node.parent = this.root;
    node.active = true;

    return node;
  }

  private recycleNode(node: Node): void {
    const sprite = node.getComponent(Sprite);

    if (sprite) {
      sprite.spriteFrame = null;
    }

    node.active = false;
    node.parent = this.root;
    this.nodePool.push(node);
  }

  private createTileNode(): Node {
    const node = new Node("tile");
    const sprite = node.addComponent(Sprite);

    node.parent = this.root;
    node.active = false;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    node.addComponent(UITransform);

    return node;
  }

  private ensureComponent<T>(node: Node, component: new () => T): T {
    return node.getComponent(component) ?? node.addComponent(component);
  }

  private loadSpriteFrame(path: string): Promise<SpriteFrame> {
    const cached = this.spriteFrameCache.get(path);

    if (cached) {
      return cached;
    }

    const promise = new Promise<SpriteFrame>((resolve, reject) => {
      resources.load(path, SpriteFrame, (error, asset) => {
        if (error) {
          this.spriteFrameCache.delete(path);
          reject(error);
          return;
        }

        resolve(asset);
      });
    });

    this.spriteFrameCache.set(path, promise);

    return promise;
  }
}
