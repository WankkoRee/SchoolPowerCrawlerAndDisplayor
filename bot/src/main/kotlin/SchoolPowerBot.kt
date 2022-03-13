package cn.wankkoree.mirai.plugin

import net.mamoe.mirai.console.plugin.jvm.JvmPluginDescription
import net.mamoe.mirai.console.plugin.jvm.KotlinPlugin
import net.mamoe.mirai.utils.info

object SchoolPowerBot : KotlinPlugin(
    JvmPluginDescription(
        id = "cn.wankkoree.mirai.plugin.school-power-bot",
        name = "校园电费爬Bot",
        version = "1.0-SNAPSHOT",
    ) {
        author("Wankko Ree")
        info("""校园电费爬的Bot组件""")
    }
) {
    override fun onEnable() {
        logger.info { "Plugin loaded" }
    }
}