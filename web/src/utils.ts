import { ref } from "vue";
import type { MessageApi, LoadingBarApi as LoadingBarApiNaiveUI } from "naive-ui";

export class LoadingBarApi {
  private readonly loadingBarApi;
  private indicator = 0;

  constructor(loadingBarApi: LoadingBarApiNaiveUI) {
    this.loadingBarApi = loadingBarApi;
  }
  start() {
    if (this.indicator++ === 0) this.loadingBarApi.start();
  }
  finish() {
    if (--this.indicator === 0) this.loadingBarApi.finish();
  }
}

export const loadingBarApi = ref<LoadingBarApi>();
export const messageApi = ref<MessageApi>();
