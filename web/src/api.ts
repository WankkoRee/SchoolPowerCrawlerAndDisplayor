import axios from "axios";
import type { AxiosResponse } from "axios";

import { loadingBarApi, messageApi } from "@/utils";

type AppResponse<T = any> = { code: number; data?: T; error?: string };
async function checkRequest<T, B extends boolean>(request: Promise<AxiosResponse<AppResponse<T>>>, silent: B): Promise<B extends false ? T : AppResponse<T>> {
  let err = false;
  let msg = "";
  let result: T | AppResponse<T>;

  loadingBarApi.value?.start();
  try {
    const response = await request;
    if (response.status !== 200) {
      // 网络异常
      err = true;
      msg = `服务器异常，HTTP ${response.status}`;
      console.error(msg, response);
    } else if (silent) {
      err = false;
      result = response.data;
    } else if (response.data.code !== 1) {
      // 数据异常
      err = true;
      msg = `数据异常，${response.data.error!}`;
      console.error(msg, response.data);
    } else {
      err = false;
      result = response.data.data!;
    }
  } catch (error: any) {
    err = true;
    msg = `网络异常，${error.message}`;
    console.error(msg, error);
  }
  loadingBarApi.value?.finish();
  if (err) {
    messageApi.value?.error(msg, { keepAliveOnHover: true });
    throw Error(msg);
  } else {
    return <B extends false ? T : AppResponse<T>>result!;
  }
}

type GetLastTimeResult = number;
export async function getLastTime(): Promise<GetLastTimeResult> {
  const lastTimeRequest = axios.get<AppResponse<GetLastTimeResult>>("./api/dash/time/last");
  const result = await checkRequest(lastTimeRequest, false);
  return result;
}

type GetRangeCountResult = number;
export async function getRangeCount(range: "area" | "building" | "room"): Promise<GetRangeCountResult> {
  const rangeCountRequest = axios.get<AppResponse<GetRangeCountResult>>(`./api/dash/count/${range}`);
  const result = await checkRequest(rangeCountRequest, false);
  return result;
}

type GetAreasResult = string[];
export async function getAreas(): Promise<GetAreasResult> {
  const areasRequest = axios.get<AppResponse<GetAreasResult>>("./api/info");
  const result = await checkRequest(areasRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetBuildingsResult = string[];
export async function getBuildings(areaPath: string): Promise<GetBuildingsResult> {
  const buildingsRequest = axios.get<AppResponse<GetBuildingsResult>>(`./api/info/${areaPath}`);
  const result = await checkRequest(buildingsRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetRoomsResult = string[];
export async function getRooms(buildingPath: string): Promise<GetRoomsResult> {
  const roomsRequest = axios.get<AppResponse<GetRoomsResult>>(`./api/info/${buildingPath}`);
  const result = await checkRequest(roomsRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

type GetRoomInfoResult = { ts: number; power: number; area: string; building: string; room: string };
export async function getRoomInfo(roomPath: string): Promise<GetRoomInfoResult> {
  const roomInfoRequest = axios.get<AppResponse<GetRoomInfoResult>>(`./api/info/${roomPath}`);
  const result = await checkRequest(roomInfoRequest, false);
  return result;
}

type GetRoomSumDuringResult = { from: number; to: number; spending: number };
export async function getRoomSumDuring(roomPath: string, during: string = ""): Promise<GetRoomSumDuringResult> {
  const roomSumDuringRequest = axios.get<AppResponse<GetRoomSumDuringResult>>(`./api/data/${roomPath}/sum/${during}`);
  const result = await checkRequest(roomSumDuringRequest, false);
  return result;
}

type GetRoomAvgDuringResult = { from: number; to: number; spending: number };
export async function getRoomAvgDuring(roomPath: string, during: string = ""): Promise<GetRoomAvgDuringResult> {
  const roomAvgDuringRequest = axios.get<AppResponse<GetRoomAvgDuringResult>>(`./api/data/${roomPath}/avg/${during}`);
  const result = await checkRequest(roomAvgDuringRequest, false);
  return result;
}

type GetRoomLogsResult = { ts: number; power: number; spending: number }[];
export async function getRoomLogs(roomPath: string): Promise<GetRoomLogsResult> {
  const roomLogsRequest = axios.get<AppResponse<GetRoomLogsResult>>(`./api/data/${roomPath}/logs`);
  const result = await checkRequest(roomLogsRequest, false);
  return result;
}

type GetRoomDailysResult = { ts: number; spending: number }[];
export async function getRoomDailys(roomPath: string): Promise<GetRoomDailysResult> {
  const roomDailysRequest = axios.get<AppResponse<GetRoomDailysResult>>(`./api/data/${roomPath}/daily`);
  const result = await checkRequest(roomDailysRequest, false);
  return result;
}

type GetRankSumDuringResult = { area: string; building?: string; room?: string; spending: number }[];
export async function getRankSumRangeDuring(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number
): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}
export async function getRankSumRangeDuringInArea(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number,
  area: string
): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit, area } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}
export async function getRankSumRangeDuringInBuilding(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number,
  area: string,
  building: string
): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit, area, building } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}

type GetRankDailyAvgDuringResult = { area: string; building?: string; room?: string; spending: number }[];
export async function getRankDailyAvgRangeDuring(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number
): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankDailyAvgDuringRequest, false);
  return result;
}

export async function getRankDailyAvgRangeDuringInArea(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number,
  area: string
): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, { params: { limit, area } });
  const result = await checkRequest(rankDailyAvgDuringRequest, false);
  return result;
}

export async function getRankDailyAvgRangeDuringInBuilding(
  range: "area" | "building" | "room",
  during: "day" | "week" | "month" | "",
  limit: number,
  area: string,
  building: string
): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, {
    params: { limit, area, building },
  });
  const result = await checkRequest(rankDailyAvgDuringRequest, false);
  return result;
}

type GetUserInfoResult = {};
export async function getUserInfo(): Promise<GetUserInfoResult | undefined> {
  const userInfoRequest = axios.get<AppResponse<GetUserInfoResult>>("./api/user/info");
  const result = await checkRequest(userInfoRequest, true);
  if (result.code === 1) {
    return result.data;
  } else if (result.code === 103) {
    // "未登录"
    return undefined;
  } else {
    console.warn(result);
    return undefined;
  }
}

type LoginResult = null;
export async function login(username: string, password: string): Promise<LoginResult | string> {
  const loginRequest = axios.post<AppResponse<LoginResult>>("./api/user/login", {
    username,
    password,
  });
  const result = await checkRequest(loginRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else if (result.code === 103) {
    return "用户名或密码错误";
  } else {
    return result.error!;
  }
}

type LogoutResult = null;
export async function logout(): Promise<LogoutResult> {
  const logoutRequest = axios.post<AppResponse<LogoutResult>>("./api/user/logout");
  const result = await checkRequest(logoutRequest, false);
  return result;
}
