export interface FactoryData {
  id: string;
  code: string;
  name: string;
}

export interface MachineData {
  id: string;
  code: string;
  name: string;
  tonnage: string;
}

export interface MemberLoginFormProps {
  onBack: () => void;
}

export interface DeviceCredentials {
  username: string;
  password: string;
}

export interface MemberCredentials {
  factoryId: string;
  factoryName: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  pin: string;
  memberName: string;
}
