// data
type Timestamp = number;
type RoomRange = "area" | "building" | "room";
type TimeDuring = "day" | "week" | "month" | "";
type RoomInfo = {
  ts: Timestamp;
  power: number;
  area: string;
  building: string;
  room: string;
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
    dingtalk?: string;
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
type GetRoomSumDuringResult = RoomStatisticalData;
type GetRoomAvgDuringResult = RoomStatisticalData;
type GetRoomLogsResult = (RoomPowerData & RoomSpendingData)[];
type GetRoomDailysResult = RoomSpendingData[];
type GetRankSumDuringResult = RankData[];
type GetRankDailyAvgDuringResult = RankData[];
type GetUserInfoResult = UserInfo;
type LoginResult = null;
type LogoutResult = null;

// ui
type ReloadFunc = () => Promise<void>;
type ThemeName = "light" | "dark";
type SelectorOption = import("naive-ui").CascaderOption & import("naive-ui").TreeSelectOption;
type ECharts = ReturnType<typeof import("echarts/core").init>;
