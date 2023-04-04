package cn.wankkoree.sp.bot.qq

import net.mamoe.mirai.Bot
import net.mamoe.mirai.event.EventPriority
import net.mamoe.mirai.event.events.*
import net.mamoe.mirai.message.data.*
import net.mamoe.mirai.message.nextMessageOrNull


fun  MessageChainBuilder.commandsList () {
    +"当前我明白的指令有：\n"
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
    +"[订阅管理]:\n"
    +"设置关于异常耗电、电量过低、用电报告的订阅\n"
    +"\n"
    +"[官网]:\n"
    +"功能比机器人更加全面，欢迎使用\n"
}

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
            +"账号或密码错误，如果不知道密码可联系开发者QQ：${System.getenv("SP_ADMIN")}\n"
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

suspend fun MessageEvent.cmdSubscribe(quote: Boolean = false, at: Boolean = false) {
    val user = Mongo.getUserByQQ(sender.id) ?: run {
        subject.sendMessage(buildMessageChain {
            if (quote) +QuoteReply(message)
            if (at) +At(sender)
            +"你还未绑定电宝账号，无法使用[订阅管理]功能\n"
            +"\n"
            +"本次[订阅管理]服务结束"
        })
        return
    }

    subject.sendMessage(buildMessageChain {
        if (quote) +QuoteReply(message)
        if (at) +At(sender)
        +"当前可管理的订阅功能有：\n"
        +"\n"
        +"1. 异常耗电提醒\n"
        +"2. 电量过低提醒\n"
        +"3. 用电报告推送\n"
        +"\n"
        +"请发送你需要管理的订阅功能相应编号或名称，如：1 或 异常耗电提醒"
    })
    val subscribeType = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
        intercept()
        true
    } ?: run {
        subject.sendMessage(buildMessageChain {
            if (quote) +QuoteReply(message)
            if (at) +At(sender)
            +"已超过 20 秒\n"
            +"\n"
            +"本次[订阅管理]服务结束"
        })
        return
    }).content.trim()

    when (subscribeType) {
        "1", "异常耗电提醒", "异常耗电" -> {
            val subscribeAbnormalState = Mongo.getSubscribeAbnormalState(user._id)
            subject.sendMessage(buildMessageChain {
                if (quote) +QuoteReply(message)
                if (at) +At(sender)
                when (subscribeAbnormalState) {
                    0 -> +"你未开启[异常耗电提醒]\n"
                    else -> +"你已设置[异常耗电提醒]阈值为 $subscribeAbnormalState kWh\n"
                }
                +"请发送0~20之间的整数\n"
                +"0为关闭，其他为开启并设置耗电阈值\n"
                +"开启后，若某日用电量超过阈值，则会发送提醒\n"
            })
            val subscribeAbnormal = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                intercept()
                true
            } ?: run {
                subject.sendMessage(buildMessageChain {
                    if (quote) +QuoteReply(message)
                    if (at) +At(sender)
                    +"已超过 20 秒\n"
                    +"\n"
                    +"本次[订阅管理]服务结束"
                })
                return
            }).content.trim().toIntOrNull()
            subject.sendMessage(buildMessageChain {
                if (quote) +QuoteReply(message)
                if (at) +At(sender)
                when (subscribeAbnormal) {
                    subscribeAbnormalState -> {
                        +"世界线没有发生变动哦\n"
                        +"\n"
                        +"本次[订阅管理]服务结束"
                    }
                    in 0..20 -> {
                        val result = Mongo.setSubscribeAbnormalState(user._id, subscribeAbnormal!!)
                        if (result.modifiedCount != 1L) {
                            +"设置失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
                            +"\n"
                            +"本次[订阅管理]服务结束"
                            return@buildMessageChain
                        }
                        +"设置成功"
                    }
                    else -> {
                        +"抱歉，无法理解你发送的[异常耗电提醒]阈值\n"
                        +"\n"
                        +"本次[订阅管理]服务结束"
                    }
                }
            })
        }
        "2", "电量过低提醒", "电量过低" -> {
            val subscribeLowState = Mongo.getSubscribeLowState(user._id)
            subject.sendMessage(buildMessageChain {
                if (quote) +QuoteReply(message)
                if (at) +At(sender)
                when (subscribeLowState) {
                    0 -> +"你未开启[电量过低提醒]\n"
                    else -> +"你已设置[电量过低提醒]阈值为 $subscribeLowState 天\n"
                }
                +"请发送0~7之间的整数\n"
                +"0为关闭，其他为开启并设置剩余电量预计可用天数阈值\n"
                +"开启后，若剩余电量预计可用天数不足阈值，则会发送提醒\n"
            })
            val subscribeLow = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                intercept()
                true
            } ?: run {
                subject.sendMessage(buildMessageChain {
                    if (quote) +QuoteReply(message)
                    if (at) +At(sender)
                    +"已超过 20 秒\n"
                    +"\n"
                    +"本次[订阅管理]服务结束"
                })
                return
            }).content.trim().toIntOrNull()
            subject.sendMessage(buildMessageChain {
                if (quote) +QuoteReply(message)
                if (at) +At(sender)
                when (subscribeLow) {
                    subscribeLowState -> {
                        +"世界线没有发生变动哦\n"
                        +"\n"
                        +"本次[订阅管理]服务结束"
                    }
                    in 0..7 -> {
                        val result = Mongo.setSubscribeLowState(user._id, subscribeLow!!)
                        if (result.modifiedCount != 1L) {
                            +"设置失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
                            +"\n"
                            +"本次[订阅管理]服务结束"
                            return@buildMessageChain
                        }
                        +"设置成功"
                    }
                    else -> {
                        +"抱歉，无法理解你发送的[电量过低提醒]阈值\n"
                        +"\n"
                        +"本次[订阅管理]服务结束"
                    }
                }
            })
        }
        "3", "用电报告推送", "用电报告" -> {
            subject.sendMessage(buildMessageChain {
                if (quote) +QuoteReply(message)
                if (at) +At(sender)
                +"当前可管理的用电报告有：\n"
                +"\n"
                +"1. 日报\n"
                +"2. 周报\n"
                +"3. 月报\n"
                +"\n"
                +"请发送你需要管理的用电报告相应编号或名称，如：1 或 日报"
            })
            val subscribeReportType = (nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                intercept()
                true
            } ?: run {
                subject.sendMessage(buildMessageChain {
                    if (quote) +QuoteReply(message)
                    if (at) +At(sender)
                    +"已超过 20 秒\n"
                    +"\n"
                    +"本次[订阅管理]服务结束"
                })
                return
            }).content.trim()

            when (subscribeReportType) {
                "1", "日报" -> {
                    val subscribeReportDayState = Mongo.getSubscribeReportDayState(user._id)
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        if (subscribeReportDayState) {
                            +"你已开启[用电报告推送-日报]\n"
                        } else {
                            +"你未开启[用电报告推送-日报]\n"
                        }
                        +"请发送{1、0、开、关、开启、关闭}之间的文本\n"
                        +"{0、关、关闭}为关闭日报推送，{1、开、开启}为开启日报推送\n"
                        +"开启后，在每天的早晨7点，会向绑定的QQ/QQ群/钉钉推送昨日用电报告\n"
                    })
                    val subscribeReportDay = when ((nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                        intercept()
                        true
                    } ?: run {
                        subject.sendMessage(buildMessageChain {
                            if (quote) +QuoteReply(message)
                            if (at) +At(sender)
                            +"已超过 20 秒\n"
                            +"\n"
                            +"本次[订阅管理]服务结束"
                        })
                        return
                    }).content.trim()) {
                        "0", "关", "关闭" -> false
                        "1", "开", "开启" -> true
                        else -> null
                    }
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        when (subscribeReportDay) {
                            subscribeReportDayState -> {
                                +"世界线没有发生变动哦\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                            is Boolean -> {
                                val result = Mongo.setSubscribeReportDayState(user._id, subscribeReportDay)
                                if (result.modifiedCount != 1L) {
                                    +"设置失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
                                    +"\n"
                                    +"本次[订阅管理]服务结束"
                                    return@buildMessageChain
                                }
                                +"设置成功"
                            }
                            else -> {
                                +"抱歉，无法理解你发送的[用电报告推送-日报]状态\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                        }
                    })
                }
                "2", "周报" -> {
                    val subscribeReportWeekState = Mongo.getSubscribeReportWeekState(user._id)
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        if (subscribeReportWeekState) {
                            +"你已开启[用电报告推送-周报]\n"
                        } else {
                            +"你未开启[用电报告推送-周报]\n"
                        }
                        +"请发送{1、0、开、关、开启、关闭}之间的文本\n"
                        +"{0、关、关闭}为关闭周报推送，{1、开、开启}为开启周报推送\n"
                        +"开启后，在每周一的早晨7点，会向绑定的QQ/QQ群/钉钉推送上周用电报告\n"
                    })
                    val subscribeReportWeek = when ((nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                        intercept()
                        true
                    } ?: run {
                        subject.sendMessage(buildMessageChain {
                            if (quote) +QuoteReply(message)
                            if (at) +At(sender)
                            +"已超过 20 秒\n"
                            +"\n"
                            +"本次[订阅管理]服务结束"
                        })
                        return
                    }).content.trim()) {
                        "0", "关", "关闭" -> false
                        "1", "开", "开启" -> true
                        else -> null
                    }
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        when (subscribeReportWeek) {
                            subscribeReportWeekState -> {
                                +"世界线没有发生变动哦\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                            is Boolean -> {
                                val result = Mongo.setSubscribeReportWeekState(user._id, subscribeReportWeek)
                                if (result.modifiedCount != 1L) {
                                    +"设置失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
                                    +"\n"
                                    +"本次[订阅管理]服务结束"
                                    return@buildMessageChain
                                }
                                +"设置成功"
                            }
                            else -> {
                                +"抱歉，无法理解你发送的[用电报告推送-周报]状态\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                        }
                    })
                }
                "3", "月报" -> {
                    val subscribeReportMonthState = Mongo.getSubscribeReportMonthState(user._id)
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        if (subscribeReportMonthState) {
                            +"你已开启[用电报告推送-月报]\n"
                        } else {
                            +"你未开启[用电报告推送-月报]\n"
                        }
                        +"请发送{1、0、开、关、开启、关闭}之间的文本\n"
                        +"{0、关、关闭}为关闭月报推送，{1、开、开启}为开启月报推送\n"
                        +"开启后，在每月1号的早晨7点，会向绑定的QQ/QQ群/钉钉推送上月用电报告\n"
                    })
                    val subscribeReportMonth = when ((nextMessageOrNull(20_000, EventPriority.HIGHEST) {
                        intercept()
                        true
                    } ?: run {
                        subject.sendMessage(buildMessageChain {
                            if (quote) +QuoteReply(message)
                            if (at) +At(sender)
                            +"已超过 20 秒\n"
                            +"\n"
                            +"本次[订阅管理]服务结束"
                        })
                        return
                    }).content.trim()) {
                        "0", "关", "关闭" -> false
                        "1", "开", "开启" -> true
                        else -> null
                    }
                    subject.sendMessage(buildMessageChain {
                        if (quote) +QuoteReply(message)
                        if (at) +At(sender)
                        when (subscribeReportMonth) {
                            subscribeReportMonthState -> {
                                +"世界线没有发生变动哦\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                            is Boolean -> {
                                val result = Mongo.setSubscribeReportMonthState(user._id, subscribeReportMonth)
                                if (result.modifiedCount != 1L) {
                                    +"设置失败，请联系开发者QQ：${System.getenv("SP_ADMIN")}，code: 101, debug: ${result.matchedCount}|${result.modifiedCount}\n"
                                    +"\n"
                                    +"本次[订阅管理]服务结束"
                                    return@buildMessageChain
                                }
                                +"设置成功"
                            }
                            else -> {
                                +"抱歉，无法理解你发送的[用电报告推送-月报]状态\n"
                                +"\n"
                                +"本次[订阅管理]服务结束"
                            }
                        }
                    })
                }
                else -> subject.sendMessage(buildMessageChain {
                    if (quote) +QuoteReply(message)
                    if (at) +At(sender)
                    +"抱歉，无法理解你发送的用电报告相应编号或名称\n"
                    +"\n"
                    +"本次[订阅管理]服务结束"
                })
            }
        }
        else -> subject.sendMessage(buildMessageChain {
            if (quote) +QuoteReply(message)
            if (at) +At(sender)
            +"抱歉，无法理解你发送的订阅功能相应编号或名称\n"
            +"\n"
            +"本次[订阅管理]服务结束"
        })
    }
}

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
    +"抱歉，我还不能理解你的意思。"
    commandsList()
})

