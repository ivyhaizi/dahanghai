declare module "cc" {
  export class SpriteFrame {}

  export class Vec3 {
    public constructor(x?: number, y?: number, z?: number);
  }

  export class Node {
    public name: string;
    public active: boolean;
    public parent: Node | null;

    public constructor(name?: string);
    public addComponent<T>(component: new () => T): T;
    public getComponent<T>(component: new () => T): T | null;
    public setPosition(position: Vec3): void;
    public destroy(): void;
  }

  export class Sprite {
    public spriteFrame: SpriteFrame | null;
    public sizeMode: Sprite.SizeMode;
  }

  export namespace Sprite {
    export enum SizeMode {
      CUSTOM = 0,
    }
  }

  export class UITransform {
    public setContentSize(width: number, height: number): void;
  }

  export const resources: {
    load<T>(
      path: string,
      type: new () => T,
      callback: (error: Error | null, asset: T) => void,
    ): void;
  };
}
