package cn.wankkoree.sp.bot.qq

import net.mamoe.mirai.Bot
import net.mamoe.mirai.contact.Group
import net.mamoe.mirai.event.EventPriority
import net.mamoe.mirai.event.events.*
import net.mamoe.mirai.message.data.*
import net.mamoe.mirai.message.nextMessageOrNull


suspend fun MessageEvent.cmdBind() {
    if (subject is Group) {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +At(sender)
            +"[绑定]服务涉及隐私，请私聊机器人使用"
        })
        return
    }
    Mongo.getUser(sender.id).let {
        if (it != null) {
            subject.sendMessage(buildMessageChain {
                +"你已绑定 ${it.info.name} 的电宝账号，如需绑定其他账号请先解除绑定\n\n"
                +"本次[绑定]服务结束"
            })
            return
        }
    }

    subject.sendMessage(buildMessageChain {
        +"请在 30 秒内发送：你的电宝账号\n\n"
        +"账号就是你的学号"
    })
    val username = (nextMessageOrNull(30_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 30 秒\n\n"
            +"本次[绑定]服务结束"
        })
        return
    }).content

    subject.sendMessage(buildMessageChain {
        +"请在 60 秒内发送：你的电宝密码\n\n"
        +"密码默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号"
    })
    val password = (nextMessageOrNull(60_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 60 秒\n\n"
            +"本次[绑定]服务结束"
        })
        return
    }).content

    subject.sendMessage(buildMessageChain {
        val user = Mongo.login(username, password) ?: run {
            +"账号或密码错误\n\n"
            +"本次[绑定]服务结束"
            return@buildMessageChain
        }
        if (user.app.qq != null) {
            +"此电宝账号已绑定其他QQ，你可以在网页端登录你的电宝账号进行解绑\n\n"
            +"本次[绑定]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.bind(user._id, sender.id)
        if (result.modifiedCount != 1L) {
            +"绑定失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n\n"
            +"本次[绑定]服务结束"
            return@buildMessageChain
        }
        +"绑定成功"
    })
}

suspend fun MessageEvent.cmdUnbind() {
    if (subject is Group) {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +At(sender)
            +"[解绑]服务涉及隐私，请私聊机器人使用"
        })
        return
    }
    val user = Mongo.getUser(sender.id) ?: run {
        subject.sendMessage(buildMessageChain {
            +"你还未绑定电宝账号，无法使用解绑功能\n\n"
            +"本次[解绑]服务结束"
        })
        return
    }

    subject.sendMessage(buildMessageChain {
        +"请在 20 秒内发送：是 或 否\n\n"
        +"确认要解绑 ${user.info.name} 的电宝账号吗？"
    })
    val confirm = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 20 秒\n\n"
            +"本次[解绑]服务结束"
        })
        return
    }).content.trim() == "是"

    subject.sendMessage(buildMessageChain {
        if (!confirm) {
            +"主动拒绝\n\n"
            +"本次[解绑]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.unbind(user._id)
        if (result.modifiedCount != 1L) {
            +"解绑失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n\n"
            +"本次[解绑]服务结束"
        }
        +"解绑成功"
    })
}

suspend fun MessageEvent.cmdQueryPower(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    val user = Mongo.getUser(sender.id) ?: run {
        +"你还未绑定电宝账号，无法使用[查余额]功能\n\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }

    val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
        +"无法获知你的校区，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }
    val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
        +"无法获知你的宿舍楼，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }
    val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
        +"无法获知你的寝室，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }

    val (roomLastTs, roomLastPower) = Api.getRoomLast(area, building, room)
    val roomAvgDuringLast30Day = Api.getRoomAvgDuring(area, building, room, "last30d").spending

    +"你的宿舍为 $room\n"
    +"当前剩余电量 ${roomLastPower.format()} kWh\n"
    +"过去 30 天平均每日用电 ${roomAvgDuringLast30Day.format()} kWh\n"
    +"预计可用 ${(roomLastPower / roomAvgDuringLast30Day).format()} 天\n"
    +"数据更新于 ${roomLastTs.format(TimeFormat.Time)}"
})

