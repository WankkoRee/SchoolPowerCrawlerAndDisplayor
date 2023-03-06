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
            spError('登录失败', 103, `用户名或密码错误，${username}, ${password}`)
        api.js
            spError('未登录', 104, '就是未登录')
        api.js
            spError('修改失败', 105, `旧密码错误，${request.session.user.app.password}, ${password}`)
        db.js
            spError('修改失败', 106, `需要联系管理员，${id}, ${password}`)
        api.js
            spError('修改失败', 107, `旧密码与新密码相同，${password}, ${new_password}`)
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
                if (error instanceof fastify.spError) return {code: error.code, error: error.message}
                else if (error instanceof TDError) return {code: 1000, error: error.message}
                else if (error instanceof TypeError) return {code: 2000, error: error.message}
                else return {code: 9999, error: error.message}
            }
        }
    }
    next()
}

module.exports = fp(spError, {
    fastify: '>=3.27.2',
    name: 'sp-error'
})
