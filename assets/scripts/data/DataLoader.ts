import type { OceanRegionData, PortData, VillageData, WindCurrentData, WorldConfig, WorldDataSet } from "./schema/MapTypes";

export type JsonResourceLoader = <T>(path: string) => Promise<T>;

export type WorldDataPaths = {
  config: string;
  ports: string;
  villages: string;
  oceanRegions: string;
  windCurrents: string;
};

export const DEFAULT_WORLD_DATA_PATHS: WorldDataPaths = {
  config: "data/world.config",
  ports: "data/ports",
  villages: "data/villages",
  oceanRegions: "data/ocean_regions",
  windCurrents: "data/wind_current",
};

export class DataLoader {
  public constructor(
    private readonly loadJson: JsonResourceLoader,
    private readonly paths: WorldDataPaths = DEFAULT_WORLD_DATA_PATHS,
  ) {}

  public async loadWorldData(): Promise<WorldDataSet> {
    const [config, ports, villages, oceanRegions, windCurrents] = await Promise.all([
      this.loadJson<WorldConfig>(this.paths.config),
      this.loadJson<PortData[]>(this.paths.ports),
      this.loadJson<VillageData[]>(this.paths.villages),
      this.loadJson<OceanRegionData[]>(this.paths.oceanRegions),
      this.loadJson<WindCurrentData[]>(this.paths.windCurrents),
    ]);

    return {
      config,
      ports,
      villages,
      oceanRegions,
      windCurrents,
    };
  }
}
