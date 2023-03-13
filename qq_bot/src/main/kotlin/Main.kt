package cn.wankkoree.sp.bot.qq

import cn.wankkoree.sp.bot.qq.Api.getRoomAvgDuring
import cn.wankkoree.sp.bot.qq.Api.getRoomLast
import cn.wankkoree.sp.bot.qq.Api.getRoomSumDuring
import cn.wankkoree.sp.bot.qq.Mongo.bind
import cn.wankkoree.sp.bot.qq.Mongo.getUser
import cn.wankkoree.sp.bot.qq.Mongo.login
import cn.wankkoree.sp.bot.qq.Mongo.unbind
import kotlinx.coroutines.runBlocking
import net.mamoe.mirai.Bot
import net.mamoe.mirai.BotFactory
import net.mamoe.mirai.event.EventPriority
import net.mamoe.mirai.event.events.FriendMessageEvent
import net.mamoe.mirai.message.data.MessageSource.Key.quote
import net.mamoe.mirai.message.data.content
import net.mamoe.mirai.message.nextMessageOrNull
import net.mamoe.mirai.utils.BotConfiguration.MiraiProtocol
import java.io.File
import java.lang.System.getenv


suspend fun Bot.registerChatEvent() {
    this.eventChannel.subscribeAlways<FriendMessageEvent>(priority=EventPriority.LOWEST) { event ->
        when (event.message.content.trim()) {
            "绑定" -> {
                getUser(subject.id).let {
                    if (it != null) {
                        subject.sendMessage("你已绑定 ${it.info.name} 的电宝账号，如需绑定其他账号请先解除绑定\n\n" +
                                "本次绑定服务结束")
                        return@subscribeAlways
                    }
                }

                subject.sendMessage("请在 30 秒内发送：你的电宝账号\n\n" +
                        "账号就是你的学号")
                val username = (nextMessageOrNull(30_000, EventPriority.HIGHEST) {
                    intercept()
                    true
                } ?: run {
                    subject.sendMessage("已超过 30 秒\n\n" +
                            "本次绑定服务结束")
                    return@subscribeAlways
                }).content

                subject.sendMessage("请在 30 秒内发送：你的电宝密码\n\n" +
                        "密码默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号")
                val password = (nextMessageOrNull(30_000, EventPriority.HIGHEST) {
                    intercept()
                    true
                } ?: run {
                    subject.sendMessage("已超过 30 秒\n\n" +
                            "本次绑定服务结束")
                    return@subscribeAlways
                }).content

                val user = login(username, password) ?: run {
                    subject.sendMessage("账号或密码错误\n\n" +
                            "本次绑定服务结束")
                    return@subscribeAlways
                }

                if (user.app.qq != null) {
                    subject.sendMessage("此账号已绑定其他qq，你可以在网页端登录你的电宝账号进行解绑\n\n" +
                            "本次绑定服务结束")
                    return@subscribeAlways
                }

                val result = bind(user._id, subject.id)
                if (result.modifiedCount == 1L) {
                    subject.sendMessage("绑定成功\n\n" +
                            "本次绑定服务结束")
                } else {
                    subject.sendMessage("绑定失败，请联系开发者qq：${getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n\n" +
                            "本次绑定服务结束")
                }
            }
            "解绑" -> {
                val user = getUser(subject.id) ?: run {
                    subject.sendMessage("你还未绑定电宝账号，无法使用解绑功能\n\n" +
                            "本次解绑服务结束")
                    return@subscribeAlways
                }

                subject.sendMessage("请在 30 秒内发送：是 或 否\n\n" +
                        "确认要解绑 ${user.info.name} 的电宝账号吗？")
                val confirm = (nextMessageOrNull(30_000, EventPriority.HIGHEST) {
                    intercept()
                    true
                } ?: run {
                    subject.sendMessage("已超过 30 秒\n\n" +
                            "本次解绑服务结束")
                    return@subscribeAlways
                }).content.trim() == "是"

                if (!confirm) {
                    subject.sendMessage("主动拒绝\n\n" +
                            "本次解绑服务结束")
                    return@subscribeAlways
                }
                val result = unbind(user._id)
                if (result.modifiedCount == 1L) {
                    subject.sendMessage("解绑成功\n\n" +
                            "本次解绑服务结束")
                } else {
                    subject.sendMessage("解绑失败，请联系开发者qq：${getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n\n" +
                            "本次解绑服务结束")
                }
            }
            "查余额" -> {
                val user = getUser(subject.id) ?: run {
                    subject.sendMessage("你还未绑定电宝账号，无法使用查电费功能\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }

                val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
                    subject.sendMessage("无法获知你的校区，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }
                val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
                    subject.sendMessage("无法获知你的宿舍楼，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }
                val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
                    subject.sendMessage("无法获知你的寝室，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }

                val (roomLastTs, roomLastPower) = getRoomLast(area, building, room)
                val roomAvgDuringLast30Day = getRoomAvgDuring(area, building, room, "last30d").spending

                subject.sendMessage("你的宿舍为 $room\n" +
                        "当前剩余电量 ${roomLastPower.format()} kWh\n" +
                        "过去 30 天平均每日用电 ${roomAvgDuringLast30Day.format()} kWh\n" +
                        "预计可用 ${(roomLastPower / roomAvgDuringLast30Day).format()} 天\n" +
                        "数据更新于 ${roomLastTs.format(TimeFormat.Time)}")
            }
            "查用电" -> {
                val user = getUser(subject.id) ?: run {
                    subject.sendMessage("你还未绑定电宝账号，无法使用查电费功能\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }

                val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
                    subject.sendMessage("无法获知你的校区，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }
                val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
                    subject.sendMessage("无法获知你的宿舍楼，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }
                val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
                    subject.sendMessage("无法获知你的寝室，请联系开发者qq：${getenv("SP_ADMIN")}\n\n" +
                            "本次查电费服务结束")
                    return@subscribeAlways
                }

                val (roomLastTs, roomLastPower) = getRoomLast(area, building, room)
                val roomSumDuringDay = getRoomSumDuring(area, building, room, "day").spending
                val roomSumDuringWeek = getRoomSumDuring(area, building, room, "week").spending
                val roomSumDuringMonth = getRoomSumDuring(area, building, room, "month").spending
                val roomAvgDuringWeek = getRoomAvgDuring(area, building, room, "week").spending
                val roomAvgDuringMonth = getRoomAvgDuring(area, building, room, "month").spending

                subject.sendMessage("你的宿舍为 $room\n" +
                        "今日已用 ${roomSumDuringDay.format()} kWh\n" +
                        "本周已用 ${roomSumDuringWeek.format()} kWh, 平均每日 ${roomAvgDuringWeek.format()} kWh\n" +
                        "本月已用 ${roomSumDuringMonth.format()} kWh, 平均每日 ${roomAvgDuringMonth.format()} kWh\n" +
                        "数据更新于 ${roomLastTs.format(TimeFormat.Time)}")
            }
            "官网" -> {
                subject.sendMessage("http://power.daixia.hu/\n\n" +
                        "需要处于校园网中方可打开，但对于是否拥有校园卡套餐没有要求。\n" +
                        "即：只要你是本校学生，都可以登录校园网访问本服务。")
            }
            else -> {
                event.subject.sendMessage(event.message.quote() + "抱歉，我还不能理解你的意思。当前我明白的指令有：绑定、解绑、查余额、查用电")
            }
        }
    }
}

object WithConfiguration {
    @JvmStatic
    fun main(args: Array<String>): Unit = runBlocking {

        val bot = BotFactory.newBot(getenv("SP_QQ").toLong(), getenv("SP_PASSWORD")) {
            workingDir = File("./runtime")
            protocol = MiraiProtocol.ANDROID_PHONE
            fileBasedDeviceInfo()
            autoReconnectOnForceOffline = true
            contactListCache {
                friendListCacheEnabled = true
                groupMemberListCacheEnabled = true
            }
        }

//        bot.eventChannel.subscribeAlways<BotOnlineEvent> {event ->
//            bot.getFriend(getenv("SP_ADMIN").toLong())?.sendMessage("机器人已上线")
//        }

        bot.registerChatEvent()
        bot.login()
        Redis.register(bot)
    }
}