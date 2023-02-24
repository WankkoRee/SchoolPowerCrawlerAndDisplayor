const fp = require('fastify-plugin')

function spUtil (fastify, options, next) {
    if (fastify.sp_util) {
        return next(new Error('fastify.spUtil has already been registered'))
    } else {
        fastify.sp_util = {
            getMondayDate: function (date) {
                const target = new Date(date)
                return target.getDate() - target.getDay() + (target.getDay() === 0 ? -6 : 1)
            },
            getApiSchema: function (data) {
                return {
                    type: 'object',
                    properties: {},
                    if: {
                        properties: {
                            code: {type:'integer', enum: [1]},
                        },
                    }, then: {
                        properties: {
                            code: {type: 'integer'},
                            data: data,
                        },
                    }, else: {
                        properties: {
                            code: {type: 'integer'},
                            error: {type: 'string'},
                        },
                    },
                }
            },
        }
    }
    next()
}

module.exports = fp(spUtil, {
    fastify: '>=3.27.2',
    name: 'sp-util'
})
