<template>
  <n-space vertical align="center" justify="center" style="min-height: var(--container-height)">
    <n-space align="center" justify="center">
      <n-card hoverable style="width: min(var(--container-width), 1200px)">
        <template #header>
          <n-skeleton v-if="loading" text :width="80" :sharp="false" />
          <n-h2 v-else style="margin-bottom: 0">{{ userInfo?.info.name }}</n-h2>
        </template>
        <n-grid item-responsive :cols="1">
          <n-grid-item span="0 800:1">
            <n-space align="center" justify="space-around">
              <n-space vertical align="start" justify="center" item-style="width: 100%">
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>QQ</n-text>
                      <n-divider vertical />
                      <n-skeleton v-if="loading" text :width="100" round />
                      <n-button v-else-if="userInfo?.app.qq" text @click="qqUnbindShow = true">{{ userInfo?.app.qq }}</n-button>
                      <n-button v-else text @click="qqBindShow = true">未绑定，点击绑定</n-button>
                    </n-space>
                  </template>
                  <n-text>用于<b>查余额</b>、<b>查用量</b>、<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
                </n-popover>
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>QQ群</n-text>
                      <n-divider vertical />
                      <n-skeleton v-if="loading" text :width="100" round />
                      <n-button v-else-if="userInfo?.app.qq_group" text @click="qqGroupUnbindShow = true">{{ userInfo?.app.qq_group }}</n-button>
                      <n-button v-else text @click="qqGroupBindShow = true">未绑定，点击绑定</n-button>
                    </n-space>
                  </template>
                  <n-text>用于<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
                </n-popover>
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>钉钉</n-text>
                      <n-divider vertical />
                      <n-skeleton v-if="loading" text :width="120" round />
                      <n-text v-else-if="userInfo?.app.dingtalk" @click="dingtalkUnbindShow = true">{{ userInfo?.app.dingtalk }} </n-text>
                      <n-button v-else text @click="dingtalkBindShow = true">未绑定，点击绑定</n-button>
                    </n-space>
                  </template>
                  <n-text>用于<b>查余额</b>、<b>查用量</b>、<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
                </n-popover>
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>异常耗电提醒</n-text>
                      <n-divider vertical />
                      <n-skeleton v-if="loading" :width="140" :height="30" :sharp="false" />
                      <n-input-number
                        v-else
                        size="small"
                        button-placement="both"
                        style="width: 140px; text-align: center"
                        v-model:value="abnormalThreshold"
                        @update:value="abnormalThresholdSubscribe"
                        :disabled="abnormalThresholdSubscribing"
                        :loading="abnormalThresholdSubscribing"
                        :precision="0"
                        :min="0"
                        :max="20"
                        :parse="parseInputInt"
                        :format="(value: number | null) => !value ? '关闭' : String(value) + ' kWh'"
                      />
                    </n-space>
                  </template>
                  <n-text>在当天用电量超过设定范围时，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>发送提醒</n-text>
                </n-popover>
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>电量过低提醒</n-text>
                      <n-divider vertical />
                      <n-skeleton v-if="loading" :width="140" :height="30" :sharp="false" />
                      <n-input-number
                        v-else
                        size="small"
                        button-placement="both"
                        style="width: 140px; text-align: center"
                        v-model:value="lowThreshold"
                        @update:value="lowThresholdSubscribe"
                        :disabled="lowThresholdSubscribing"
                        :loading="lowThresholdSubscribing"
                        :precision="0"
                        :min="0"
                        :max="7"
                        :parse="parseInputInt"
                        :format="(value: number | null) => !value ? '关闭' : String(value) + ' 天'"
                      />
                    </n-space>
                  </template>
                  <n-text>在剩余电量预计可用天数不足设定天数时，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>发送提醒</n-text>
                </n-popover>
                <n-popover placement="right" trigger="hover" width="trigger">
                  <template #trigger>
                    <n-space align="center" justify="start" :size="0">
                      <n-text>用电报告推送</n-text>
                      <n-divider vertical />
                      <n-space align="center" justify="start" :size="4">
                        <n-skeleton v-if="loading" :width="74" :height="18" round />
                        <n-switch
                          v-else
                          size="large"
                          v-model:value="reportDay"
                          @update:value="reportDaySubscribe"
                          :loading="reportDaySubscribing"
                          :disabled="reportDaySubscribing"
                        >
                          <template #checked-icon>
                            <n-icon>
                              <AlertOn24Regular />
                            </n-icon>
                          </template>
                          <template #checked>日报</template>
                          <template #unchecked-icon>
                            <n-icon>
                              <AlertOff24Regular />
                            </n-icon>
                          </template>
                          <template #unchecked>日报</template>
                        </n-switch>
                        <n-skeleton v-if="loading" :width="74" :height="18" round />
                        <n-switch
                          v-else
                          size="large"
                          v-model:value="reportWeek"
                          @update:value="reportWeekSubscribe"
                          :loading="reportWeekSubscribing"
                          :disabled="reportWeekSubscribing"
                        >
                          <template #checked-icon>
                            <n-icon>
                              <AlertOn24Regular />
                            </n-icon>
                          </template>
                          <template #checked>周报</template>
                          <template #unchecked-icon>
                            <n-icon>
                              <AlertOff24Regular />
                            </n-icon>
                          </template>
                          <template #unchecked>周报</template>
                        </n-switch>
                        <n-skeleton v-if="loading" :width="74" :height="18" round />
                        <n-switch
                          v-else
                          size="large"
                          v-model:value="reportMonth"
                          @update:value="reportMonthSubscribe"
                          :loading="reportMonthSubscribing"
                          :disabled="reportMonthSubscribing"
                        >
                          <template #checked-icon>
                            <n-icon>
                              <AlertOn24Regular />
                            </n-icon>
                          </template>
                          <template #checked>月报</template>
                          <template #unchecked-icon>
                            <n-icon>
                              <AlertOff24Regular />
                            </n-icon>
                          </template>
                          <template #unchecked>月报</template>
                        </n-switch>
                      </n-space>
                    </n-space>
                  </template>
                  <n-text
                    >在<b>每天</b>/<b>每周一</b>/<b>每月1号</b>的<b>早晨7点</b>，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>推送<b>昨日</b>/<b>上周</b>/<b>上月</b>用电报告</n-text
                  >
                </n-popover>
              </n-space>
              <n-divider
                v-if="roomCanBeShow"
                vertical
                dashed
                style="height: 240px; border-width: 0 0 0 3px; border-style: dashed; border-color: var(--n-color); background-color: unset"
              />
              <RoomInfoCard
                v-if="roomCanBeShow"
                ref="roomInfoPC"
                style="width: min(var(--container-width), 500px)"
                :room="{ area, building, room }"
                refresh
                compare
              />
            </n-space>
          </n-grid-item>
          <n-grid-item span="1 800:0">
            <n-space vertical align="start" justify="center" item-style="width: 100%">
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>QQ</n-text>
                    <n-divider vertical />
                    <n-skeleton v-if="loading" text :width="100" round />
                    <n-button v-else-if="userInfo?.app.qq" text @click="qqUnbindShow = true">{{ userInfo?.app.qq }}</n-button>
                    <n-button v-else text @click="qqBindShow = true">未绑定，点击绑定</n-button>
                  </n-space>
                </template>
                <n-text>用于<b>查余额</b>、<b>查用量</b>、<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
              </n-popover>
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>QQ群</n-text>
                    <n-divider vertical />
                    <n-skeleton v-if="loading" text :width="100" round />
                    <n-button v-else-if="userInfo?.app.qq_group" text @click="qqGroupUnbindShow = true">{{ userInfo?.app.qq_group }}</n-button>
                    <n-button v-else text @click="qqGroupBindShow = true">未绑定，点击绑定</n-button>
                  </n-space>
                </template>
                <n-text>用于<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
              </n-popover>
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>钉钉</n-text>
                    <n-divider vertical />
                    <n-skeleton v-if="loading" text :width="120" round />
                    <n-text v-else-if="userInfo?.app.dingtalk" @click="dingtalkUnbindShow = true">{{ userInfo?.app.dingtalk }} </n-text>
                    <n-button v-else text @click="dingtalkBindShow = true">未绑定，点击绑定</n-button>
                  </n-space>
                </template>
                <n-text>用于<b>查余额</b>、<b>查用量</b>、<b>推送订阅消息</b><br />点击可<b>绑定</b>或<b>解绑</b></n-text>
              </n-popover>
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>异常耗电提醒</n-text>
                    <n-divider vertical />
                    <n-skeleton v-if="loading" :width="140" :height="30" :sharp="false" />
                    <n-input-number
                      v-else
                      size="small"
                      button-placement="both"
                      style="width: 140px; text-align: center"
                      v-model:value="abnormalThreshold"
                      @update:value="abnormalThresholdSubscribe"
                      :disabled="abnormalThresholdSubscribing"
                      :loading="abnormalThresholdSubscribing"
                      :precision="0"
                      :min="0"
                      :max="20"
                      :parse="parseInputInt"
                      :format="(value: number | null) => !value ? '关闭' : String(value) + ' kWh'"
                    />
                  </n-space>
                </template>
                <n-text>在当天用电量超过设定范围时，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>发送提醒</n-text>
              </n-popover>
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>电量过低提醒</n-text>
                    <n-divider vertical />
                    <n-skeleton v-if="loading" :width="140" :height="30" :sharp="false" />
                    <n-input-number
                      v-else
                      size="small"
                      button-placement="both"
                      style="width: 140px; text-align: center"
                      v-model:value="lowThreshold"
                      @update:value="lowThresholdSubscribe"
                      :disabled="lowThresholdSubscribing"
                      :loading="lowThresholdSubscribing"
                      :precision="0"
                      :min="0"
                      :max="7"
                      :parse="parseInputInt"
                      :format="(value: number | null) => !value ? '关闭' : String(value) + ' 天'"
                    />
                  </n-space>
                </template>
                <n-text>在剩余电量预计可用天数不足设定天数时，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>发送提醒</n-text>
              </n-popover>
              <n-popover placement="top" trigger="hover" width="trigger">
                <template #trigger>
                  <n-space align="center" justify="start" :size="0">
                    <n-text>用电报告推送</n-text>
                    <n-divider vertical />
                    <n-space align="center" justify="start" :size="4">
                      <n-skeleton v-if="loading" :width="74" :height="18" round />
                      <n-switch
                        v-else
                        size="large"
                        v-model:value="reportDay"
                        @update:value="reportDaySubscribe"
                        :loading="reportDaySubscribing"
                        :disabled="reportDaySubscribing"
                      >
                        <template #checked-icon>
                          <n-icon>
                            <AlertOn24Regular />
                          </n-icon>
                        </template>
                        <template #checked>日报</template>
                        <template #unchecked-icon>
                          <n-icon>
                            <AlertOff24Regular />
                          </n-icon>
                        </template>
                        <template #unchecked>日报</template>
                      </n-switch>
                      <n-skeleton v-if="loading" :width="74" :height="18" round />
                      <n-switch
                        v-else
                        size="large"
                        v-model:value="reportWeek"
                        @update:value="reportWeekSubscribe"
                        :loading="reportWeekSubscribing"
                        :disabled="reportWeekSubscribing"
                      >
                        <template #checked-icon>
                          <n-icon>
                            <AlertOn24Regular />
                          </n-icon>
                        </template>
                        <template #checked>周报</template>
                        <template #unchecked-icon>
                          <n-icon>
                            <AlertOff24Regular />
                          </n-icon>
                        </template>
                        <template #unchecked>周报</template>
                      </n-switch>
                      <n-skeleton v-if="loading" :width="74" :height="18" round />
                      <n-switch
                        v-else
                        size="large"
                        v-model:value="reportMonth"
                        @update:value="reportMonthSubscribe"
                        :loading="reportMonthSubscribing"
                        :disabled="reportMonthSubscribing"
                      >
                        <template #checked-icon>
                          <n-icon>
                            <AlertOn24Regular />
                          </n-icon>
                        </template>
                        <template #checked>月报</template>
                        <template #unchecked-icon>
                          <n-icon>
                            <AlertOff24Regular />
                          </n-icon>
                        </template>
                        <template #unchecked>月报</template>
                      </n-switch>
                    </n-space>
                  </n-space>
                </template>
                <n-text
                  >在<b>每天</b>/<b>每周一</b>/<b>每月1号</b>的<b>早晨7点</b>，会向绑定的<b>QQ</b>/<b>QQ群</b>/<b>钉钉</b>推送<b>昨日</b>/<b>上周</b>/<b>上月</b>用电报告</n-text
                >
              </n-popover>
            </n-space>
          </n-grid-item>
        </n-grid>
        <template #header-extra>
          <n-popover placement="left" trigger="hover">
            <template #trigger>
              <n-tag round :bordered="false">
                <template #icon>
                  <n-icon>
                    <cloud-download-outline />
                  </n-icon>
                </template>
                <n-skeleton v-if="loading" text :width="50" round />
                <n-time v-else :time="userInfo?.update_time" type="relative" />
              </n-tag>
            </template>
            <span>数据同步于：</span>
            <n-skeleton v-if="loading" text :width="138" round />
            <n-time v-else :time="userInfo?.update_time" type="datetime" />
          </n-popover>
        </template>
        <template #footer>
          <n-space align="center" size="small">
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="success">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ area }}</span>
                </n-tag>
              </template>
              <n-text>校区</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="success">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ building }}</span>
                </n-tag>
              </template>
              <n-text>宿舍楼</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="success">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ room }}</span>
                </n-tag>
              </template>
              <n-text>寝室</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="success">
                  <n-skeleton v-if="loading" text :width="16" round />
                  <span v-else>{{ bed }}</span>
                </n-tag>
              </template>
              <n-text>床位</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag round type="success">
                  <n-skeleton v-if="loading" text :width="16" round />
                  <span v-else>{{ mates }}</span>
                </n-tag>
              </template>
              <n-text>寝室人数</n-text>
            </n-popover>

            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="info">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ userInfo?.info.number }}</span>
                </n-tag>
              </template>
              <n-text>学号</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="info">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ userInfo?.info.faculty }}</span>
                </n-tag>
              </template>
              <n-text>学院</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="info">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ userInfo?.info.grade }}</span>
                </n-tag>
              </template>
              <n-text>年级</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="info">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ userInfo?.info.major }}</span>
                </n-tag>
              </template>
              <n-text>专业</n-text>
            </n-popover>
            <n-popover trigger="hover">
              <template #trigger>
                <n-tag type="info">
                  <n-skeleton v-if="loading" text :width="50" :sharp="false" />
                  <span v-else>{{ userInfo?.info.class }}</span>
                </n-tag>
              </template>
              <n-text>班级</n-text>
            </n-popover>
          </n-space>
        </template>
        <template #action v-if="!loading">
          <n-space align="center" justify="space-between">
            <n-button attr-type="button" @click="passwordChangeShow = true"> 修改密码 </n-button>
            <n-button attr-type="button" :loading="logouting" @click="logoutClick"> 退出登录 </n-button>
          </n-space>
        </template>
      </n-card>
      <RoomInfoCard v-if="roomInfoMobile" style="width: min(var(--container-width), 1200px)" :room="{ area, building, room }" refresh compare />
    </n-space>
    <n-space align="center" justify="center">
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="roomCanBeShow" type="电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="roomCanBeShow" type="用电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 600px)" v-if="roomCanBeShow" type="日用电量" :room="{ area, building, room }" />
      <RoomChart style="width: min(var(--container-width), 900px)" v-if="roomCanBeShow" type="每日用电量" :room="{ area, building, room }" />
    </n-space>
  </n-space>
  <n-modal v-model:show="qqBindShow">
    <n-card style="width: min(80vw, 600px)" title="绑定QQ" role="dialog">
      <n-steps vertical v-model:current="qqBindStep">
        <n-step title="添加QQ机器人为好友">
          <n-text>QQ: 2536960066</n-text>
          <br />
          <n-button tag="a" href="http://wpa.qq.com/msgrd?v=3&uin=2536960066&site=qq&menu=yes" target="_blank">跳转添加(手机可能无法跳转)</n-button>
          <br />
          <n-collapse>
            <n-collapse-item title="扫码添加" name="1">
              <img src="@/assets/images/qq.jpg" alt="QQ二维码" style="width: 100%" />
            </n-collapse-item>
          </n-collapse>
        </n-step>
        <n-step title="发送绑定指令">
          <n-text>就是发送“绑定”两个字</n-text>
        </n-step>
        <n-step title="根据提示完成绑定引导">
          <n-text>别看我，看机器人</n-text>
        </n-step>
        <n-step title="刷新页面">
          <n-button @click="reload">点我刷新</n-button>
        </n-step>
      </n-steps>
    </n-card>
  </n-modal>
  <n-modal
    v-model:show="qqUnbindShow"
    preset="dialog"
    title="解绑QQ"
    content="确认要解绑吗？"
    positive-text="确认"
    negative-text="算了"
    :loading="qqUnbinding"
    @positive-click="qqUnbind"
  />
  <n-modal v-model:show="qqGroupBindShow">
    <n-card style="width: min(80vw, 600px)" title="绑定QQ群" role="dialog">
      <n-steps vertical v-model:current="qqGroupBindStep">
        <n-step title="完成绑定QQ机器人">
          <n-text>怎么绑？请在页面中点击绑定QQ</n-text>
        </n-step>
        <n-step title="将机器人拉入QQ群">
          <n-text>建议为寝室群，因为QQ群绑定之后只会用于订阅消息的推送</n-text>
        </n-step>
        <n-step title="在群中@机器人并发送绑定指令">
          <n-text>就是“@电宝 Bot”并且发送“绑定”两个字</n-text>
        </n-step>
        <n-step title="根据提示完成绑定引导">
          <n-text>别看我，看机器人</n-text>
        </n-step>
        <n-step title="刷新页面">
          <n-button @click="reload">点我刷新</n-button>
        </n-step>
      </n-steps>
    </n-card>
  </n-modal>
  <n-modal
    v-model:show="qqGroupUnbindShow"
    preset="dialog"
    title="解绑QQ群"
    content="确认要解绑吗？"
    positive-text="确认"
    negative-text="算了"
    :loading="qqGroupUnbinding"
    @positive-click="qqGroupUnbind"
  />
  <n-modal v-model:show="dingtalkBindShow">
    <n-card style="width: min(80vw, 600px)" title="绑定钉钉" role="dialog"> </n-card>
  </n-modal>
  <n-modal
    v-model:show="dingtalkUnbindShow"
    preset="dialog"
    title="解绑钉钉"
    content="确认要解绑吗？"
    positive-text="确认"
    negative-text="算了"
    :loading="dingtalkUnbinding"
    @positive-click="dingtalkUnbind"
  />
  <n-modal v-model:show="passwordChangeShow">
    <n-card style="width: min(80vw, 600px)" title="修改密码" role="dialog">
      <n-space vertical align="center" justify="center" item-style="width: min(var(--container-width), 600px)">
        <n-form ref="passwordChangeForm" :model="passwordChangeFormValue" :rules="passwordChangeFormRule">
          <n-form-item label="当前密码" path="passwordOld">
            <n-input
              v-model:value="passwordChangeFormValue.passwordOld"
              placeholder="默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号"
              type="password"
            />
          </n-form-item>
          <n-form-item label="新密码" path="passwordNew">
            <n-input v-model:value="passwordChangeFormValue.passwordNew" placeholder="就是新密码" type="password" show-password-on="mousedown" />
          </n-form-item>
          <n-form-item label="确认密码" path="passwordAgain">
            <n-input v-model:value="passwordChangeFormValue.passwordAgain" placeholder="再输一遍新密码吧" type="password" show-password-on="mousedown" />
          </n-form-item>
        </n-form>
        <n-space align="center" justify="space-around">
          <n-button size="large" type="primary" :loading="passwordChanging" @click="passwordChangeFormClick" style="width: 120px"> 修改 </n-button>
        </n-space>
      </n-space>
    </n-card>
  </n-modal>
