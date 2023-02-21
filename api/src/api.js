async function api (fastify, options) {
    await fastify.register(require('./error'))
    await fastify.register(require('./db'))
    await fastify.register(require('./util'))

    /*
    获取所有校区`area`
     */
    fastify.get('/info', {
        schema: {
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {type: 'string'},
                }),
            },
        },
    }, async (request, reply) => {
        return await fastify.sp_db.getAreas()
    })

    /*
    获取指定校区`area`的所有宿舍楼`building`
     */
    fastify.get('/info/:area', {
        schema: {
            params: {
                area: {type: 'string'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {type: 'string'},
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
        } = request.params
        return await fastify.sp_db.getBuildings(area)
    })

    /*
    获取指定宿舍楼`building`的所有寝室`room`
     */
    fastify.get('/info/:area/:building', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {type: 'string'},
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
        } = request.params
        return await fastify.sp_db.getRooms(area, building)
    })

    /*
    获取指定寝室`room`的信息
     */
    fastify.get('/info/:area/:building/:room', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
                room: {type: 'string'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'object',
                    properties: {
                        ts: {type: 'integer'},
                        power: {type: 'integer'},
                        area: {type: 'string'},
                        building: {type: 'string'},
                        room: {type: 'string'},
                    },
                    default: null
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
            room: room,
        } = request.params
        return await fastify.sp_db.getRoomInfo(area, building, room)
    })

    /*
    获取指定寝室`room`的`during`周期内日均用电情况，可设置指定日期`date`
     */
    fastify.get('/data/:area/:building/:room/avg/:during', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
                room: {type: 'string'},
                during: {type: 'string'},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'number',
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
            room: room,
            during: during,
        } = request.params
        const {
            datum: datum_timestamp,
            to: to_timestamp,
        } = request.query
        const datum = datum_timestamp ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天00:00:00.000
        let to = new Date(datum) // 设置为 当天

        if (during === 'day') {
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayOffset(datum)) // 设置为周一
            to.setHours(7*24, 0, 0, 0) // 设置为 7天后00:00:00.000
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1) // 设置为 1月后00:00:00.000
        } else { // 无 to 传入时则等价于 during === 'day'
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        return await fastify.sp_db.getRoomSpendingDailyAvgInDuring(area, building, room, datum, to)
    })

    /*
    获取指定寝室`room`的电表情况和用电情况，可设置指定日期`datum`和最早日期`from`，默认30天
     */
    fastify.get('/data/:area/:building/:room/logs', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
                room: {type: 'string'},
            },
            query: {
              datum: {type: 'integer'},
              from: {type: 'integer'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ts: {type: 'integer'},
                            power: {type: 'integer'},
                            spending: {type: 'integer'},
                        },
                    },
                    default: null
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
            room: room,
        } = request.params
        const {
            datum: datum_timestamp,
            from: from_timestamp,
        } = request.query
        const datum = datum_timestamp ? new Date(datum_timestamp) : new Date()
        datum.setHours(24, 0, 0, 0)
        const from = from_timestamp ? new Date(from_timestamp) : new Date(datum)
        from.setHours(0, 0, 0, 0)
        if (from_timestamp === undefined) {
            from.setHours(-24 * 30)
        }
        return await fastify.sp_db.getRoomLogs(area, building, room, from, datum)
    })

    /*
    获取指定寝室`room`的日均用电情况，可设置指定日期`datum`和最早日期`from`，默认30天
     */
    fastify.get('/data/:area/:building/:room/daily', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
                room: {type: 'string'},
            },
            query: {
              datum: {type: 'integer'},
              from: {type: 'integer'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            ts: {type: 'integer'},
                            spending: {type: 'integer'},
                        },
                    },
                    default: null
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
            room: room,
        } = request.params
        const {
            datum: datum_timestamp,
            from: from_timestamp,
        } = request.query
        const datum = datum_timestamp ? new Date(datum_timestamp) : new Date()
        datum.setHours(24, 0, 0, 0)
        const from = from_timestamp ? new Date(from_timestamp) : new Date(datum)
        from.setHours(0, 0, 0, 0)
        if (from_timestamp === undefined) {
            from.setHours(-24 * 30)
        }
        return await fastify.sp_db.getRoomSpendingDaily(area, building, room, from, datum)
    })

    /*
    获取某时间区间`during`用电量最高的范围`range`，如寝室`room`/宿舍楼`building`/校区`area`，可限制返回条数`limit`和自定义区间`to`
     */
    fastify.get('/rank/sum/:range/:during', {
        schema: {
            params: {
                range: {type: 'string', enum: ['area', 'building', 'room']},
                during: {type: 'string'},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
              limit: {type: 'integer', minimum: 1, default: 20, maxmem: 30},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string'},
                            room: {type: 'string'},
                            spending: {type: 'number'},
                        },
                        default: null
                    },
                }),
            },
        },
    }, async (request, reply) => {
        const {
            range: range,
            during: during,
        } = request.params
        const {
            datum: datum_timestamp,
            to: to_timestamp,
            limit: limit,
        } = request.query
        const datum = datum_timestamp ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天00:00:00.000
        let to = new Date(datum)

        if (during === 'day') {
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayOffset(datum)) // 设置为周一
            to.setHours(7*24, 0, 0, 0) // 设置为 7天后00:00:00.000
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1) // 设置为 1月后00:00:00.000
        } else {
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        if (range === 'area') {
            return await fastify.sp_db.getAreaSpendingRankInDuring(datum, to, limit)
        } else if (range === 'building') {
            return await fastify.sp_db.getBuildingSpendingRankInDuring(datum, to, limit)
        } else if (range === 'room') {
            return await fastify.sp_db.getRoomSpendingRankInDuring(datum, to, limit)
        }
    })

    /*
    获取某时间区间`during`日均用电量最高的范围`range`，如寝室`room`/宿舍楼`building`/校区`area`，可限制返回条数`limit`和自定义区间`to`
     */
    fastify.get('/rank/dailyAvg/:range/:during', {
        schema: {
            params: {
                range: {type: 'string', enum: ['area', 'building', 'room']},
                during: {type: 'string'},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
              limit: {type: 'integer', minimum: 1, default: 20, maxmem: 30},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string'},
                            room: {type: 'string'},
                            spending: {type: 'number'},
                        },
                        default: null
                    },
                }),
            },
        },
    }, async (request, reply) => {
        const {
            range: range,
            during: during,
        } = request.params
        const {
            datum: datum_timestamp,
            to: to_timestamp,
            limit: limit,
        } = request.query
        const datum = datum_timestamp ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天00:00:00.000
        let to = new Date(datum)

        if (during === 'day') {
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayOffset(datum)) // 设置为周一
            to.setHours(7*24, 0, 0, 0) // 设置为 7天后00:00:00.000
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1) // 设置为 1月后00:00:00.000
        } else {
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        if (range === 'area') {
            return await fastify.sp_db.getAreaSpendingDailyAvgRankInDuring(datum, to, limit)
        } else if (range === 'building') {
            return await fastify.sp_db.getBuildingSpendingDailyAvgRankInDuring(datum, to, limit)
        } else if (range === 'room') {
            return await fastify.sp_db.getRoomSpendingDailyAvgRankInDuring(datum, to, limit)
        }
    })

}
module.exports = api
