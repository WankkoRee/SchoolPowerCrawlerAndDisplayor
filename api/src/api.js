async function api (fastify, options) {
    await fastify.register(require('./error'))
    await fastify.register(require('./db'))
    await fastify.register(require('./util'))

    fastify.addHook('preHandler', async (request, reply) => {
      if (request.session.user) {
          const loginResult = await fastify.sp_db.getLoginResult(request.session.user.info.number, request.session.user.app.password)
          if (loginResult.code === 1) {
              request.session.user = loginResult.data
          } else {
              request.session.user = undefined
          }
      }
    })

    /*
    登录
     */
    fastify.post('/user/login', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                }
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null'
                }),
            },
        },
    }, async (request, reply) => {
        const {
            username: username,
            password: password,
        } = request.body
        const loginResult = await fastify.sp_db.getLoginResult(username, password)
        if (loginResult.code === 1) {
            request.session.user = loginResult.data
            return { code: 1, data: null }
        } else {
            return loginResult
        }
    })

    /*
    退出登录
     */
    fastify.post('/user/logout', {
        schema: {
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null'
                }),
            },
        },
    }, async (request, reply) => {
        request.session.user = undefined
        return { code: 1, data: null }
    })

    /*
    修改用户密码
     */
    fastify.post('/user/password/change', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                    new_password: { type: 'string' },
                }
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null',
                }),
            },
        },
    }, async (request, reply) => {
        if (!request.session.user)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('未登录', 104, '就是未登录'))
        const {
            password: password,
            new_password: new_password,
        } = request.body
        if (password !== request.session.user.app.password)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('修改失败', 105, `旧密码错误，${request.session.user.app.password}, ${password}`))
        if (password === new_password)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('修改失败', 107, `旧密码与新密码相同，${password}, ${new_password}`))
        return await fastify.sp_db.setUserPassword(request.session.user._id, new_password)
    })

    /*
    修改异常耗电的订阅
     */
    fastify.post('/user/subscribe/abnormal', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    abnormal: { type: 'number', minimum: 0, default: 10, maximum: 20 },
                }
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null',
                }),
            },
        },
    }, async (request, reply) => {
        if (!request.session.user)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('未登录', 104, '就是未登录'))
        const {
            abnormal: abnormal,
        } = request.body
        return await fastify.sp_db.setUserSubscribeAbnormal(request.session.user._id, abnormal)
    })

    /*
    修改电量不足的订阅
     */
    fastify.post('/user/subscribe/low', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    low: { type: 'number', minimum: 0, default: 4, maximum: 7 },
                }
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null',
                }),
            },
        },
    }, async (request, reply) => {
        if (!request.session.user)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('未登录', 104, '就是未登录'))
        const {
            low: low,
        } = request.body
        return await fastify.sp_db.setUserSubscribeLow(request.session.user._id, low)
    })

    /*
    修改用电报告的订阅
     */
    fastify.post('/user/subscribe/report/:during', {
        schema: {
            params: {
                during: {type: 'string', enum: ["day", "week", "month"]},
            },
            body: {
                type: 'object',
                properties: {
                    enable: { type: 'boolean', default: true },
                }
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'null',
                }),
            },
        },
    }, async (request, reply) => {
        if (!request.session.user)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('未登录', 104, '就是未登录'))
        const {
            during: during,
        } = request.params
        const {
            enable: enable,
        } = request.body
        return await fastify.sp_db.setUserSubscribeReport(request.session.user._id, during, enable)
    })

    /*
    获取用户信息
     */
    fastify.get('/user/info', {
        schema: {
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'object',
                    properties: {
                        'info': {
                            type: 'object',
                            properties: {
                                'number': { type: 'string' },
                                'name': { type: 'string' },
                                'faculty': { type: 'string' },
                                'grade': { type: 'string' },
                                'class': { type: 'string' },
                                'major': { type: 'string' },
                                'qualification': { type: 'string', nullable: true },
                                'phone': { type: 'string', nullable: true },
                                'picture': { type: 'string' },
                            },
                        },
                        'position': {
                            type: 'object',
                            properties: {
                                'area': { type: 'string', nullable: true },
                                'building': { type: 'string', nullable: true },
                                'room': { type: 'string', nullable: true },
                                'bed': { type: 'integer', nullable: true },
                                'custom': {
                                    type: 'object',
                                    properties: {
                                        'state': { type: 'boolean' },
                                        'area': { type: 'string', nullable: true },
                                        'building': { type: 'string', nullable: true },
                                        'room': { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                        'app': {
                            type: 'object',
                            properties: {
                                'qq': { type: 'string', nullable: true },
                                'dingtalk': { type: 'string', nullable: true },
                                'subscribe': {
                                    type: 'object',
                                    properties: {
                                        'abnormal': { type: 'integer' },
                                        'low': { type: 'integer' },
                                        'report': {
                                            type: 'object',
                                            properties: {
                                                'day': { type: 'boolean' },
                                                'week': { type: 'boolean' },
                                                'month': { type: 'boolean' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        'update_time': { type: 'integer' },
                    }
                }),
            },
        },
    }, async (request, reply) => {
        if (!request.session.user)
            return fastify.sp_error.ApiErrorReturn(new fastify.spError('未登录', 104, '就是未登录'))
        return { code: 1, data: request.session.user }
    })

    /*
    获取范围`range`的数量
     */
    fastify.get('/dash/count/:range', {
        schema: {
            params: {
                range: { type: 'string', enum: ['area', 'building', 'room'] },
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'integer',
                }),
            },
        },
    }, async (request, reply) => {
        const {
            range: range,
        } = request.params
        if (range === 'area') {
            return await fastify.sp_db.getAreasCount()
        } else if (range === 'building') {
            return await fastify.sp_db.getBuildingsCount()
        } else if (range === 'room') {
            return await fastify.sp_db.getRoomsCount()
        }
    })

    /*
    获取范围`range`的数量
     */
    fastify.get('/dash/time/last', {
        schema: {
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'integer',
                }),
            },
        },
    }, async (request, reply) => {
        return await fastify.sp_db.getLastTime()
    })

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
                        area: {type: 'string'},
                        building: {type: 'string'},
                        room: {type: 'string'},
                        nums: {type: 'integer'},
                    },
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
    获取指定寝室`room`的最新数据
     */
    fastify.get('/data/:area/:building/:room/last', {
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
                        power: {type: 'number'},
                    },
                }),
            },
        },
    }, async (request, reply) => {
        const {
            area: area,
            building: building,
            room: room,
        } = request.params
        return await fastify.sp_db.getRoomLast(area, building, room)
    })

    /*
    获取指定寝室`room`的`during`周期内用电情况，可设置指定日期`date`
     */
    fastify.get('/data/:area/:building/:room/sum/:during', {
        schema: {
            params: {
                area: {type: 'string'},
                building: {type: 'string'},
                room: {type: 'string'},
                during: {type: 'string', enum: ["day", "week", "month", "last7d", "last30d", ""]},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'object',
                    properties: {
                        from: {type: 'integer'},
                        to: {type: 'integer'},
                        spending: {type: 'number'},
                    },
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
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天 00:00:00.000
        let to = new Date(datum) // 设置为 当天 00:00:00.000

        if (during === 'day') {
            to.setHours(24) // 设置为 1天后
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayDate(datum)) // 设置为周一
            to.setDate(fastify.sp_util.getMondayDate(to)+7) // 设置为 7天后
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1, 1) // 设置为 1月后 1日
        } else if (during === 'last7d') {
            datum.setHours(-6 * 24) // 设置为 7天前
            to.setHours(24) // 设置为 1天后
        } else if (during === 'last30d') {
            datum.setHours(-29 * 24) // 设置为 30天前
            to.setHours(24) // 设置为 1天后
        } else { // 无 to 传入时则等价于 during === 'day'
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        return await fastify.sp_db.getRoomSpendingSumInDuring(area, building, room, datum, to)
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
                during: {type: 'string', enum: ["day", "week", "month", "last7d", "last30d", ""]},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'object',
                    properties: {
                        from: {type: 'integer'},
                        to: {type: 'integer'},
                        spending: {type: 'number'},
                    },
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
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天 00:00:00.000
        let to = new Date(datum) // 设置为 当天 00:00:00.000

        if (during === 'day') {
            to.setHours(24) // 设置为 1天后
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayDate(datum)) // 设置为周一
            to.setDate(fastify.sp_util.getMondayDate(to)+7) // 设置为 7天后
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1, 1) // 设置为 1月后 1日
        } else if (during === 'last7d') {
            datum.setHours(-6 * 24) // 设置为 7天前
            to.setHours(24) // 设置为 1天后
        } else if (during === 'last30d') {
            datum.setHours(-29 * 24) // 设置为 30天前
            to.setHours(24) // 设置为 1天后
        } else { // 无 to 传入时则等价于 during === 'day'
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        return await fastify.sp_db.getRoomSpendingDailyAvgInDuring(area, building, room, datum, to)
    })

    /*
    获取指定寝室`room`的电表情况，可设置指定日期`datum`和最早日期`from`，默认30天
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
                            power: {type: 'number'},
                        },
                    },
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
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(24, 0, 0, 0)
        const from = from_timestamp !== undefined ? new Date(from_timestamp) : new Date(datum)
        from.setHours(0, 0, 0, 0)
        if (from_timestamp === undefined) {
            from.setHours(-24 * 30)
        }
        return await fastify.sp_db.getRoomLogs(area, building, room, from, datum)
    })

    /*
    获取指定寝室`room`的用电情况，可设置指定日期`datum`和最早日期`from`，默认30天
     */
    fastify.get('/data/:area/:building/:room/spendings', {
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
                            spending: {type: 'number'},
                        },
                    },
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
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(24, 0, 0, 0)
        const from = from_timestamp !== undefined ? new Date(from_timestamp) : new Date(datum)
        from.setHours(0, 0, 0, 0)
        if (from_timestamp === undefined) {
            from.setHours(-24 * 30)
        }
        return await fastify.sp_db.getRoomSpendings(area, building, room, from, datum)
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
                            spending: {type: 'number'},
                        },
                    },
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
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(24, 0, 0, 0)
        const from = from_timestamp !== undefined ? new Date(from_timestamp) : new Date(datum)
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
                during: {type: 'string', enum: ["day", "week", "month", "last7d", "last30d", ""]},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
              limit: {type: 'integer', minimum: 1, default: 3, maximum: 20},
              area: {type: 'string'},
              building: {type: 'string'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string', nullable: true},
                            room: {type: 'string', nullable: true},
                            spending: {type: 'number'},
                        },
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
            area: area,
            building: building,
        } = request.query
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天 00:00:00.000
        let to = new Date(datum) // 设置为 当天 00:00:00.000

        if (during === 'day') {
            to.setHours(24) // 设置为 1天后
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayDate(datum)) // 设置为周一
            to.setDate(fastify.sp_util.getMondayDate(to)+7) // 设置为 7天后
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1, 1) // 设置为 1月后 1日
        } else if (during === 'last7d') {
            datum.setHours(-6 * 24) // 设置为 7天前
            to.setHours(24) // 设置为 1天后
        } else if (during === 'last30d') {
            datum.setHours(-29 * 24) // 设置为 30天前
            to.setHours(24) // 设置为 1天后
        } else { // 无 to 传入时则等价于 during === 'day'
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        if (range === 'area') {
            // area 和 building 必为空
            return await fastify.sp_db.getAreaSpendingRankInDuring(datum, to, limit)
        } else if (range === 'building') {
            // building 必为空
            if (area !== undefined) {
                return await fastify.sp_db.getBuildingSpendingRankInDuringWhereArea(datum, to, limit, area)
            } else {
                return await fastify.sp_db.getBuildingSpendingRankInDuring(datum, to, limit)
            }
        } else if (range === 'room') {
            if (building !== undefined && area !== undefined) {
                return await fastify.sp_db.getRoomSpendingRankInDuringWhereBuilding(datum, to, limit, area, building)
            } else if (area !== undefined) {
                return await fastify.sp_db.getRoomSpendingRankInDuringWhereArea(datum, to, limit, area)
            } else {
                return await fastify.sp_db.getRoomSpendingRankInDuring(datum, to, limit)
            }
        }
    })

    /*
    获取某时间区间`during`日均用电量最高的范围`range`，如寝室`room`/宿舍楼`building`/校区`area`，可限制返回条数`limit`和自定义区间`to`
     */
    fastify.get('/rank/dailyAvg/:range/:during', {
        schema: {
            params: {
                range: {type: 'string', enum: ['area', 'building', 'room']},
                during: {type: 'string', enum: ["day", "week", "month", "last7d", "last30d", ""]},
            },
            query: {
              datum: {type: 'integer'},
              to: {type: 'integer'},
              limit: {type: 'integer', minimum: 1, default: 3, maximum: 20},
              area: {type: 'string'},
              building: {type: 'string'},
            },
            response: {
                200: fastify.sp_util.getApiSchema({
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: {type: 'string'},
                            building: {type: 'string', nullable: true},
                            room: {type: 'string', nullable: true},
                            spending: {type: 'number'},
                        },
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
            area: area,
            building: building,
        } = request.query
        const datum = datum_timestamp !== undefined ? new Date(datum_timestamp) : new Date()
        datum.setHours(0, 0, 0, 0) // 设置为 当天 00:00:00.000
        let to = new Date(datum) // 设置为 当天 00:00:00.000

        if (during === 'day') {
            to.setHours(24) // 设置为 1天后
        } else if (during === 'week') {
            datum.setDate(fastify.sp_util.getMondayDate(datum)) // 设置为周一
            to.setDate(fastify.sp_util.getMondayDate(to)+7) // 设置为 7天后
        } else if (during === 'month') {
            datum.setDate(1) // 设置为 月初
            to.setMonth(to.getMonth()+1, 1) // 设置为 1月后 1日
        } else if (during === 'last7d') {
            datum.setHours(-6 * 24) // 设置为 7天前
            to.setHours(24) // 设置为 1天后
        } else if (during === 'last30d') {
            datum.setHours(-29 * 24) // 设置为 30天前
            to.setHours(24) // 设置为 1天后
        } else { // 无 to 传入时则等价于 during === 'day'
            if (to_timestamp !== undefined) {
                to = new Date(to_timestamp) // 设置为 指定时间
            }
            to.setHours(24, 0, 0, 0) // 设置为 1天后00:00:00.000
        }

        if (range === 'area') {
            // area 和 building 必为空
            return await fastify.sp_db.getAreaSpendingDailyAvgRankInDuring(datum, to, limit)
        } else if (range === 'building') {
            // building 必为空
            if (area !== undefined) {
                return await fastify.sp_db.getBuildingSpendingDailyAvgRankInDuringWhereArea(datum, to, limit, area)
            } else {
                return await fastify.sp_db.getBuildingSpendingDailyAvgRankInDuring(datum, to, limit)
            }
        } else if (range === 'room') {
            if (building !== undefined && area !== undefined) {
                return await fastify.sp_db.getRoomSpendingDailyAvgRankInDuringWhereBuilding(datum, to, limit, area, building)
            } else if (area !== undefined) {
                return await fastify.sp_db.getRoomSpendingDailyAvgRankInDuringWhereArea(datum, to, limit, area)
            } else {
                return await fastify.sp_db.getRoomSpendingDailyAvgRankInDuring(datum, to, limit)
            }
        }
    })

}
module.exports = api
