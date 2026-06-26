import type {
  GeoCoord,
  IndexedWorldObject,
  OceanRegionData,
  PortData,
  Rect,
  VillageData,
  WindCurrentData,
  WorldConfig,
  WorldCoord,
  WorldDataSet,
} from "./schema/MapTypes";

export class WorldDatabase {
  private config?: WorldConfig;
  private portsById = new Map<string, IndexedWorldObject<PortData>>();
  private villagesById = new Map<string, IndexedWorldObject<VillageData>>();
  private oceanRegionsById = new Map<string, OceanRegionData>();
  private windCurrentsByRegionId = new Map<string, WindCurrentData[]>();

  public build(dataSet: WorldDataSet): void {
    this.config = dataSet.config;
    this.portsById = this.indexGeoObjects(dataSet.ports);
    this.villagesById = this.indexGeoObjects(dataSet.villages);
    this.oceanRegionsById = new Map(dataSet.oceanRegions.map((region) => [region.id, region]));
    this.windCurrentsByRegionId = this.groupByRegion(dataSet.windCurrents);
  }

  public getConfig(): WorldConfig {
    if (!this.config) {
      throw new Error("WorldDatabase has not been built.");
    }

    return this.config;
  }

  public geoToWorld(coord: GeoCoord): WorldCoord {
    const config = this.getConfig().world;
    const x = ((coord.lon - config.lonMin) / (config.lonMax - config.lonMin)) * config.width;
    const y = ((config.latMax - coord.lat) / (config.latMax - config.latMin)) * config.height;

    return { x, y };
  }

  public worldToGeo(coord: WorldCoord): GeoCoord {
    const config = this.getConfig().world;
    const lon = config.lonMin + (coord.x / config.width) * (config.lonMax - config.lonMin);
    const lat = config.latMax - (coord.y / config.height) * (config.latMax - config.latMin);

    return { lon, lat };
  }

  public getPort(id: string): IndexedWorldObject<PortData> | undefined {
    return this.portsById.get(id);
  }

  public getPorts(): IndexedWorldObject<PortData>[] {
    return [...this.portsById.values()];
  }

  public getPortsInRect(rect: Rect): IndexedWorldObject<PortData>[] {
    return this.getPorts().filter((port) => this.contains(rect, port.worldCoord));
  }

  public getVillage(id: string): IndexedWorldObject<VillageData> | undefined {
    return this.villagesById.get(id);
  }

  public getVillages(): IndexedWorldObject<VillageData>[] {
    return [...this.villagesById.values()];
  }

  public getVillagesInRect(rect: Rect): IndexedWorldObject<VillageData>[] {
    return this.getVillages().filter((village) => this.contains(rect, village.worldCoord));
  }

  public getOceanRegion(id: string): OceanRegionData | undefined {
    return this.oceanRegionsById.get(id);
  }

  public getOceanRegions(): OceanRegionData[] {
    return [...this.oceanRegionsById.values()];
  }

  public getWindCurrents(regionId: string): WindCurrentData[] {
    return this.windCurrentsByRegionId.get(regionId) ?? [];
  }

  private indexGeoObjects<T extends { id: string; coord: GeoCoord }>(items: T[]): Map<string, IndexedWorldObject<T>> {
    return new Map(
      items.map((item) => [
        item.id,
        {
          ...item,
          worldCoord: this.geoToWorld(item.coord),
        },
      ]),
    );
  }

  private groupByRegion(items: WindCurrentData[]): Map<string, WindCurrentData[]> {
    const grouped = new Map<string, WindCurrentData[]>();

    for (const item of items) {
      const current = grouped.get(item.regionId) ?? [];
      current.push(item);
      grouped.set(item.regionId, current);
    }

    return grouped;
  }

  private contains(rect: Rect, coord: WorldCoord): boolean {
    return coord.x >= rect.x
      && coord.x <= rect.x + rect.width
      && coord.y >= rect.y
      && coord.y <= rect.y + rect.height;
  }
}