</template>

<script lang="ts">
export default {
  name: "MyRoom",
};

import { ref, watch, onMounted, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInst, FormItemRule } from "naive-ui";

import { subscribeAbnormal, subscribeLow, subscribeReport, getRoomInfo, logout, changePassword } from "@/api";
import { messageApi, refreshUserInfo } from "@/utils";
</script>

<script lang="ts" setup>
import {
  NSpace,
  NButton,
  NCard,
  NH2,
  NText,
  NDivider,
  NTag,
  NPopover,
  NTime,
  NIcon,
  NSkeleton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NGrid,
  NGridItem,
  NInputNumber,
  NSwitch,
  NSteps,
  NStep,
  NCollapse,
  NCollapseItem,
} from "naive-ui";
import { CloudDownloadOutline } from "@vicons/ionicons5";
import { AlertOff24Regular, AlertOn24Regular } from "@vicons/fluent";

import { parseInputInt, userInfo } from "@/utils";
import RoomInfoCard from "@/components/RoomInfoCard.vue";
import RoomChart from "@/components/RoomChart.vue";
import { unbind } from "@/api";

const route = useRoute();
const router = useRouter();
const reload = inject<ReloadFunc>("f_reload")!;

const loading = ref(true);

const roomCanBeShow = ref(false);
const roomInfoPC = ref<typeof RoomInfoCard>();
const roomInfoMobile = ref(false);
watch(roomInfoPC, (newState) => {
  roomInfoMobile.value = !newState && roomCanBeShow.value;
});
watch(roomCanBeShow, (newState) => {
  roomInfoMobile.value = !roomInfoPC.value && newState;
});

