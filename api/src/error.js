const fp = require('fastify-plugin')
const {TDError} = require("@tdengine/client/nodetaos/error")

function spError (fastify, options, next) {
    if (fastify.sp_error) {
        return next(new Error('fastify.spError has already been registered'))
    } else {
        /*
        db.js
            spError('非法输入', 101, )
        api.js
            spError('未知方法', 102, )
        db.js
            spError('登录失败', 103, )
        api.js
            spError('未登录', 104, )
         */

        fastify.spError = class extends Error {
            constructor(message, code, detail) {
                super(message)
                this.detail = detail ? detail : null
                this.name = "spError"
                this.code = code ? code : 0
            }
        }
        fastify.sp_error = {
            ApiErrorReturn: (error) => {
                console.log(error)
                if (error instanceof fastify.spError) return {code: 1000+error.code, error: error.message}
                else if (error instanceof TDError) return {code: 10000, error: error.message}
                else if (error instanceof TypeError) return {code: 99998, error: error.message}
                else return {code: 99999, error: error.message}
            }
        }
    }
    next()
}

module.exports = fp(spError, {
    fastify: '>=3.27.2',
    name: 'sp-error'
})
