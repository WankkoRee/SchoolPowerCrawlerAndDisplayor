package cn.wankkoree.sp.bot.qq

import io.github.crackthecodeabhi.kreds.args.SetOption
import io.github.crackthecodeabhi.kreds.connection.*
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import net.mamoe.mirai.Bot
import java.lang.System.getenv
import java.time.Instant
import java.time.ZoneId

object Redis {
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
                    GlobalScope.launch {
                        pushAbnormal((today.toInstant().toEpochMilli() / 1000).toULong())
                    }
                    GlobalScope.launch {
                        pushLow((today.toInstant().toEpochMilli() / 1000).toULong())
                    }
                    GlobalScope.launch {
                        val from = today.minusDays(1)
                        val next = from.plusDays(2)
                        pushReportDay((from.toInstant().toEpochMilli() / 1000).toULong(), (next.toInstant().toEpochMilli() / 1000).toULong())
                    }
                    GlobalScope.launch {
                        val from = today.minusDays(today.dayOfWeek.value - 1L).minusWeeks(1)
                        val next = from.plusWeeks(2)
                        pushReportWeek((from.toInstant().toEpochMilli() / 1000).toULong(), (next.toInstant().toEpochMilli() / 1000).toULong())
                    }
                    GlobalScope.launch {
                        val from = today.minusDays(today.dayOfMonth - 1L).minusMonths(1)
                        val next = from.plusMonths(2)
                        pushReportMonth((from.toInstant().toEpochMilli() / 1000).toULong(), (next.toInstant().toEpochMilli() / 1000).toULong())
                    }
                }
            }
        }

        override fun onException(ex: Throwable) {
            bot.logger.error("获取数据更新订阅失败", ex)
        }

        private suspend fun pushAbnormal(ts: ULong) {
            Mongo.getSubscribedAbnormalUsers().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的qq ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbind(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("abnormal_$ts", subscriber.app.qq) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("异常耗电提醒：\n\n" +
                                "无法获知你的校区，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("abnormal_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("异常耗电提醒：\n\n" +
                                "无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("abnormal_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("异常耗电提醒：\n\n" +
                                "无法获知你的寝室，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("abnormal_$ts", subscriber.app.qq)
                        return@forEach
                    }

                    val todaySpending = Api.getRoomSumDuring(area, building, room, "day").spending
                    if (todaySpending >= subscriber.app.subscribe.abnormal) {
                        subscriberQQ.sendMessage("异常耗电提醒：\n\n" +
                                "你的宿舍为 $room\n" +
                                "今日已用 ${todaySpending.format()} kWh，超出预期 ${(todaySpending - subscriber.app.subscribe.abnormal).format()} kWh\n" +
                                "请关注用电情况")
                        client.sadd("abnormal_$ts", subscriber.app.qq)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[异常耗电]订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("abnormal_$ts", ts + 86400U)
        }

        private suspend fun pushLow(ts: ULong) {
            Mongo.getSubscribedLowUsers().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的qq ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbind(subscriber._id)
                        return@forEach
                    }
                    if (client.sismember("low_$ts", subscriber.app.qq) == 1L) // 今日已发送过
                        return@forEach
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("电量过低提醒：\n\n" +
                                "无法获知你的校区，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("low_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("电量过低提醒：\n\n" +
                                "无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("low_$ts", subscriber.app.qq)
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("电量过低提醒：\n\n" +
                                "无法获知你的寝室，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        client.sadd("low_$ts", subscriber.app.qq)
                        return@forEach
                    }

                    val lastPower = Api.getRoomLast(area, building, room).power
                    val last30DaySpending = Api.getRoomAvgDuring(area, building, room, "last30d").spending
                    if (lastPower / last30DaySpending <= subscriber.app.subscribe.low) {
                        subscriberQQ.sendMessage("电量过低提醒：\n\n" +
                                "你的宿舍为 $room\n" +
                                "当前剩余电量 ${lastPower.format()} kWh\n" +
                                "过去 30 天平均每日用电 ${last30DaySpending.format()} kWh\n" +
                                "预计可用 ${last30DaySpending.format()} 天，已不足 ${subscriber.app.subscribe.low} 天\n" +
                                "请及时充值")
                        client.sadd("low_$ts", subscriber.app.qq)
                        return@forEach
                    }
                } catch (e: Exception) {
                    bot.logger.error("推送[电量过低]订阅消息失败", e)
                    return@forEach
                }
            }
            client.expireAt("low_$ts", ts + 86400U)
        }

        private suspend fun pushReportDay(from: ULong, next: ULong) {
            if (client.exists("report_day_$from") == 1L)
                return
            Mongo.getSubscribedReportDayUsers().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的qq ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbind(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-日报：\n\n" +
                                "无法获知你的校区，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-日报：\n\n" +
                                "无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-日报：\n\n" +
                                "无法获知你的寝室，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }

                    val lastDaySum = Api.getRoomSumDuring(area, building, room, "day", from * 1000u).spending
                    subscriberQQ.sendMessage("用电报告-日报：\n\n" +
                            "你的宿舍为 $room\n" +
                            "昨日用电 ${lastDaySum.format()} kWh")
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-日报]订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_day_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportWeek(from: ULong, next: ULong) {
            if (client.exists("report_week_$from") == 1L)
                return
            Mongo.getSubscribedReportWeekUsers().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的qq ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbind(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-周报：\n\n" +
                                "无法获知你的校区，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-周报：\n\n" +
                                "无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-周报：\n\n" +
                                "无法获知你的寝室，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }

                    val lastWeekSum = Api.getRoomSumDuring(area, building, room, "week", from * 1000U).spending
                    val lastWeekAvg = Api.getRoomAvgDuring(area, building, room, "week", from * 1000U).spending
                    subscriberQQ.sendMessage("用电报告-周报：\n\n" +
                            "你的宿舍为 $room\n" +
                            "上周用电 ${lastWeekSum.format()} kWh，平均每日 ${lastWeekAvg.format()} kWh")
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-周报]订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_week_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }

        private suspend fun pushReportMonth(from: ULong, next: ULong) {
            if (client.exists("report_month_$from") == 1L)
                return
            Mongo.getSubscribedReportMonthUsers().forEach { subscriber ->
                try {
                    val subscriberQQ = bot.getFriend(subscriber.app.qq!!.toLong()) ?: run {
                        bot.logger.warning("${subscriber.info.name}[${subscriber.info.number}] 绑定的qq ${subscriber.app.qq} 已经无法找到")
                        Mongo.unbind(subscriber._id)
                        return@forEach
                    }
                    val area = if (subscriber.position.custom.state && subscriber.position.custom.area != null) subscriber.position.custom.area else subscriber.position.area ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-月报：\n\n" +
                                "无法获知你的校区，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val building = if (subscriber.position.custom.state && subscriber.position.custom.building != null) subscriber.position.custom.building else subscriber.position.building ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-月报：\n\n" +
                                "无法获知你的宿舍楼，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }
                    val room = if (subscriber.position.custom.state && subscriber.position.custom.room != null) subscriber.position.custom.room else subscriber.position.room ?: run {
                        Mongo.unsubscribeAll(subscriber._id)
                        subscriberQQ.sendMessage("用电报告-月报：\n\n" +
                                "无法获知你的寝室，已自动关闭所有推送，请联系开发者qq：${getenv("SP_ADMIN")}")
                        return@forEach
                    }

                    val lastMonthSum = Api.getRoomSumDuring(area, building, room, "month", from * 1000U).spending
                    val lastMonthAvg = Api.getRoomAvgDuring(area, building, room, "month", from * 1000U).spending
                    subscriberQQ.sendMessage("用电报告-月报：\n\n" +
                            "你的宿舍为 $room\n" +
                            "上月用电 ${lastMonthSum.format()} kWh，平均每日 ${lastMonthAvg.format()} kWh")
                    return@forEach
                } catch (e: Exception) {
                    bot.logger.error("推送[用电报告-月报]订阅消息失败", e)
                    return@forEach
                }
            }
            client.set(
                "report_month_$from",
                Instant.now().toEpochMilli().toString(),
                SetOption.Builder().exatTimestamp(next).build(),
            )
        }
    }
}