const qqBindShow = ref(false);
const qqBindStep = ref(1);

const qqUnbindShow = ref(false);
const qqUnbinding = ref(false);
async function qqUnbind() {
  qqUnbinding.value = true;
  const unbindResult = await unbind("qq");
  if (typeof unbindResult === "string") {
    messageApi.value?.error(unbindResult);
  } else {
    messageApi.value?.success("解绑成功");
    await reload();
  }
  qqUnbinding.value = false;
}

const qqGroupBindShow = ref(false);
const qqGroupBindStep = ref(1);

const qqGroupUnbindShow = ref(false);
const qqGroupUnbinding = ref(false);
async function qqGroupUnbind() {
  qqGroupUnbinding.value = true;
  const unbindResult = await unbind("qq_group");
  if (typeof unbindResult === "string") {
    messageApi.value?.error(unbindResult);
  } else {
    messageApi.value?.success("解绑成功");
    await reload();
  }
  qqGroupUnbinding.value = false;
}

const dingtalkBindShow = ref(false);
const dingtalkBindStep = ref(1);

const dingtalkUnbindShow = ref(false);
const dingtalkUnbinding = ref(false);
async function dingtalkUnbind() {
  dingtalkUnbinding.value = true;
  const unbindResult = await unbind("dingtalk");
  if (typeof unbindResult === "string") {
    messageApi.value?.error(unbindResult);
  } else {
    messageApi.value?.success("解绑成功");
    await reload();
  }
  dingtalkUnbinding.value = false;
}

