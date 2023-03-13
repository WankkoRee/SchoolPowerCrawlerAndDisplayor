package cn.wankkoree.sp.bot.qq

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.mongodb.client.result.UpdateResult
import org.bson.codecs.pojo.annotations.BsonId
import org.litote.kmongo.reactivestreams.*
import org.litote.kmongo.coroutine.*
import org.litote.kmongo.*
import org.litote.kmongo.util.KMongoConfiguration
import java.net.URLEncoder

object Mongo {
    data class Student (
        @BsonId val _id: String,
        val info: Info,
        val position: Position,
        val app: App,
        val update_time: Double,
    ) {
        data class Info (
            val number: String,
            val name: String,
            val faculty: String,
            val grade: String,
            val `class`: String,
            val major: String,
            val qualification: String?,
            val phone: String?,
            val picture: String,
        )
        data class Position (
            val area: String?,
            val building: String?,
            val room: String?,
            val bed: Int?,
            val custom: Custom,
        ) {
            data class Custom (
                val state: Boolean,
                val area: String?,
                val building: String?,
                val room: String?,
            )
        }
        data class App (
            val password: String,
            val qq: String?,
            val dingtalk: String?,
            val subscribe: Subscribe,
        ) {
            data class Subscribe (
                val abnormal: Int,
                val low: Int,
                val report: Report,
            ) {
                data class Report (
                    val day: Boolean,
                    val week: Boolean,
                    val month: Boolean,
                )
            }
        }
    }

    private val client: CoroutineCollection<Student>

    init {
        KMongoConfiguration.registerBsonModule(JavaTimeModule())
        val mongo__ = KMongo.createClient("mongodb://${
            URLEncoder.encode(System.getenv("SP_MONGO_USER"), "UTF-8")
        }:${
            URLEncoder.encode(System.getenv("SP_MONGO_PASS"), "UTF-8")
        }@${
            System.getenv("SP_MONGO_HOST")
        }:${
            System.getenv("SP_MONGO_PORT")
        }").coroutine
        val mongo_ = mongo__.getDatabase(System.getenv("SP_MONGO_NAME"))
        client = mongo_.getCollection()
    }

    suspend fun getUser(qq: Long): Student? {
        return client.findOne(Student::app / Student.App::qq eq qq.toString())
    }

    suspend fun login(username: String, password: String): Student? {
        return client.findOne(Student::info / Student.Info::number eq username, Student::app / Student.App::password eq password)
    }

    suspend fun bind(id: String, qq: Long): UpdateResult {
        return client.updateOneById(id, set(Student::app / Student.App::qq setTo qq.toString()))
    }

    suspend fun unbind(id: String): UpdateResult {
        return client.updateOneById(id, set(Student::app / Student.App::qq setTo null))
    }

    suspend fun unsubscribeAll(id: String): UpdateResult {
        return client.updateOneById(id, set(
            Student::app / Student.App::subscribe / Student.App.Subscribe::abnormal setTo 0,
            Student::app / Student.App::subscribe / Student.App.Subscribe::low setTo 0,
            Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::day setTo false,
            Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::week setTo false,
            Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::month setTo false,
        ))
    }

    suspend fun getSubscribedAbnormalUsers(): List<Student> {
        return client.find(Student::app / Student.App::qq ne null, Student::app / Student.App::subscribe / Student.App.Subscribe::abnormal gt 0).toList()
    }

    suspend fun getSubscribedLowUsers(): List<Student> {
        return client.find(Student::app / Student.App::qq ne null, Student::app / Student.App::subscribe / Student.App.Subscribe::low gt 0).toList()
    }

    suspend fun getSubscribedReportDayUsers(): List<Student> {
        return client.find(Student::app / Student.App::qq ne null, Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::day eq true).toList()
    }

    suspend fun getSubscribedReportWeekUsers(): List<Student> {
        return client.find(Student::app / Student.App::qq ne null, Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::week eq true).toList()
    }

    suspend fun getSubscribedReportMonthUsers(): List<Student> {
        return client.find(Student::app / Student.App::qq ne null, Student::app / Student.App::subscribe / Student.App.Subscribe::report / Student.App.Subscribe.Report::month eq true).toList()
    }
}