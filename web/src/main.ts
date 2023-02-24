import { createApp } from "vue";

import createAppRouter from "@/router";
import SiteRoot from "@/SiteRoot.vue";
import Index from "@/pages/Index.vue";
import DashBoard from "@/pages/DashBoard.vue";
import ComparisonChart from "@/pages/ComparisonChart.vue";
import SpendingRank from "@/pages/SpendingRank.vue";
import MyRoom from "@/pages/MyRoom.vue";

const app = createApp(SiteRoot);
const router = createAppRouter([
  { path: "/", name: "Index", component: Index },
  { path: "/DashBoard", name: "DashBoard", component: DashBoard },
  { path: "/ComparisonChart", name: "ComparisonChart", component: ComparisonChart },
  { path: "/SpendingRank", name: "SpendingRank", component: SpendingRank },
  { path: "/MyRoom", name: "MyRoom", component: MyRoom },
]);
app.use(router);
router.isReady().then(() => {
  app.mount("#app");
});
