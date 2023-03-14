package cn.wankkoree.sp.bot.qq

import io.github.crackthecodeabhi.kreds.args.SetOption
import io.github.crackthecodeabhi.kreds.connection.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import net.mamoe.mirai.Bot
import net.mamoe.mirai.message.data.buildMessageChain
import java.lang.System.getenv
import java.time.Instant
import java.time.ZoneId

object Push {
    suspend fun register(bot: Bot) = runBlocking {
        val ep = Endpoint(getenv("SP_REDIS_HOST"), getenv("SP_REDIS_PORT").toInt())
        Subscriber.bot = bot
        Subscriber.client = newClient(ep).apply {
            select(getenv("SP_REDIS_DB").toULong())
        }
        newSubscriberClient(ep, Subscriber).apply {
//            select(getenv("SP_REDIS_DB").toULong())
            subscribe("power_task")
        }
    }

    object Subscriber : AbstractKredsSubscriber() {
        lateinit var bot: Bot
        lateinit var client: KredsClient
        @OptIn(DelicateCoroutinesApi::class)
        override fun onMessage(channel: String, message: String) {
            when (channel) {
                "power_task" -> {
                    val today = Instant
                        .now()
                        .atZone(ZoneId.systemDefault())
                        .withHour(0)
                        .withMinute(0)
                        .withSecond(0)
                        .withNano(0)
                    if (Instant.ofEpochMilli(message.toLong()).atZone(ZoneId.systemDefault()).isBefore(today.withHour(7))) return
                    bot.logger.info("数据已更新，拉取数据以主动推送消息")

                    today.let {Pair(
                        (it.toInstant().toEpochMilli() / 1000).toULong(),
                        (it.plusDays(1).toInstant().toEpochMilli() / 1000).toULong(),
                    )}.let { (from, next) ->
                        GlobalScope.launch {
                            pushAbnormalByQQ(from, next)
                        }
                        GlobalScope.launch {
                            pushAbnormalByQQGroup(from, next)
                        }
                        GlobalScope.launch {
                            pushLowByQQ(from, next)
                        }
                        GlobalScope.launch {
                            pushLowByQQGroup(from, next)
                        }
                    }

                    today.let {Pair(
                        (it.minusDays(1).toInstant().toEpochMilli() / 1000).toULong(),
                        (it.plusDays(1).toInstant().toEpochMilli() / 1000).toULong(),
                    )}.let { (from, next) ->
                        GlobalScope.launch {
                            pushReportDayByQQ(from, next)
                        }
                        GlobalScope.launch {
                            pushReportDayByQQGroup(from, next)
                        }
                    }

                    today.minusDays(today.dayOfWeek.value - 1L).let {Pair(
                        (it.minusWeeks(1).toInstant().toEpochMilli() / 1000).toULong(),
                        (it.plusWeeks(1).toInstant().toEpochMilli() / 1000).toULong(),
                    )}.let { (from, next) ->
                        GlobalScope.launch {
                            pushReportWeekByQQ(from, next)
                        }
                        GlobalScope.launch {
                            pushReportWeekByQQGroup(from, next)
                        }
                    }

                    today.minusDays(today.dayOfMonth - 1L).let {Pair(
                        (it.minusMonths(1).toInstant().toEpochMilli() / 1000).toULong(),
                        (it.plusMonths(1).toInstant().toEpochMilli() / 1000).toULong(),
                    )}.let { (from, next) ->
                        GlobalScope.launch {
                            pushReportMonthByQQ(from, next)
                        }
                        GlobalScope.launch {
                            pushReportMonthByQQGroup(from, next)
                        }
                    }
                }
            }
        }

        override fun onException(ex: Throwable) {
            bot.logger.error("获取数据更新订阅失败", ex)
        }

        private suspend fun pushAbnormalByQQ(ts: ULong, next: ULong) {
            Mongo.getSubscribedAbnormalUsersByQQ().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbindByQQ(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("abnormal_qq_$ts", subscriber.app.qq) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }

                    val todaySpending = Api.getRoomSumDuring(area, building, room, "day").spending
                    if (todaySpending >= subscriber.app.subscribe.abnormal) {
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"你的宿舍为 $room\n"
                            +"今日已用 ${todaySpending.format()} kWh，超出预期 ${(todaySpending - subscriber.app.subscribe.abnormal).format()} kWh\n"
                            +"请关注用电情况"
                        })
                        client.sadd("abnormal_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[异常耗电]QQ订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("abnormal_qq_$ts", next)
        }

