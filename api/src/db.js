const fp = require('fastify-plugin')
const SqlString = require("sqlstring")

function spDb (fastify, options, next) {
    if (fastify.sp_db) {
        return next(new Error('fastify.spDb has already been registered'))
    } else {
        const tde = require("@tdengine/client").connect({
            host: process.env.SP_DB_HOST,
            port: process.env.SP_DB_PORT,
            user: process.env.SP_DB_USER,
            password: process.env.SP_DB_PASS,
            database: process.env.SP_DB_NAME,
        })
        fastify.addHook('onClose', async (instance, done) => {
            tde.close()
            done()
        })
        fastify.sp_db = {
            getAreas: async function () {
                const cur = tde.cursor()
                try {
                    const areas = (await cur.query(`
                        SELECT DISTINCT
                            area
                        FROM (
                            SELECT DISTINCT
                                tbname,
                                area
                            FROM powers
                            WHERE
                                is_show=true
                        )
                    `, true))
                        .data.map(record => record.data[0])
                    return {code: 1, data: areas}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getBuildings: async function (area) {
                const cur = tde.cursor()
                try {
                    const buildings = (await cur.query(`
                        SELECT DISTINCT
                            building
                        FROM (
                            SELECT DISTINCT
                                tbname,
                                building
                            FROM powers
                            WHERE
                                is_show=true
                              AND
                                area=${SqlString.escape(area)}
                        )
                    `, true))
                        .data.map(record => record.data[0])
                    if (buildings.length === 0)
                        throw new fastify.spError('非法输入', 101, `area="${area}" not in database`)
                    return {code: 1, data: buildings}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRooms: async function (area, building) {
                const cur = tde.cursor()
                try {
                    const rooms = (await cur.query(`
                        SELECT DISTINCT
                            room
                        FROM (
                            SELECT DISTINCT
                                tbname,
                                room
                            FROM powers
                            WHERE
                                is_show=true
                              AND
                                area=${SqlString.escape(area)}
                              AND
                                building=${SqlString.escape(building)}
                        )
                    `, true))
                        .data.map(record => record.data[0])
                    if (rooms.length === 0)
                        throw new fastify.spError('非法输入', 101, `area="${area}" AND building="${building}" not in database`)
                    return {code: 1, data: rooms}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomInfo: async function (area, building, room) {
                const cur = tde.cursor()
                try {
                    const roomInfo = (await cur.query(`
                        SELECT
                            LAST_ROW(ts, power),
                            area,
                            building,
                            room
                        FROM ${SqlString.escapeId(area+building+room)}
                        WHERE
                            is_show=true
                    `, true))
                        .data.map(record => {
                            const [ts, power, area, building, room] = record.data
                            return {ts, power, area, building, room}
                        })[0]
                    if (roomInfo === undefined)
                        throw new fastify.spError('非法输入', 101, `area="${area}" AND building="${building}" AND room="${room}" not in database`)
                    return {code: 1, data: roomInfo}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomSpendingDailyAvgInDuring: async function (area, building, room, from, to) {
                const cur = tde.cursor()
                try {
                    const roomSpendingDailyAvgInDuring = (await cur.query(`
                        SELECT
                            AVG(spending_daily)
                        FROM (
                            SELECT
--                                 _WSTART ts,
                                SUM(spending) spending_daily
                            FROM ${SqlString.escapeId(area+building+room)}
                            WHERE
                                is_show=true
                              AND
                                spending>=0
                              AND
                                ts>=${from.getTime()}
                              AND
                                ts<${to.getTime()}
                            INTERVAL(1d)
                        )
                    `, true))
                        .data.map(record => {
                            const [spending_daily_avg] = record.data
                            return {spending_daily_avg}
                        })[0]
                    if (roomSpendingDailyAvgInDuring === undefined)
                        throw new fastify.spError('非法输入', 101, `"${area+building+room}" have no data from ${from} to ${to}`)
                    return {code: 1, data: roomSpendingDailyAvgInDuring.spending_daily_avg}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomLogs: async function (area, building, room, from, to) {
                const cur = tde.cursor()
                try {
                    const roomLogs = (await cur.query(`
                        SELECT
                            ts,
                            power,
                            spending
                        FROM ${SqlString.escapeId(area+building+room)}
                        WHERE
                            is_show=true
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                    `, true))
                        .data.map(record => {
                            const [ts, power, spending] = record.data
                            return {ts, power, spending}
                        })
                    if (roomLogs.length === 0)
                        throw new fastify.spError('非法输入', 101, `"${area+building+room}" have no data from ${from} to ${to}`)
                    return {code: 1, data: roomLogs}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomSpendingDaily: async function (area, building, room, from, to) {
                const cur = tde.cursor()
                try {
                    const roomLogs = (await cur.query(`
                        SELECT
                            _WSTART ts,
                            SUM(spending) spending_daily
                        FROM ${SqlString.escapeId(area+building+room)}
                        WHERE
                            is_show=true
                          AND
                            spending>=0
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                        INTERVAL(1d)
                    `, true))
                        .data.map(record => {
                            const [ts, spending_daily] = record.data
                            return {ts, spending: spending_daily}
                        })
                    if (roomLogs.length === 0)
                        throw new fastify.spError('非法输入', 101, `"${area+building+room}" have no data from ${from} to ${to}`)
                    return {code: 1, data: roomLogs}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getAreaSpendingRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const areaSpendingRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            SUM(spending) spending_sum
                        FROM powers
                        WHERE
                            is_show=true
                          AND
                            spending>=0
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                        PARTITION BY area
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, spending] = record.data
                            return {area, spending}
                        })
                    if (areaSpendingRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: areaSpendingRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getBuildingSpendingRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const buildingSpendingRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            building,
                            SUM(spending) spending_sum
                        FROM powers
                        WHERE
                            is_show=true
                          AND
                            spending>=0
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                        PARTITION BY area, building
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, spending] = record.data
                            return {area, building, spending}
                        })
                    if (buildingSpendingRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: buildingSpendingRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomSpendingRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const roomSpendingRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            building,
                            room,
                            SUM(spending) spending_sum
                        FROM powers
                        WHERE
                            is_show=true
                          AND
                            spending>=0
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                        PARTITION BY area, building, room
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending}
                        })
                    if (roomSpendingRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: roomSpendingRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getAreaSpendingDailyAvgRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const areaSpendingDailyAvgRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            AVG(spending_daily) spending_daily_avg
                        FROM (
                            SELECT
                                area,
--                                 _WSTART ts,
                                SUM(spending) spending_daily
                            FROM powers
                            WHERE
                                is_show=true
                              AND
                                spending>=0
                              AND
                                ts>=${from.getTime()}
                              AND
                                ts<${to.getTime()}
                            PARTITION BY area
                            INTERVAL(1d)
                        )
                        GROUP BY area
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, spending] = record.data
                            return {area, spending}
                        })
                    if (areaSpendingDailyAvgRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: areaSpendingDailyAvgRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getBuildingSpendingDailyAvgRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const buildingSpendingDailyAvgRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            building,
                            AVG(spending_daily) spending_daily_avg
                        FROM (
                            SELECT
                                area,
                                building,
--                                 _WSTART ts,
                                SUM(spending) spending_daily
                            FROM powers
                            WHERE
                                is_show=true
                              AND
                                spending>=0
                              AND
                                ts>=${from.getTime()}
                              AND
                                ts<${to.getTime()}
                            PARTITION BY area, building
                            INTERVAL(1d)
                        )
                        GROUP BY area, building
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, spending] = record.data
                            return {area, building, spending}
                        })
                    if (buildingSpendingDailyAvgRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: buildingSpendingDailyAvgRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomSpendingDailyAvgRankInDuring: async function (from, to, limit) {
                const cur = tde.cursor()
                try {
                    const roomSpendingDailyAvgRankInDuring = (await cur.query(`
                        SELECT
                            area,
                            building,
                            room,
                            AVG(spending_daily) spending_daily_avg
                        FROM (
                            SELECT
                                area,
                                building,
                                room,
--                                 _WSTART ts,
                                SUM(spending) spending_daily
                            FROM powers
                            WHERE
                                is_show=true
                              AND
                                spending>=0
                              AND
                                ts>=${from.getTime()}
                              AND
                                ts<${to.getTime()}
                            PARTITION BY area, building, room
                            INTERVAL(1d)
                        )
                        GROUP BY area, building, room
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending}
                        })
                    if (roomSpendingDailyAvgRankInDuring.length === 0)
                        throw new fastify.spError('非法输入', 101, `have no data from ${from} to ${to}`)
                    return {code: 1, data: roomSpendingDailyAvgRankInDuring}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
        }
    }
    next()
}

module.exports = fp(spDb, {
    fastify: '>=3.27.2',
    name: 'sp-db'
})
