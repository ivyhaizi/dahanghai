export type GeoCoord = {
  lon: number;
  lat: number;
};

export type WorldCoord = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorldConfig = {
  version: number;
  world: {
    width: number;
    height: number;
    projection: "equirectangular";
    lonMin: number;
    lonMax: number;
    latMin: number;
    latMax: number;
  };
  tile: {
    baseTileSize: number;
    zoomLevels: number[];
    pathPattern: string;
  };
  collision: {
    cellSize: number;
    manifest: string;
  };
  route: {
    cellSize: number;
    manifest: string;
  };
};

export type PortData = {
  id: string;
  name: string;
  nameEn?: string;
  type: "major" | "minor" | "hidden";
  regionId: string;
  coord: GeoCoord;
  facilities: string[];
  tradeGoods: string[];
  faction?: string;
  visibleFromStart: boolean;
};

export type VillageData = {
  id: string;
  name: string;
  regionId: string;
  coord: GeoCoord;
  discoveryIds: string[];
  requirements: string[];
  visibleFromStart: boolean;
};

export type OceanRegionData = {
  id: string;
  name: string;
  dangerLevel: number;
  weatherProfileId: string;
  currentProfileId: string;
  polygon: GeoCoord[];
};

export type WindCurrentData = {
  id: string;
  regionId: string;
  season: "spring" | "summer" | "autumn" | "winter";
  directionDeg: number;
  strength: number;
};

export type WorldDataSet = {
  config: WorldConfig;
  ports: PortData[];
  villages: VillageData[];
  oceanRegions: OceanRegionData[];
  windCurrents: WindCurrentData[];
};

export type IndexedWorldObject<T> = T & {
  worldCoord: WorldCoord;
};
