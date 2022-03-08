function getApiSchema (data) {
    return {
        type: 'object',
        properties: {},
        if: {
            properties: {
                code: {type:'integer', enum: [1]}
            }
        }, then: {
            properties: {
                code: {type: 'integer'},
                data: data
            }
        }, else: {
            properties: {
                code: {type: 'integer'},
                error: {type: 'string'}
            }
        }
    }
}

function getWeekday(d, diff) { // Mon Tue Wed Thu Fri Sat Sun = 0~6
    d = new Date(d)
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    return new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1) + diff % 7)) // adjust when day is sunday
}

async function api (fastify, options) {
    fastify.register(require('./error'))
    const knex = require('knex')({
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        },
        debug: process.env.DEBUG === "1",
        asyncStackTraces: process.env.DEBUG === "1",
    })
    fastify.addHook('onClose', async (instance, done) => {
        await knex.destroy();
        done();
    })

    /*
    获取所有校区`area`
     */
    fastify.get('/area', { schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {type: 'string'}
                }) } } }, async (request, reply) => {
        try {
            const areas = (await knex('sp_room')
                .where('is_show', true)
                .groupBy('area')
                .select('area')
            ).map(area => area.area)

            return {code: 1, data: areas}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取指定校区`area`的所有宿舍楼`building`
     */
    fastify.get('/area/:name', {schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {type: 'string'}
                }) } } }, async (request, reply) => {
        try {
            const {name: area} = request.params

            const buildings = (await knex('sp_room')
                .where('is_show', true)
                .where('area', area)
                .groupBy('building')
                .select('building')
            ).map(building => building.building)
            if (buildings.length === 0)
                throw new fastify.seError('非法输入', 101, `area="${area}" not in database`)

            return {code: 1, data: buildings}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取指定宿舍楼`building`的所有寝室`room`
     */
    fastify.get('/building/:name', {schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {type: 'integer'},
                            room: {type: 'string'},
                        }
                    }
                }) } } }, async (request, reply) => {
        try {
            const {name: building} = request.params

            const rooms = await knex('sp_room')
                .where('is_show', true)
                .where('building', building)
                .select('id', 'room')
            if (rooms.length === 0)
                throw new fastify.seError('非法输入', 101, `building="${building}" not in database`)

            return {code: 1, data: rooms}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取指定寝室`room`
     */
    fastify.get('/room/:id', { schema: { response: { 200: getApiSchema({
                    type: 'object',
                    properties: {
                        roomInfo: {
                            type: 'object',
                            properties: {
                                area: {type: 'string'},
                                building: {type: 'string'},
                                room: {type: 'string'},
                                power: {type: 'number'},
                                update_time: {type: 'integer'},
                                avg_day_this_week: {type: 'number'},
                            }
                        },
                        roomLog: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    power: {type: 'number'},
                                    log_time: {type: 'integer'},
                                }
                            }
                        },
                        roomDaily: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    power: {type: 'number'},
                                    date: {type: 'integer'},
                                }
                            }
                        }
                    },
                    default: null
                }) } } }, async (request, reply) => {
        try {
            const {id: idStr} = request.params
            const id = parseInt(idStr)
            if (id.toString() !== idStr)
                throw new fastify.seError('非法输入', 101, `${id} !== "${idStr}"`)
            if (id <= 0)
                throw new fastify.seError('非法输入', 101, `${id} <= 0`)

            const roomInfo = (await knex('sp_room')
                .where('is_show', true)
                .where('id', id)
                .select('area', 'building', 'room', 'power', 'update_time', 'avg_day_this_week')
            )[0]
            if (roomInfo === undefined)
                throw new fastify.seError('非法输入', 101, `id=${id} not in database`)
            const roomLog = await knex('sp_log')
                .where('room', id)
                .select('power', 'log_time')
            const roomDaily = await knex('sp_daily')
                .where('room', id)
                .select('power', 'date')

            return {code: 1, data: {roomInfo, roomLog, roomDaily}}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取某日用电量最高的寝室`room`/宿舍楼`building`/校区`area`
     */
    fastify.get('/rank/daily/:date/topUsed/:type/:limit', { schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string'},
                            room: {type: 'string'},
                            power: {type: 'number'},
                        },
                        default: null
                    }
                }) } } }, async (request, reply) => {
        try {
            const {date: dateStr, type, limit: limitStr} = request.params
            const date = new Date(parseInt(dateStr))
            const limit = parseInt(limitStr)
            if (!["area", "building", "room"].includes(type))
                throw new fastify.seError('非法输入', 101, `${type} not in ["area", "building", "room"]`)
            if (limit.toString() !== limitStr)
                throw new fastify.seError('非法输入', 101, `${limit} !== "${limitStr}"`)
            if (limit <= 0 || limit > 10)
                throw new fastify.seError('非法输入', 101, `${limit} <= 0 || ${limit} > 10`)

            const roomInfo = await knex('sp_daily')
                .where('sp_daily.date', date)
                .join('sp_room', 'sp_daily.room', 'sp_room.id')
                .where('sp_room.is_show', true)
                .where('sp_daily.power', '<=', 0)
                .groupBy(`sp_room.${type}`)
                .orderBy('power', 'asc') // alias后的`power`
                .limit(limit)
                .select('sp_room.area as area', 'sp_room.building as building', 'sp_room.room as room')
                .sum('sp_daily.power as power')
            if (roomInfo.length === 0)
                throw new fastify.seError('非法输入', 101, `date="${date}" and type="${type}" not in database`)

            return {code: 1, data: roomInfo}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取本周用电量最高的寝室`room`/宿舍楼`building`/校区`area`
     */
    fastify.get('/rank/weekly/:date/topUsed/:type/:limit', { schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string'},
                            room: {type: 'string'},
                            power: {type: 'number'},
                        },
                        default: null
                    }
                }) } } }, async (request, reply) => {
        try {
            const {date: dateStr, type, limit: limitStr} = request.params
            const date = new Date(parseInt(dateStr))
            const limit = parseInt(limitStr)
            if (!["area", "building", "room"].includes(type))
                throw new fastify.seError('非法输入', 101, `${type} not in ["area", "building", "room"]`)
            if (limit.toString() !== limitStr)
                throw new fastify.seError('非法输入', 101, `${limit} !== "${limitStr}"`)
            if (limit <= 0 || limit > 10)
                throw new fastify.seError('非法输入', 101, `${limit} <= 0 || ${limit} > 10`)

            const roomInfo = await knex('sp_daily')
                .whereBetween('sp_daily.date', [getWeekday(date, 0), getWeekday(date, 6)])
                .join('sp_room', 'sp_daily.room', 'sp_room.id')
                .where('sp_room.is_show', true)
                .where('sp_daily.power', '<=', 0)
                .groupBy(`sp_room.${type}`)
                .orderBy('power', 'asc') // alias后的`power`
                .limit(limit)
                .select('sp_room.area as area', 'sp_room.building as building', 'sp_room.room as room')
                .sum('sp_daily.power as power')

            return {code: 1, data: roomInfo}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

    /*
    获取本周日均用电量最高的寝室`room`/宿舍楼`building`/校区`area`
     */
    fastify.get('/rank/weekly/topAvg/:type/:limit', { schema: { response: { 200: getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string'},
                            room: {type: 'string'},
                            power: {type: 'number'},
                        },
                        default: null
                    }
                }) } } }, async (request, reply) => {
        try {
            const {type, limit: limitStr} = request.params
            const limit = parseInt(limitStr)
            if (!["area", "building", "room"].includes(type))
                throw new fastify.seError('非法输入', 101, `${type} not in ["area", "building", "room"]`)
            if (limit.toString() !== limitStr)
                throw new fastify.seError('非法输入', 101, `${limit} !== "${limitStr}"`)
            if (limit <= 0 || limit > 10)
                throw new fastify.seError('非法输入', 101, `${limit} <= 0 || ${limit} > 10`)

            const roomInfo = await knex('sp_room')
                .where('sp_room.is_show', true)
                .where('sp_room.avg_day_this_week', '<=', 0)
                .groupBy(`sp_room.${type}`)
                .orderBy('power', 'asc') // alias后的`power`
                .limit(limit)
                .select('sp_room.area as area', 'sp_room.building as building', 'sp_room.room as room')
                .sum('sp_room.avg_day_this_week as power')

            return {code: 1, data: roomInfo}
        } catch (error) {
            return fastify.se_error.ApiErrorReturn(error)
        }
    })

}
module.exports = api
