import accessMap from "./access.json";

export type AccessKey = keyof typeof accessMap;

export function getAccessId(key: AccessKey): number {
  return accessMap[key];
}
