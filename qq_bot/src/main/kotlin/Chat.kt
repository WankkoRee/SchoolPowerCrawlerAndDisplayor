package cn.wankkoree.sp.bot.qq

import net.mamoe.mirai.Bot
import net.mamoe.mirai.contact.Group
import net.mamoe.mirai.event.EventPriority
import net.mamoe.mirai.event.events.*
import net.mamoe.mirai.message.data.*
import net.mamoe.mirai.message.nextMessageOrNull


suspend fun UserMessageEvent.cmdBind() {
    Mongo.getUserByQQ(sender.id).let {
        if (it != null) {
            subject.sendMessage(buildMessageChain {
                +"你已绑定 ${it.info.name} 的电宝账号，如需绑定其他账号请先解除绑定\n"
                +"\n"
                +"本次[个人绑定]服务结束"
            })
            return
        }
    }

    subject.sendMessage(buildMessageChain {
        +"请在 30 秒内发送：你的电宝账号\n"
        +"\n"
        +"账号就是你的学号"
    })
    val username = (nextMessageOrNull(30_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 30 秒\n"
            +"\n"
            +"本次[个人绑定]服务结束"
        })
        return
    }).content

    subject.sendMessage(buildMessageChain {
        +"请在 60 秒内发送：你的电宝密码\n"
        +"\n"
        +"密码默认为手机号后六位，或姓名小写全拼，取决于随行校园是否绑定已手机号"
    })
    val password = (nextMessageOrNull(60_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 60 秒\n"
            +"\n"
            +"本次[个人绑定]服务结束"
        })
        return
    }).content

    subject.sendMessage(buildMessageChain {
        val user = Mongo.login(username, password) ?: run {
            +"账号或密码错误\n"
            +"\n"
            +"本次[个人绑定]服务结束"
            return@buildMessageChain
        }
        if (user.app.qq != null) {
            +"此电宝账号已绑定其他QQ，你可以在网页端登录你的电宝账号进行解绑\n"
            +"\n"
            +"本次[个人绑定]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.bindByQQ(user._id, sender.id)
        if (result.modifiedCount != 1L) {
            +"绑定失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
            +"\n"
            +"本次[个人绑定]服务结束"
            return@buildMessageChain
        }
        +"绑定成功"
    })
}

suspend fun UserMessageEvent.cmdUnbind() {
    val user = Mongo.getUserByQQ(sender.id) ?: run {
        subject.sendMessage(buildMessageChain {
            +"你还未绑定电宝账号，无法使用[个人解绑]功能\n"
            +"\n"
            +"本次[个人解绑]服务结束"
        })
        return
    }

    subject.sendMessage(buildMessageChain {
        +"请在 20 秒内发送：是 或 否\n"
        +"\n"
        +"确认要解绑 ${user.info.name} 的电宝账号吗？"
    })
    val confirm = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +"已超过 20 秒\n"
            +"\n"
            +"本次[个人解绑]服务结束"
        })
        return
    }).content.trim() == "是"

    subject.sendMessage(buildMessageChain {
        if (!confirm) {
            +"主动拒绝\n"
            +"\n"
            +"本次[个人解绑]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.unbindByQQ(user._id)
        if (result.modifiedCount != 1L) {
            +"解绑失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
            +"\n"
            +"本次[个人解绑]服务结束"
            return@buildMessageChain
        }
        +"解绑成功"
    })
}

suspend fun GroupMessageEvent.cmdBind() {
    val user = Mongo.getUserByQQ(sender.id) ?: run {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +"你还未绑定电宝账号，需先私聊绑定，无法使用[群绑定]功能\n"
            +"\n"
            +"本次[群绑定]服务结束"
        })
        return
    }
    Mongo.getUserByQQGroup(subject.id).let {
        if (it != null) {
            subject.sendMessage(buildMessageChain {
                +QuoteReply(message)
                +"群已绑定 ${it.info.name} 的电宝账号，如需绑定其他账号请先解除绑定\n"
                +"\n"
                +"本次[群绑定]服务结束"
            })
            return
        }
    }
    if (subject.members.size > 10) {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +"群人数过多，不建议绑定非寝室群\n"
            +"\n"
            +"本次[群绑定]服务结束"
        })
        return
    }

    subject.sendMessage(buildMessageChain {
        +QuoteReply(message)
        +"请在 20 秒内发送：是 或 否\n"
        +"\n"
        +"确认要绑定 ${user.info.name} 的电宝账号到群吗？"
    })
    val confirm = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +"已超过 20 秒\n"
            +"\n"
            +"本次[群绑定]服务结束"
        })
        return
    }).content.trim() == "是"

    subject.sendMessage(buildMessageChain {
        +QuoteReply(message)
        if (!confirm) {
            +"主动拒绝\n"
            +"\n"
            +"本次[群绑定]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.bindByQQGroup(user._id, subject.id)
        if (result.modifiedCount != 1L) {
            +"绑定失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
            +"\n"
            +"本次[群绑定]服务结束"
            return@buildMessageChain
        }
        +"绑定成功"
    })
}

