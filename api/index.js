const fastify = require('fastify')({
    logger: true
})
fastify.register(require('@fastify/routes'))
fastify.register(require('@fastify/cookie'))
fastify.register(require('@fastify/session'), {
    cookieName: 'spSession',
    secret: process.env.SP_SECRET,
    cookie: { secure: false },
    maxAge: 1000*60*60*24*30*3
})

fastify.register(require('./src/api'), {prefix: '/api'})

const start = async () => {
    try {
        await fastify.listen(process.env.SP_PORT, '::')
        console.log(fastify.routes)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
