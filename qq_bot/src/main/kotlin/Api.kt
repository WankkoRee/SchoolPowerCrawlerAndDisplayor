package cn.wankkoree.sp.bot.qq

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.github.kittinunf.fuel.Fuel
import com.github.kittinunf.fuel.coroutines.awaitObject
import com.github.kittinunf.fuel.jackson.defaultMapper
import com.github.kittinunf.fuel.jackson.jacksonDeserializerOf
import java.lang.System.getenv
import java.time.Instant

object Api {
    data class ApiResponse<T> (
        val code: Int,
        val data: T?,
        val error: String?,
    )

    data class GetRoomLastResult (
        val ts: Instant,
        val power: Double,
    )

    data class GetRoomSumDuringResult (
        val from: Instant,
        val to: Instant,
        val spending: Double,
    )

    data class GetRoomAvgDuringResult (
        val from: Instant,
        val to: Instant,
        val spending: Double,
    )

    init {
        defaultMapper.registerModule(JavaTimeModule())
        defaultMapper.configure(DeserializationFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS, false)
    }

    suspend fun getRoomLast(area: String, building: String, room: String): GetRoomLastResult {
        val result = Fuel
            .get("http://${getenv("SP_API")}/api/data/$area/$building/$room/last")
            .awaitObject<ApiResponse<GetRoomLastResult>>(jacksonDeserializerOf())
        check(result.code == 1) {
            result.error as String
        }
        return result.data as GetRoomLastResult
    }

    suspend fun getRoomSumDuring(area: String, building: String, room: String, during: String, datum: ULong? = null): GetRoomSumDuringResult {
        val params : MutableList<Pair<String, Any?>> = mutableListOf()
        if (datum != null) {
            params.add(Pair("datum", datum))
        }
        val result = Fuel
            .get("http://${getenv("SP_API")}/api/data/$area/$building/$room/sum/$during", params)
            .awaitObject<ApiResponse<GetRoomSumDuringResult>>(jacksonDeserializerOf())
        check(result.code == 1) {
            result.error as String
        }
        return result.data as GetRoomSumDuringResult
    }

    suspend fun getRoomAvgDuring(area: String, building: String, room: String, during: String, datum: ULong? = null): GetRoomAvgDuringResult {
        val params : MutableList<Pair<String, Any?>> = mutableListOf()
        if (datum != null) {
            params.add(Pair("datum", datum))
        }
        val result = Fuel
            .get("http://${getenv("SP_API")}/api/data/$area/$building/$room/avg/$during", params)
            .awaitObject<ApiResponse<GetRoomAvgDuringResult>>(jacksonDeserializerOf())
        check(result.code == 1) {
            result.error as String
        }
        return result.data as GetRoomAvgDuringResult
    }
}