suspend fun GroupMessageEvent.cmdUnbind() {
    val user = Mongo.getUserByQQGroup(subject.id) ?: run {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +"群还未绑定电宝账号，需先绑定，无法使用[群解绑]功能\n"
            +"\n"
            +"本次[群解绑]服务结束"
        })
        return
    }
    // 因为小群肯定是寝室群，直接解绑不用管是不是自己的号也没事，大群肯定是利用时间差绑定的，所以也可以直接解绑后不可再绑定

    subject.sendMessage(buildMessageChain {
        +QuoteReply(message)
        +"请在 20 秒内发送：是 或 否\n"
        +"\n"
        +"确认要解绑 ${user.info.name} 的电宝账号吗？"
    })
    val confirm = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            +QuoteReply(message)
            +"已超过 20 秒\n"
            +"\n"
            +"本次[群解绑]服务结束"
        })
        return
    }).content.trim() == "是"

    subject.sendMessage(buildMessageChain {
        +QuoteReply(message)
        if (!confirm) {
            +"主动拒绝\n"
            +"\n"
            +"本次[群解绑]服务结束"
            return@buildMessageChain
        }
        val result = Mongo.unbindByQQGroup(user._id)
        if (result.modifiedCount != 1L) {
            +"解绑失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
            +"\n"
            +"本次[群解绑]服务结束"
            return@buildMessageChain
        }
        +"解绑成功"
    })
}

suspend fun MessageEvent.cmdQueryPower(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    val user = Mongo.getUserByQQ(sender.id) ?: run {
        +"你还未绑定电宝账号，需先私聊绑定，无法使用[查余额]功能\n"
        +"\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }

    val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
        +"无法获知你的校区，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }
    val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
        +"无法获知你的宿舍楼，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
        +"本次[查余额]服务结束"
        return@buildMessageChain
    }
    val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
        +"无法获知你的寝室，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
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
    val user = Mongo.getUserByQQ(sender.id) ?: run {
        +"你还未绑定电宝账号，需先私聊绑定，无法使用[查用电]功能\n"
        +"\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }

    val area = if (user.position.custom.state && user.position.custom.area != null) user.position.custom.area else user.position.area ?: run {
        +"无法获知你的校区，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }
    val building = if (user.position.custom.state && user.position.custom.building != null) user.position.custom.building else user.position.building ?: run {
        +"无法获知你的宿舍楼，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
        +"本次[查用电]服务结束"
        return@buildMessageChain
    }
    val room = if (user.position.custom.state && user.position.custom.room != null) user.position.custom.room else user.position.room ?: run {
        +"无法获知你的寝室，请联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
        +"\n"
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
    +"http://power.daixia.hu/\n"
    +"\n"
    +"需要处于校园网中方可打开，但对于是否拥有校园卡套餐没有要求。\n"
    +"即：只要你是本校学生，都可以登录校园网访问本服务。"
})

suspend fun MessageEvent.cmdUnknown(quote: Boolean = false, at: Boolean = false) = subject.sendMessage(buildMessageChain {
    if (quote) +QuoteReply(message)
    if (at) +At(sender)
    +"抱歉，我还不能理解你的意思。当前我明白的指令有：\n"
    +"\n"
    +"[绑定]:\n"
    +"私聊发送，则是将你的QQ关联至电宝账号，是各种查询服务、订阅服务正常使用的前提\n"
    +"群聊发送，则是将QQ群关联至你的电宝账号，是各种订阅服务正常使用的前提\n"
    +"\n"
    +"[解绑]:\n"
    +"就是上面的反向操作\n"
    +"\n"
    +"[查余额]:\n"
    +"看看还剩多少、能用多久\n"
    +"\n"
    +"[查用电]:\n"
    +"看看用了多少\n"
    +"\n"
    +"[官网]:\n"
    +"就是记不住网站的时候方便一键跳转\n"
})

suspend fun FriendAddEvent.cmdWelcome() = friend.sendMessage(buildMessageChain {
    +"你好，欢迎使用电宝。当前我明白的指令有：\n"
    +"\n"
    +"[绑定]:\n"
    +"私聊发送，则是将你的QQ关联至电宝账号，是各种查询服务、订阅服务正常使用的前提\n"
    +"群聊发送，则是将QQ群关联至你的电宝账号，是各种订阅服务正常使用的前提\n"
    +"\n"
    +"[解绑]:\n"
    +"就是上面的反向操作\n"
    +"\n"
    +"[查余额]:\n"
    +"看看还剩多少、能用多久\n"
    +"\n"
    +"[查用电]:\n"
    +"看看用了多少\n"
    +"\n"
    +"[官网]:\n"
    +"就是记不住网站的时候方便一键跳转\n"
})

suspend fun Bot.registerChatEvent() {
    eventChannel
        .subscribeAlways<UserMessageEvent>(priority=EventPriority.LOWEST) {
            when (message.content.trim().trim('[', ']')) {
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
            when (message.filterIsInstance<PlainText>().joinToString { it.content.trim() }.trim('[', ']')) {
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
            Mongo.getUserByQQ(friend.id).let {
                if (it != null)
                    Mongo.unbindByQQ(it._id)
            }
        }
    eventChannel
        .subscribeAlways<NewFriendRequestEvent>(priority=EventPriority.LOWEST) {
            accept()
            logger.info("同意好友请求")
        }
    eventChannel
        .subscribeAlways<FriendAddEvent>(priority=EventPriority.LOWEST) {
            cmdWelcome()
        }
    eventChannel
        .subscribeAlways<BotInvitedJoinGroupRequestEvent>(priority=EventPriority.LOWEST) {
            accept()
            logger.info("同意拉群请求")
        }
}