        private suspend fun pushAbnormalByQQGroup(ts: ULong, next: ULong) {
            Mongo.getSubscribedAbnormalUsersByQQGroup().forEach { subscriber ->
                try {
                    val subscriberQQGroup = bot.getGroup(subscriber.app.qq_group!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ群 ${subscriber.app.qq_group} 已经无法找到")
                        Mongo.unbindByQQGroup(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("abnormal_qq_group_$ts", subscriber.app.qq_group) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("abnormal_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }

                    val todaySpending = Api.getRoomSumDuring(area, building, room, "day").spending
                    if (todaySpending >= subscriber.app.subscribe.abnormal) {
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"异常耗电提醒：\n"
                            +"\n"
                            +"你的宿舍为 $room\n"
                            +"今日已用 ${todaySpending.format()} kWh，超出预期 ${(todaySpending - subscriber.app.subscribe.abnormal).format()} kWh\n"
                            +"请关注用电情况"
                        })
                        client.sadd("abnormal_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[异常耗电]QQ群订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("abnormal_qq_group_$ts", next)
        }

        private suspend fun pushLowByQQ(ts: ULong, next: ULong) {
            Mongo.getSubscribedLowUsersByQQ().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbindByQQ(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("low_qq_$ts", subscriber.app.qq) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }

                    val lastPower = Api.getRoomLast(area, building, room).power
                    val last30DaySpending = Api.getRoomAvgDuring(area, building, room, "last30d").spending
                    if (lastPower / last30DaySpending <= subscriber.app.subscribe.low) {
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"你的宿舍为 $room\n"
                            +"当前剩余电量 ${lastPower.format()} kWh\n"
                            +"过去 30 天平均每日用电 ${last30DaySpending.format()} kWh\n"
                            +"预计可用 ${(lastPower / last30DaySpending).format()} 天，已不足 ${subscriber.app.subscribe.low} 天\n"
                            +"请及时充值"
                        })
                        client.sadd("low_qq_$ts", subscriber.app.qq)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[电量过低]QQ订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("low_qq_$ts", next)
        }

        private suspend fun pushLowByQQGroup(ts: ULong, next: ULong) {
            Mongo.getSubscribedLowUsersByQQGroup().forEach { subscriber ->
                try {
                    val subscriberQQGroup = bot.getGroup(subscriber.app.qq_group!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ群 ${subscriber.app.qq_group} 已经无法找到")
                        Mongo.unbindByQQGroup(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("low_qq_group_$ts", subscriber.app.qq_group) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        client.sadd("low_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }

                    val lastPower = Api.getRoomLast(area, building, room).power
                    val last30DaySpending = Api.getRoomAvgDuring(area, building, room, "last30d").spending
                    if (lastPower / last30DaySpending <= subscriber.app.subscribe.low) {
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"电量过低提醒：\n"
                            +"\n"
                            +"你的宿舍为 $room\n"
                            +"当前剩余电量 ${lastPower.format()} kWh\n"
                            +"过去 30 天平均每日用电 ${last30DaySpending.format()} kWh\n"
                            +"预计可用 ${(lastPower / last30DaySpending).format()} 天，已不足 ${subscriber.app.subscribe.low} 天\n"
                            +"请及时充值"
                        })
                        client.sadd("low_qq_group_$ts", subscriber.app.qq_group)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[电量过低]QQ群订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("low_qq_group_$ts", next)
        }

        private suspend fun pushReportDayByQQ(from: ULong, next: ULong) {
            if (client.exists("report_day_qq_$from") == 1L)
                return
            Mongo.getSubscribedReportDayUsersByQQ().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbindByQQ(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastDaySum = Api.getRoomSumDuring(area, building, room, "day", from * 1000u).spending
                    subscriberQQ.sendMessage(buildMessageChain {
                        +"用电报告-日报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"昨日用电 ${lastDaySum.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-日报]QQ订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_day_qq_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportDayByQQGroup(from: ULong, next: ULong) {
            if (client.exists("report_day_qq_group_$from") == 1L)
                return
            Mongo.getSubscribedReportDayUsersByQQGroup().forEach { subscriber ->
                try {
                    val subscriberQQGroup = bot.getGroup(subscriber.app.qq_group!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ群 ${subscriber.app.qq_group} 已经无法找到")
                        Mongo.unbindByQQGroup(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-日报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastDaySum = Api.getRoomSumDuring(area, building, room, "day", from * 1000u).spending
                    subscriberQQGroup.sendMessage(buildMessageChain {
                        +"用电报告-日报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"昨日用电 ${lastDaySum.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-日报]QQ群订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_day_qq_group_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportWeekByQQ(from: ULong, next: ULong) {
            if (client.exists("report_week_qq_$from") == 1L)
                return
            Mongo.getSubscribedReportWeekUsersByQQ().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbindByQQ(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastWeekSum = Api.getRoomSumDuring(area, building, room, "week", from * 1000U).spending
                    val lastWeekAvg = Api.getRoomAvgDuring(area, building, room, "week", from * 1000U).spending
                    subscriberQQ.sendMessage(buildMessageChain {
                        +"用电报告-周报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"上周用电 ${lastWeekSum.format()} kWh，平均每日 ${lastWeekAvg.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-周报]QQ订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_week_qq_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportWeekByQQGroup(from: ULong, next: ULong) {
            if (client.exists("report_week_qq_group_$from") == 1L)
                return
            Mongo.getSubscribedReportWeekUsersByQQGroup().forEach { subscriber ->
                try {
                    val subscriberQQGroup = bot.getGroup(subscriber.app.qq_group!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ群 ${subscriber.app.qq_group} 已经无法找到")
                        Mongo.unbindByQQGroup(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-周报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastWeekSum = Api.getRoomSumDuring(area, building, room, "week", from * 1000U).spending
                    val lastWeekAvg = Api.getRoomAvgDuring(area, building, room, "week", from * 1000U).spending
                    subscriberQQGroup.sendMessage(buildMessageChain {
                        +"用电报告-周报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"上周用电 ${lastWeekSum.format()} kWh，平均每日 ${lastWeekAvg.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-周报]QQ群订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_week_qq_group_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportMonthByQQ(from: ULong, next: ULong) {
            if (client.exists("report_month_qq_$from") == 1L)
                return
            Mongo.getSubscribedReportMonthUsersByQQ().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbindByQQ(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastMonthSum = Api.getRoomSumDuring(area, building, room, "month", from * 1000U).spending
                    val lastMonthAvg = Api.getRoomAvgDuring(area, building, room, "month", from * 1000U).spending
                    subscriberQQ.sendMessage(buildMessageChain {
                        +"用电报告-月报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"上月用电 ${lastMonthSum.format()} kWh，平均每日 ${lastMonthAvg.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-月报]QQ订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_month_qq_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportMonthByQQGroup(from: ULong, next: ULong) {
            if (client.exists("report_month_qq_group_$from") == 1L)
                return
            Mongo.getSubscribedReportMonthUsersByQQGroup().forEach { subscriber ->
                try {
                    val subscriberQQGroup = bot.getGroup(subscriber.app.qq_group!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的QQ群 ${subscriber.app.qq_group} 已经无法找到")
                        Mongo.unbindByQQGroup(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的校区，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQGroup.sendMessage(buildMessageChain {
                            +"用电报告-月报：\n"
                            +"\n"
                            +"无法获知你的寝室，已自动关闭所有推送，请联系开发者QQ：${getenv("SP_ADMIN")}"
                        })
                        return@forEach
                    }

                    val lastMonthSum = Api.getRoomSumDuring(area, building, room, "month", from * 1000U).spending
                    val lastMonthAvg = Api.getRoomAvgDuring(area, building, room, "month", from * 1000U).spending
                    subscriberQQGroup.sendMessage(buildMessageChain {
                        +"用电报告-月报：\n"
                        +"\n"
                        +"你的宿舍为 $room\n"
                        +"上月用电 ${lastMonthSum.format()} kWh，平均每日 ${lastMonthAvg.format()} kWh"
                    })
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-月报]QQ群订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_month_qq_group_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }
    }
}