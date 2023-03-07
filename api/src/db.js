const fp = require('fastify-plugin')
const SqlString = require("sqlstring")
const { MongoClient } = require("mongodb")

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
        const mongo_ = new MongoClient(`mongodb://${encodeURIComponent(process.env.SP_MONGO_USER)}:${encodeURIComponent(process.env.SP_MONGO_PASS)}@${process.env.SP_MONGO_HOST}:${process.env.SP_MONGO_PORT}`)
        const mongo = mongo_.db(process.env.SP_MONGO_NAME).collection('student')
        fastify.addHook('onClose', async (instance, done) => {
            tde.close()
            mongo_.close()
            done()
        })
        fastify.sp_db = {
            getLoginResult: async function (username, password) {
                try {
                    const loginResult = await mongo.findOne({
                        'info.number': username,
                        'app.password': password,
                    })
                    if (loginResult == null)
                        throw new fastify.spError('登录失败', 103, `用户名或密码错误，${username}, ${password}`)
                    loginResult.update_time = Math.floor(loginResult.update_time * 1000)
                    return {code: 1, data: loginResult}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                }
            },
            setUserPassword: async function (id, password) {
                try {
                    const setUserPasswordResult = await mongo.updateOne({
                        '_id': id,
                    }, {
                        '$set': {
                            'app.password': password,
                        }
                    })
                    if (setUserPasswordResult.modifiedCount !== 1)
                        throw new fastify.spError('修改失败', 106, `需要联系管理员，${id}, ${password}`)
                    return {code: 1, data: null}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                }
            },

            getLastTime: async function () {
                const cur = tde.cursor()
                try {
                    const lastTime = (await cur.query(`
                        SELECT DISTINCT
                            last_row(ts) last_time
                        FROM powers
                        WHERE
                            is_show=true
                    `, true))
                        .data.map(record => {
                            const [last_time] = record.data
                            return {last_time}
                        })[0]
                    return {code: 1, data: lastTime.last_time}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getAreasCount: async function () {
                const cur = tde.cursor()
                try {
                    const areasCount = (await cur.query(`
                        SELECT count(*) area_count
                        FROM (
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
                        )
                    `, true))
                        .data.map(record => {
                            const [area_count] = record.data
                            return {area_count}
                        })[0]
                    return {code: 1, data: areasCount.area_count}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getBuildingsCount: async function () {
                const cur = tde.cursor()
                try {
                    const buildingsCount = (await cur.query(`
                        SELECT count(*) building_count
                        FROM (
                            SELECT DISTINCT
                                building
                            FROM (
                                SELECT DISTINCT
                                    tbname,
                                    building
                                FROM powers
                                WHERE
                                    is_show=true
                            )
                        )
                    `, true))
                        .data.map(record => {
                            const [building_count] = record.data
                            return {building_count}
                        })[0]
                    return {code: 1, data: buildingsCount.building_count}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
            getRoomsCount: async function () {
                const cur = tde.cursor()
                try {
                    const roomsCount = (await cur.query(`
                        SELECT count(*) room_count
                        FROM (
                            SELECT DISTINCT
                                room
                            FROM (
                                SELECT DISTINCT
                                    tbname,
                                    room
                                FROM powers
                                WHERE
                                    is_show=true
                            )
                        )
                    `, true))
                        .data.map(record => {
                            const [room_count] = record.data
                            return {room_count}
                        })[0]
                    return {code: 1, data: roomsCount.room_count}
                } catch (error) {
                    return fastify.sp_error.ApiErrorReturn(error)
                } finally {
                    cur.close()
                }
            },
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
                            return {ts, power: power / 100, area, building, room}
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
            getRoomSpendingSumInDuring: async function (area, building, room, from, to) {
                const cur = tde.cursor()
                try {
                    const roomSpendingSumInDuring = (await cur.query(`
                        SELECT
                            first(ts) \`from\`,
                            last(ts) \`to\`,
                            SUM(spending) spending_range
                        FROM ${SqlString.escapeId(area+building+room)}
                        WHERE
                            is_show=true
                          AND
                            spending>=0
                          AND
                            ts>=${from.getTime()}
                          AND
                            ts<${to.getTime()}
                    `, true))
                        .data.map(record => {
                            const [from, to, spending_range] = record.data
                            return {from, to, spending: Number(spending_range) / 100}
                        })[0]
                    if (roomSpendingSumInDuring === undefined)
                        throw new fastify.spError('非法输入', 101, `"${area+building+room}" have no data from ${from} to ${to}`)
                    return {code: 1, data: roomSpendingSumInDuring}
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
                            first (ts_from) \`from\`,
                            last (ts_to) \`to\`,
                            AVG(spending_daily) spending_daily_avg
                        FROM (
                            SELECT
                                _WSTART ts_from,
                                _WEND ts_to,
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
                            const [from, to, spending_daily_avg] = record.data
                            return {from, to, spending: spending_daily_avg / 100}
                        })[0]
                    if (roomSpendingDailyAvgInDuring === undefined)
                        throw new fastify.spError('非法输入', 101, `"${area+building+room}" have no data from ${from} to ${to}`)
                    return {code: 1, data: roomSpendingDailyAvgInDuring}
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
                            return {ts, power: power / 100, spending: spending / 100}
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
                            return {ts, spending: Number(spending_daily) / 100}
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
                            return {area, spending: Number(spending) / 100}
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
                            return {area, building, spending: Number(spending) / 100}
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
            getBuildingSpendingRankInDuringWhereArea: async function (from, to, limit, area) {
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
                          AND
                            area=${SqlString.escape(area)}
                        PARTITION BY area, building
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, spending] = record.data
                            return {area, building, spending: Number(spending) / 100}
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
                            return {area, building, room, spending: Number(spending) / 100}
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
            getRoomSpendingRankInDuringWhereArea: async function (from, to, limit, area) {
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
                          AND
                            area=${SqlString.escape(area)}
                        PARTITION BY area, building, room
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending: Number(spending) / 100}
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
            getRoomSpendingRankInDuringWhereBuilding: async function (from, to, limit, area, building) {
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
                          AND
                            area=${SqlString.escape(area)}
                          AND
                            building=${SqlString.escape(building)}
                        PARTITION BY area, building, room
                        ORDER BY spending_sum DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending: Number(spending) / 100}
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
                            return {area, spending: spending / 100}
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
                            return {area, building, spending: spending / 100}
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
            getBuildingSpendingDailyAvgRankInDuringWhereArea: async function (from, to, limit, area) {
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
                              AND
                                area=${SqlString.escape(area)}
                            PARTITION BY area, building
                            INTERVAL(1d)
                        )
                        GROUP BY area, building
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, spending] = record.data
                            return {area, building, spending: spending / 100}
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
                            return {area, building, room, spending: spending / 100}
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
            getRoomSpendingDailyAvgRankInDuringWhereArea: async function (from, to, limit, area) {
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
                              AND
                                area=${SqlString.escape(area)}
                            PARTITION BY area, building, room
                            INTERVAL(1d)
                        )
                        GROUP BY area, building, room
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending: spending / 100}
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
            getRoomSpendingDailyAvgRankInDuringWhereBuilding: async function (from, to, limit, area, building) {
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
                              AND
                                area=${SqlString.escape(area)}
                              AND
                                building=${SqlString.escape(building)}
                            PARTITION BY area, building, room
                            INTERVAL(1d)
                        )
                        GROUP BY area, building, room
                        ORDER BY spending_daily_avg DESC
                        LIMIT ${limit}
                    `, true))
                        .data.map(record => {
                            const [area, building, room, spending] = record.data
                            return {area, building, room, spending: spending / 100}
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
