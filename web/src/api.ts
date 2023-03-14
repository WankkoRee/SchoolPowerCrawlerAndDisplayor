import { ref } from "vue";
import axios from "axios";
import type { Canceler, AxiosResponse } from "axios";

import { loadingBarApi, messageApi } from "@/utils";

export const requestsCanceler = ref<Canceler[]>([]);

axios.interceptors.request.use((config) => {
  config.cancelToken = new axios.CancelToken((c) => {
    requestsCanceler.value.push(c);
  });
  return config;
});
axios.interceptors.response.use(
  (resp) => {
    return resp;
  },
  (error) => {
    if (axios.isCancel(error)) {
      loadingBarApi.value?.finish();
      return new Promise(() => {});
    } else {
      return Promise.reject(error);
    }
  }
);

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

export async function getLastTime(): Promise<GetLastTimeResult> {
  const lastTimeRequest = axios.get<AppResponse<GetLastTimeResult>>("./api/dash/time/last");
  const result = await checkRequest(lastTimeRequest, false);
  return result;
}

export async function getRangeCount(range: RoomRange): Promise<GetRangeCountResult> {
  const rangeCountRequest = axios.get<AppResponse<GetRangeCountResult>>(`./api/dash/count/${range}`);
  const result = await checkRequest(rangeCountRequest, false);
  return result;
}