const abnormalThreshold = ref(0);
const abnormalThresholdSubscribing = ref(false);
async function abnormalThresholdSubscribe(abnormal: number | null) {
  if (abnormal === null) {
    messageApi.value?.error("输入数值异常");
    return;
  }
  abnormalThresholdSubscribing.value = true;
  const abnormalThresholdSubscribeResult = await subscribeAbnormal(abnormal);
  if (typeof abnormalThresholdSubscribeResult === "string") {
    messageApi.value?.error(abnormalThresholdSubscribeResult);
  } else {
    messageApi.value?.success("修改成功");
  }
  abnormalThresholdSubscribing.value = false;
}

const lowThreshold = ref(0);
const lowThresholdSubscribing = ref(false);
async function lowThresholdSubscribe(low: number | null) {
  if (low === null) {
    messageApi.value?.error("输入数值异常");
    return;
  }
  lowThresholdSubscribing.value = true;
  const lowThresholdSubscribeResult = await subscribeLow(low);
  if (typeof lowThresholdSubscribeResult === "string") {
    messageApi.value?.error(lowThresholdSubscribeResult);
  } else {
    messageApi.value?.success("修改成功");
  }
  lowThresholdSubscribing.value = false;
}

const reportDay = ref(false);
const reportDaySubscribing = ref(false);
async function reportDaySubscribe(enable: boolean) {
  reportDaySubscribing.value = true;
  const reportDaySubscribeResult = await subscribeReport("day", enable);
  if (typeof reportDaySubscribeResult === "string") {
    messageApi.value?.error(reportDaySubscribeResult);
  } else {
    messageApi.value?.success("修改成功");
  }
  reportDaySubscribing.value = false;
}

