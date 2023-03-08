import { CascaderOption } from "naive-ui";

declare module "naive-ui" {
  export interface CascaderOption {
    value_show: string;
    value_fact: string;
    isLeaf: boolean;
    depth: number;
    path?: string[];
  }
}