suspend fun MessageEvent.cmdQuerySpending(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    val user = Mongo.getUser(sender.id) ?: run {
        +"你还未绑定电宝账号，无法使用[查用电]功能\n\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }

    val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
        +"无法获知你的校区，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }
    val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
        +"无法获知你的宿舍楼，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }
    val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
        +"无法获知你的寝室，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }

    val (roomLastTs, roomLastPower) = Api.getRoomLast(area, building, room)
    val roomSumDuringDay = Api.getRoomSumDuring(area, building, room, "day").spending
    val roomSumDuringWeek = Api.getRoomSumDuring(area, building, room, "week").spending
    val roomSumDuringMonth = Api.getRoomSumDuring(area, building, room, "month").spending
    val roomAvgDuringWeek = Api.getRoomAvgDuring(area, building, room, "week").spending
    val roomAvgDuringMonth = Api.getRoomAvgDuring(area, building, room, "month").spending

    +"你的宿舍为 $room\n"
    +"今日已用 ${roomSumDuringDay.format()} kWh\n"
    +"本周已用 ${roomSumDuringWeek.format()} kWh, 平均每日 ${roomAvgDuringWeek.format()} kWh\n"
    +"本月已用 ${roomSumDuringMonth.format()} kWh, 平均每日 ${roomAvgDuringMonth.format()} kWh\n"
    +"数据更新于 ${roomLastTs.format(TimeFormat.Time)}"
})

suspend fun MessageEvent.cmdWebsite(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    +"http://power.daixia.hu/\n\n"
    +"需要处于校园网中方可打开，但对于是否拥有校园卡套餐没有要求。\n"
    +"即：只要你是本校学生，都可以登录校园网访问本服务。"
})

suspend fun MessageEvent.cmdUnknown(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    +"抱歉，我还不能理解你的意思。当前我明白的指令有：\n"
    +"绑定: 将你的QQ关联至电宝账号，是各种查询服务、订阅服务正常使用的前提\n"
    +"解绑: 就是上面的反向操作\n"
    +"查余额: 看看还剩多少、能用多久\n"
    +"查用电: 看看用了多少\n"
    +"官网: 就是记不住网站的时候方便一键跳转\n"
    +"\n"
    +"另外，本机器人也可以被拉入各种群中哦"
})

suspend fun Bot.registerChatEvent() {
    eventChannel
        .subscribeAlways<UserMessageEvent>(priority=EventPriority.LOWEST) {
            when (message.content.trim()) {
                "绑定" -> {
                    cmdBind()
                }
                "解绑" -> {
                    cmdUnbind()
                }
                "查余额" -> {
                    cmdQueryPower()
                }
                "查用电" -> {
                    cmdQuerySpending()
                }
                "官网" -> {
                    cmdWebsite()
                }
                else -> {
                    cmdUnknown()
                }
            }
        }
    eventChannel
        .filterIsInstance<GroupMessageEvent>()
        .filter { event -> event.message.filterIsInstance<At>().any { at -> at.target == id } }
        .subscribeAlways<GroupMessageEvent> {
            when (message.filterIsInstance<PlainText>().joinToString { it.content }.trim()) {
                "绑定" -> {
                    cmdBind()
                }
                "解绑" -> {
                    cmdUnbind()
                }
                "查余额" -> {
                    cmdQueryPower(quote = true)
                }
                "查用电" -> {
                    cmdQuerySpending(quote = true)
                }
                "官网" -> {
                    cmdWebsite(quote = true)
                }
                else -> {
                    cmdUnknown(quote = true)
                }
            }
        }
    eventChannel
        .subscribeAlways<FriendDeleteEvent>(priority=EventPriority.LOWEST) {
            Mongo.getUser(friend.id).let {
                if (it != null)
                    Mongo.unbind(it._id)
            }
        }
    eventChannel
        .subscribeAlways<BotInvitedJoinGroupRequestEvent>(priority=EventPriority.LOWEST) {
            accept()
        }
}
