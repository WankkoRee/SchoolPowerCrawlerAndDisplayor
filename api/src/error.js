const fp = require('fastify-plugin')

function seError (fastify, options, next) {
    if (fastify.seError) {
        return next(new Error('fastify.seError has already been registered'))
    } else {
        /*
        api.js
            throw new fastify.seError('非法输入', 101, )
         */

        fastify.seError = class extends Error {
            constructor(message, code, detail) {
                super(message)
                this.detail = detail ? detail : null
                this.name = "seError"
                this.code = code ? code : 0
            }
        }
        fastify.se_error = {
            ApiErrorReturn: (error) => {
                console.log(error)
                if (error instanceof fastify.seError) return {code: 1000+error.code, error: error.message}
                else if (error.sqlMessage) return {code: 10000+error.errno, error: error.sqlMessage}
                else if (error instanceof TypeError) return {code: 99998, error: error.message}
                else return {code: 99999, error: error.message}
            }
        }
    }
    next()
}

module.exports = fp(seError, {
    fastify: '>=3.27.2',
    name: 'se-error'
})
