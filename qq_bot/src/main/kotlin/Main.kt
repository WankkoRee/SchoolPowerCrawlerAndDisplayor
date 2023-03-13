package cn.wankkoree.sp.bot.qq

import kotlinx.coroutines.runBlocking
import net.mamoe.mirai.BotFactory
import net.mamoe.mirai.utils.BotConfiguration.MiraiProtocol
import java.io.File
import java.lang.System.getenv


object Main {
    @JvmStatic
    fun main(args: Array<String>): Unit = runBlocking {

        val bot = BotFactory.newBot(getenv("SP_QQ").toLong(), getenv("SP_PASSWORD")) {
            workingDir = File("./runtime/").apply {
                if (!exists())
                    mkdirs()
            }
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