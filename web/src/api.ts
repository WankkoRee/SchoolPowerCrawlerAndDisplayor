import axios from "axios";
import type { AxiosResponse } from "axios";

import { loadingBarApi, messageApi } from "@/utils";

type AppResponse<T = any> = { code: number; data?: T; error?: string };
async function checkRequest<T>(request: Promise<AxiosResponse<AppResponse<T>>>): Promise<T> {
  let err = false;
  let result: T | string = "";

  loadingBarApi.value?.start();
  try {
    const response = await request;
    if (response.status !== 200) {
      // 网络异常
      err = true;
      result = `服务器异常，HTTP ${response.status}`;
      console.error(result, response);
    } else if (response.data.code !== 1) {
      // 数据异常
      err = true;
      result = `数据异常，${response.data.error!}`;
      console.error(result, response.data);
    } else {
      err = false;
      result = <T>response.data.data;
    }
  } catch (error: any) {
    err = true;
    result = `网络异常，${error.message}`;
    console.error(result, error);
  }
  loadingBarApi.value?.finish();
  if (err) {
    messageApi.value?.error(<string>result, { keepAliveOnHover: true });
    throw Error(<string>result);
  } else {
    return <T>result;
  }
}

type GetLastTimeResult = number;
export async function getLastTime(): Promise<GetLastTimeResult> {
  const lastTimeRequest = axios.get<AppResponse<GetLastTimeResult>>("./api/dash/time/last");
  const result = await checkRequest(lastTimeRequest);
  return result;
}

type GetRangeCountResult = number;
export async function getRangeCount(range: "area" | "building" | "room"): Promise<GetRangeCountResult> {
  const rangeCountRequest = axios.get<AppResponse<GetRangeCountResult>>(`./api/dash/count/${range}`);
  const result = await checkRequest(rangeCountRequest);
  return result;
}

type GetAreasResult = string[];
export async function getAreas(): Promise<GetAreasResult> {
  const areasRequest = axios.get<AppResponse<GetAreasResult>>("./api/info");
  const result = await checkRequest(areasRequest);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetBuildingsResult = string[];
export async function getBuildings(areaPath: string): Promise<GetBuildingsResult> {
  const buildingsRequest = axios.get<AppResponse<GetBuildingsResult>>(`./api/info/${areaPath}`);
  const result = await checkRequest(buildingsRequest);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetRoomsResult = string[];
export async function getRooms(buildingPath: string): Promise<GetRoomsResult> {
  const roomsRequest = axios.get<AppResponse<GetRoomsResult>>(`./api/info/${buildingPath}`);
  const result = await checkRequest(roomsRequest);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetRoomInfoResult = { ts: number; power: number; area: string; building: string; room: string };
export async function getRoomInfo(roomPath: string): Promise<GetRoomInfoResult> {
  const roomInfoRequest = axios.get<AppResponse<GetRoomInfoResult>>(`./api/info/${roomPath}`);
  const result = await checkRequest(roomInfoRequest);
  return result;
}

type GetRoomSumDuringResult = { from: number; to: number; spending: number };
export async function getRoomSumDuring(roomPath: string, during: string = ""): Promise<GetRoomSumDuringResult> {
  const roomSumDuringRequest = axios.get<AppResponse<GetRoomSumDuringResult>>(`./api/data/${roomPath}/sum/${during}`);
  const result = await checkRequest(roomSumDuringRequest);
  return result;
}

type GetRoomAvgDuringResult = { from: number; to: number; spending: number };
export async function getRoomAvgDuring(roomPath: string, during: string = ""): Promise<GetRoomAvgDuringResult> {
  const roomAvgDuringRequest = axios.get<AppResponse<GetRoomAvgDuringResult>>(`./api/data/${roomPath}/avg/${during}`);
  const result = await checkRequest(roomAvgDuringRequest);
  return result;
}

type GetRoomLogsResult = { ts: number; power: number; spending: number }[];
export async function getRoomLogs(roomPath: string): Promise<GetRoomLogsResult> {
  const roomLogsRequest = axios.get<AppResponse<GetRoomLogsResult>>(`./api/data/${roomPath}/logs`);
  const result = await checkRequest(roomLogsRequest);
  return result;
}

type GetRoomDailysResult = { ts: number; spending: number }[];
export async function getRoomDailys(roomPath: string): Promise<GetRoomDailysResult> {
  const roomDailysRequest = axios.get<AppResponse<GetRoomDailysResult>>(`./api/data/${roomPath}/daily`);
  const result = await checkRequest(roomDailysRequest);
  return result;
}

type GetRankSumDuringResult = { area: string; building?: string; room?: string; spending: number }[];
export async function getRankSumRangeDuring(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number
): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankSumDuringRequest);
  return result;
}

type GetRankDailyAvgDuringResult = { area: string; building?: string; room?: string; spending: number }[];
export async function getRankDailyAvgRangeDuring(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number
): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankDailyAvgDuringRequest);
  return result;
}
