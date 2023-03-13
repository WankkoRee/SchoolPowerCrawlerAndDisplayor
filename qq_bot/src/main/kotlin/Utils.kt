package cn.wankkoree.sp.bot.qq

import cn.wankkoree.sp.bot.qq.TimeFormat.*
import java.math.RoundingMode
import java.text.DecimalFormat
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAccessor

enum class TimeFormat {
    Date, Time
}

val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd").withZone(ZoneId.systemDefault())
val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss").withZone(ZoneId.systemDefault())
fun TemporalAccessor.format(format: TimeFormat): String {
    return when (format) {
        Date -> dateFormatter.format(this)
        Time -> timeFormatter.format(this)
    }
}

val numberFormatter = DecimalFormat("#.##").apply { roundingMode = RoundingMode.FLOOR }
fun Double.format(): String {
    return numberFormatter.format(this)
}