export async function getAreas(): Promise<GetAreasResult> {
  const areasRequest = axios.get<AppResponse<GetAreasResult>>("./api/info");
  const result = await checkRequest(areasRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

export async function getBuildings(area: string): Promise<GetBuildingsResult> {
  const buildingsRequest = axios.get<AppResponse<GetBuildingsResult>>(`./api/info/${area}`);
  const result = await checkRequest(buildingsRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

export async function getRooms(area: string, building: string): Promise<GetRoomsResult> {
  const roomsRequest = axios.get<AppResponse<GetRoomsResult>>(`./api/info/${area}/${building}`);
  const result = await checkRequest(roomsRequest, false);
  return result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

export async function getRoomInfo(area: string, building: string, room: string): Promise<GetRoomInfoResult> {
  const roomInfoRequest = axios.get<AppResponse<GetRoomInfoResult>>(`./api/info/${area}/${building}/${room}`);
  const result = await checkRequest(roomInfoRequest, false);
  return result;
}

export async function getRoomLastData(area: string, building: string, room: string): Promise<GetRoomLastDataResult> {
  const roomLastDataRequest = axios.get<AppResponse<GetRoomLastDataResult>>(`./api/data/${area}/${building}/${room}/last`);
  const result = await checkRequest(roomLastDataRequest, false);
  return result;
}

export async function getRoomSumDuring(area: string, building: string, room: string, during: string = ""): Promise<GetRoomSumDuringResult> {
  const roomSumDuringRequest = axios.get<AppResponse<GetRoomSumDuringResult>>(`./api/data/${area}/${building}/${room}/sum/${during}`);
  const result = await checkRequest(roomSumDuringRequest, false);
  return result;
}

export async function getRoomAvgDuring(area: string, building: string, room: string, during: string = ""): Promise<GetRoomAvgDuringResult> {
  const roomAvgDuringRequest = axios.get<AppResponse<GetRoomAvgDuringResult>>(`./api/data/${area}/${building}/${room}/avg/${during}`);
  const result = await checkRequest(roomAvgDuringRequest, false);
  return result;
}

export async function getRoomLogs(area: string, building: string, room: string): Promise<GetRoomLogsResult> {
  const roomLogsRequest = axios.get<AppResponse<GetRoomLogsResult>>(`./api/data/${area}/${building}/${room}/logs`);
  const result = await checkRequest(roomLogsRequest, false);
  return result;
}

export async function getRoomSpendings(area: string, building: string, room: string): Promise<GetRoomSpendingsResult> {
  const roomSpendingsRequest = axios.get<AppResponse<GetRoomSpendingsResult>>(`./api/data/${area}/${building}/${room}/spendings`);
  const result = await checkRequest(roomSpendingsRequest, false);
  return result;
}

export async function getRoomDailys(area: string, building: string, room: string): Promise<GetRoomDailysResult> {
  const roomDailysRequest = axios.get<AppResponse<GetRoomDailysResult>>(`./api/data/${area}/${building}/${room}/daily`);
  const result = await checkRequest(roomDailysRequest, false);
  return result;
}

export async function getRankSumRangeDuring(range: RoomRange, during: TimeDuring, limit: number): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}
export async function getRankSumRangeDuringInArea(range: RoomRange, during: TimeDuring, limit: number, area: string): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit, area } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}
export async function getRankSumRangeDuringInBuilding(
  range: RoomRange,
  during: TimeDuring,
  limit: number,
  area: string,
  building: string
): Promise<GetRankSumDuringResult> {
  const rankSumDuringRequest = axios.get<AppResponse<GetRankSumDuringResult>>(`./api/rank/sum/${range}/${during}`, { params: { limit, area, building } });
  const result = await checkRequest(rankSumDuringRequest, false);
  return result;
}

export async function getRankDailyAvgRangeDuring(range: RoomRange, during: TimeDuring, limit: number): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, { params: { limit } });
  const result = await checkRequest(rankDailyAvgDuringRequest, false);
  return result;
}
export async function getRankDailyAvgRangeDuringInArea(
  range: RoomRange,
  during: TimeDuring,
  limit: number,
  area: string
): Promise<GetRankDailyAvgDuringResult> {
  const rankDailyAvgDuringRequest = axios.get<AppResponse<GetRankDailyAvgDuringResult>>(`./api/rank/dailyAvg/${range}/${during}`, { params: { limit, area } });
  const result = await checkRequest(rankDailyAvgDuringRequest, false);
  return result;
}
export async function getRankDailyAvgRangeDuringInBuilding(
  range: RoomRange,
  during: TimeDuring,
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

export async function logout(): Promise<LogoutResult> {
  const logoutRequest = axios.post<AppResponse<LogoutResult>>("./api/user/logout");
  const result = await checkRequest(logoutRequest, false);
  return result;
}

export async function changePassword(password: string, new_password: string): Promise<ChangePasswordResult | string> {
  const changePasswordRequest = axios.post<AppResponse<ChangePasswordResult>>("./api/user/password/change", {
    password,
    new_password,
  });
  const result = await checkRequest(changePasswordRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else if (result.code === 105) {
    return "旧密码错误";
  } else if (result.code === 107) {
    return "旧密码与新密码相同";
  } else {
    return result.error!;
  }
}

export async function unbind(platform: "qq" | "qq_group" | "dingtalk"): Promise<UnbindResult | string> {
  const unbindRequest = axios.post<AppResponse<UnbindResult>>(`./api/user/unbind/${platform}`);
  const result = await checkRequest(unbindRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else {
    return result.error!;
  }
}

export async function subscribeAbnormal(abnormal: number): Promise<SubscribeAbnormalResult | string> {
  const subscribeAbnormalRequest = axios.post<AppResponse<SubscribeAbnormalResult>>("./api/user/subscribe/abnormal", {
    abnormal,
  });
  const result = await checkRequest(subscribeAbnormalRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else {
    return result.error!;
  }
}

export async function subscribeLow(low: number): Promise<SubscribeLowResult | string> {
  const subscribeLowRequest = axios.post<AppResponse<SubscribeLowResult>>("./api/user/subscribe/low", {
    low,
  });
  const result = await checkRequest(subscribeLowRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else {
    return result.error!;
  }
}

export async function subscribeReport(during: "day" | "week" | "month", enable: boolean): Promise<SubscribeReportResult | string> {
  const subscribeReportRequest = axios.post<AppResponse<SubscribeReportResult>>(`./api/user/subscribe/report/${during}`, {
    enable,
  });
  const result = await checkRequest(subscribeReportRequest, true);
  if (result.code === 1) {
    return result.data!;
  } else {
    return result.error!;
  }
}
