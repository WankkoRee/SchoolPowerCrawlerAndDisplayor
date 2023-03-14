// data
type Timestamp = number;
type RoomRange = "area" | "building" | "room";
type TimeDuring = "day" | "week" | "month" | "";
type RoomPosition = {
  area: string;
  building: string;
  room: string;
};
type RoomInfo = RoomPosition & {
  nums: number;
};
type RoomStatisticalData = {
  from: Timestamp;
  to: Timestamp;
  spending: number;
};
type RoomPowerData = {
  ts: Timestamp;
  power: number;
};
type RoomSpendingData = {
  ts: Timestamp;
  spending: number;
};
type RankData = {
  area: string;
  building?: string;
  room?: string;
  spending: number;
};
type UserInfo = {
  info: {
    name: string;
    number: string;
    faculty: string;
    grade: string;
    major: string;
    class: string;
    qualification?: string;
    phone?: string;
    picture: string;
  };
  position: {
    area?: string;
    building?: string;
    room?: string;
    bed?: number;
    custom: {
      state: boolean;
      area?: string;
      building?: string;
      room?: string;
    };
  };
  app: {
    qq?: string;
    qq_group?: string;
    dingtalk?: string;
    subscribe: {
      abnormal: number;
      low: number;
      report: {
        day: boolean;
        week: boolean;
        month: boolean;
      };
    };
  };
  update_time: Timestamp;
};

// api
type AppResponse<T = any> = {
  code: number;
  data?: T;
  error?: string;
};
type GetLastTimeResult = Timestamp;
type GetRangeCountResult = number;
type GetAreasResult = string[];
type GetBuildingsResult = string[];
type GetRoomsResult = string[];
type GetRoomInfoResult = RoomInfo;
type GetRoomLastDataResult = RoomPowerData;
type GetRoomSumDuringResult = RoomStatisticalData;
type GetRoomAvgDuringResult = RoomStatisticalData;
type GetRoomLogsResult = RoomPowerData[];
type GetRoomSpendingsResult = RoomSpendingData[];
type GetRoomDailysResult = RoomSpendingData[];
type GetRankSumDuringResult = RankData[];
type GetRankDailyAvgDuringResult = RankData[];
type GetUserInfoResult = UserInfo;
type LoginResult = null;
type LogoutResult = null;
type ChangePasswordResult = null;
type UnbindResult = null;
type SubscribeAbnormalResult = null;
type SubscribeLowResult = null;
type SubscribeReportResult = null;

// ui
type ReloadFunc = () => Promise<void>;
type ThemeName = "light" | "dark";
type SelectorOption = import("naive-ui").CascaderOption & import("naive-ui").TreeSelectOption;
type ECharts = ReturnType<typeof import("echarts/core").init>;
