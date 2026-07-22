import type { Job, AbnormalityLog, ActiveAbnormality, ActiveNg, ResinPlantGroup } from '../context/ProductionTypes';
import { productionTimelineCalculator, ProductionTimelineCalculator } from './ProductionTimelineCalculator';
import { productionFukaEngine, ProductionFukaEngine } from './ProductionFukaEngine';
import { productionHeijunkaGenerator, ProductionHeijunkaGenerator } from './ProductionHeijunkaGenerator';
import { productionApiClient, ProductionApiClient } from './ProductionApiClient';

export class ProductionService {
  public readonly timelineCalculator: ProductionTimelineCalculator;
  public readonly fukaEngine: ProductionFukaEngine;
  public readonly heijunkaGenerator: ProductionHeijunkaGenerator;
  public readonly apiClient: ProductionApiClient;

  constructor(
    timelineCalculator?: ProductionTimelineCalculator,
    fukaEngine?: ProductionFukaEngine,
    heijunkaGenerator?: ProductionHeijunkaGenerator,
    apiClient?: ProductionApiClient
  ) {
    this.timelineCalculator = timelineCalculator ?? productionTimelineCalculator;
    this.fukaEngine = fukaEngine ?? productionFukaEngine;
    this.heijunkaGenerator = heijunkaGenerator ?? productionHeijunkaGenerator;
    this.apiClient = apiClient ?? productionApiClient;
  }

  getWorkingBlocks() {
    return this.timelineCalculator.getWorkingBlocks();
  }

  addWorkingMinutes(current: Date, minutesToAdd: number) {
    return this.timelineCalculator.addWorkingMinutes(current, minutesToAdd);
  }

  recalculateTimeline(items: Job[]) {
    return this.timelineCalculator.recalculateTimeline(items);
  }

  getStatusColor(status: string) {
    return this.fukaEngine.getStatusColor(status);
  }

  getStatusText(status: string) {
    return this.fukaEngine.getStatusText(status);
  }

  normalizeLineName(line: string) {
    return this.fukaEngine.normalizeLineName(line);
  }

  parseMachineIdentifier(str: string) {
    return this.fukaEngine.parseMachineIdentifier(str);
  }

  machinesMatch(nameA: string, nameB: string) {
    return this.fukaEngine.machinesMatch(nameA, nameB);
  }

  getUniqueMachineKey(factory: string, machine: string) {
    return this.fukaEngine.getUniqueMachineKey(factory, machine);
  }

  getForecastMonthKeys() {
    return this.heijunkaGenerator.getForecastMonthKeys();
  }

  getTodayDateString() {
    return this.heijunkaGenerator.getTodayDateString();
  }

  getHeijunkaJobsForMachine(machineId: string, dateStr: string, parts: any[]) {
    return this.heijunkaGenerator.getHeijunkaJobsForMachine(machineId, dateStr, parts, (a, b) =>
      this.machinesMatch(a, b)
    );
  }

  calculateDynamicResinData(
    machinesData: any[],
    partsData: any[],
    machineJobs: Record<string, Job[]>,
    selectedDate: string,
    activeAbnormalities: Record<string, ActiveAbnormality>,
    activeNgs: Record<string, ActiveNg>
  ): ResinPlantGroup[] {
    return this.fukaEngine.calculateDynamicResinData(
      machinesData,
      partsData,
      machineJobs,
      selectedDate,
      activeAbnormalities,
      activeNgs,
      (mc, dt, pts) => this.getHeijunkaJobsForMachine(mc, dt, pts)
    );
  }

  flattenMachinesList(dynamicResinData: ResinPlantGroup[]) {
    return this.fukaEngine.flattenMachinesList(dynamicResinData);
  }

  savePlanToDatabase(
    id: string,
    planType: 'daily' | 'avg',
    machineId: string,
    dateKey: string,
    jobs: Job[],
    dayOT?: string,
    nightOT?: string,
    logsArray?: AbnormalityLog[],
    isAbnormal?: boolean,
    abnormalType?: string,
    abnormalStart?: string,
    isNg?: boolean,
    ngType?: string,
    ngStart?: string,
    activeAbnormalities?: Record<string, ActiveAbnormality>,
    activeNgs?: Record<string, ActiveNg>
  ) {
    return this.apiClient.savePlanToDatabase(
      id,
      planType,
      machineId,
      dateKey,
      jobs,
      dayOT,
      nightOT,
      logsArray,
      isAbnormal,
      abnormalType,
      abnormalStart,
      isNg,
      ngType,
      ngStart,
      activeAbnormalities,
      activeNgs
    );
  }

  fetchPlansFromApi() {
    return this.apiClient.fetchPlansFromApi();
  }
}

export const productionService = new ProductionService();