const reportWeek = ref(false);
const reportWeekSubscribing = ref(false);
async function reportWeekSubscribe(enable: boolean) {
  reportWeekSubscribing.value = true;
  const reportWeekSubscribeResult = await subscribeReport("week", enable);
  if (typeof reportWeekSubscribeResult === "string") {
    messageApi.value?.error(reportWeekSubscribeResult);
  } else {
    messageApi.value?.success("修改成功");
  }
  reportWeekSubscribing.value = false;
}

const reportMonth = ref(false);
const reportMonthSubscribing = ref(false);
async function reportMonthSubscribe(enable: boolean) {
  reportMonthSubscribing.value = true;
  const reportMonthSubscribeResult = await subscribeReport("month", enable);
  if (typeof reportMonthSubscribeResult === "string") {
    messageApi.value?.error(reportMonthSubscribeResult);
  } else {
    messageApi.value?.success("修改成功");
  }
  reportMonthSubscribing.value = false;
}

const passwordChangeShow = ref(false);
const passwordChanging = ref(false);
const passwordChangeForm = ref<FormInst>();
const passwordChangeFormValue = ref({
  passwordOld: "",
  passwordNew: "",
  passwordAgain: "",
});
const passwordChangeFormRule = {
  passwordOld: {
    required: true,
    message: "请输入当前密码",
    trigger: ["input", "blur"],
  },
  passwordNew: {
    required: true,
    message: "请输入新密码",
    trigger: ["input", "blur"],
  },
  passwordAgain: [
    {
      required: true,
      message: "请再次输入新密码",
      trigger: ["input", "blur"],
    },
    {
      validator: (rule: FormItemRule, passwordAgain: string) =>
        passwordChangeFormValue.value.passwordNew.length >= passwordAgain.length && passwordChangeFormValue.value.passwordNew.startsWith(passwordAgain),
      message: "请确认新密码是否输入一致",
      trigger: "input",
    },
    {
      validator: (rule: FormItemRule, passwordAgain: string) => passwordChangeFormValue.value.passwordNew === passwordAgain,
      message: "请确认新密码是否输入一致",
      trigger: "blur",
    },
  ],
};

