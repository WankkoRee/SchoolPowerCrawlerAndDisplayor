import { createApp } from "vue";

import createAppRouter, { LoginDemand } from "@/router";
import SiteRoot from "@/SiteRoot.vue";
import Index from "@/pages/Index.vue";
import DashBoard from "@/pages/DashBoard.vue";
import ComparisonChart from "@/pages/ComparisonChart.vue";
import SpendingRank from "@/pages/SpendingRank.vue";
import MyRoom from "@/pages/MyRoom.vue";
import Login from "@/pages/Login.vue";

const app = createApp(SiteRoot);
const router = createAppRouter([
  { path: "/", name: "Index", component: Index, meta: { loginDemand: LoginDemand.NoMatter } },
  { path: "/DashBoard", name: "DashBoard", component: DashBoard, meta: { loginDemand: LoginDemand.NoMatter } },
  { path: "/ComparisonChart", name: "ComparisonChart", component: ComparisonChart, meta: { loginDemand: LoginDemand.NoMatter } },
  { path: "/SpendingRank", name: "SpendingRank", component: SpendingRank, meta: { loginDemand: LoginDemand.NoMatter } },
  { path: "/MyRoom", name: "MyRoom", component: MyRoom, meta: { loginDemand: LoginDemand.LoggedIn } },
  { path: "/Login", name: "Login", component: Login, meta: { loginDemand: LoginDemand.NotLoggedIn } },
]);
app.use(router);
router.isReady().then(() => {
  app.mount("#app");
});
