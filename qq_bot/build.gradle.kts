plugins {
    id("java")
    kotlin("jvm") version "1.8.10"
}

kotlin {
    jvmToolchain(11)
}

group = "cn.wankkoree.sp.bot.qq"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    // Mirai
    api(platform("net.mamoe:mirai-bom:2.14.0"))
    api("net.mamoe:mirai-core-api")     // 编译代码使用
    runtimeOnly("net.mamoe:mirai-core") // 运行时使用
    // KMongo
    implementation("org.litote.kmongo:kmongo-coroutine:4.8.0")
    // Furl
    implementation("com.github.kittinunf.fuel:fuel:2.3.1")
    implementation("com.github.kittinunf.fuel:fuel-coroutines:2.3.1")
    implementation("com.github.kittinunf.fuel:fuel-jackson:2.3.1")
    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.14.1")
    // Kreds
    implementation("io.github.crackthecodeabhi:kreds:0.8.1")
}