async function passwordChangeFormClick(e: MouseEvent) {
  e.preventDefault();
  passwordChangeForm.value?.validate(async (errors) => {
    passwordChanging.value = true;
    if (!errors) {
      const passwordChangeResult = await changePassword(passwordChangeFormValue.value.passwordOld, passwordChangeFormValue.value.passwordNew);
      if (typeof passwordChangeResult === "string") {
        messageApi.value?.error(passwordChangeResult);
      } else {
        router.push({ name: "Login", query: { redirect: route.fullPath } });
      }
    }
    passwordChanging.value = false;
  });
}

const logouting = ref(false);
async function logoutClick(e: MouseEvent) {
  e.preventDefault();
  logouting.value = true;
  await logout();
  router.push({ name: "Login", query: { redirect: route.fullPath } });
  logouting.value = false;
}

const area = ref("");
const building = ref("");
const room = ref("");
const bed = ref("");
const mates = ref("");

onMounted(async () => {
  await refreshUserInfo(route, router);
  if (userInfo.value) {
    abnormalThreshold.value = userInfo.value.app.subscribe.abnormal;
    lowThreshold.value = userInfo.value.app.subscribe.low;
    reportDay.value = userInfo.value.app.subscribe.report.day;
    reportWeek.value = userInfo.value.app.subscribe.report.week;
    reportMonth.value = userInfo.value.app.subscribe.report.month;

    if (userInfo.value.position.custom.state) {
      area.value = userInfo.value.position.custom.area ?? userInfo.value.position.area ?? "存在问题";
      building.value = userInfo.value.position.custom.building ?? userInfo.value.position.building ?? "存在问题";
      room.value = userInfo.value.position.custom.room ?? userInfo.value.position.room ?? "存在问题";
      roomCanBeShow.value = area.value !== "存在问题" && building.value !== "存在问题" && room.value !== "存在问题";
    } else {
      area.value = userInfo.value.position.area ?? "无";
      building.value = userInfo.value.position.building ?? "无";
      room.value = userInfo.value.position.room ?? "无";
      roomCanBeShow.value = area.value !== "无" && building.value !== "无" && room.value !== "无";
    }
    bed.value = (userInfo.value.position.bed ? String(userInfo.value.position.bed) : "🤔") + "号床";
    if (roomCanBeShow.value) {
      const roomInfo = await getRoomInfo(area.value, building.value, room.value);
      mates.value = String(roomInfo.nums) + "人寝";
    } else {
      mates.value = "🤔人寝";
    }
    loading.value = false;
  }
});
</script>

<style scoped></style>