suspend fun FriendAddEvent.cmdWelcome() = friend.sendMessage(buildMessageChain {
    +"你好，欢迎使用电宝。"
    commandsList()
})

suspend fun Bot.registerChatEvent() {
    eventChannel
        .subscribeAlways<UserMessageEvent>(priority=EventPriority.LOWEST) {
            when (message.content.trim().trim('[', ']')) {
                "绑定" -> cmdBind()
                "解绑" -> cmdUnbind()
                "查余额" -> cmdQueryPower()
                "查用电" -> cmdQuerySpending()
                "订阅管理" -> cmdSubscribe()
                "官网" -> cmdWebsite()
                else -> cmdUnknown()
            }
        }
    eventChannel
        .filterIsInstance<GroupMessageEvent>()
        .filter { event -> event.message.filterIsInstance<At>().any { at -> at.target == id } }
        .subscribeAlways<GroupMessageEvent> {
            when (message.filterIsInstance<PlainText>().joinToString { it.content.trim() }.trim('[', ']')) {
                "绑定" -> cmdBind()
                "解绑" -> cmdUnbind()
                "查余额" -> cmdQueryPower(quote = true)
                "查用电" -> cmdQuerySpending(quote = true)
                "订阅管理" -> cmdSubscribe(quote = true)
                "官网" -> cmdWebsite(quote = true)
                else -> cmdUnknown(quote = true)
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
