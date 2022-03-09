const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title=process.env.SP_VUE_APP_TITLE
      return args
    })
  },
  configureWebpack: config => {
    config.optimization = {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            name (module) {
              if (/[\\/]node_modules[\\/]/.test(module.context)) {
                // get the name. E.g. node_modules/packageName/not/this/part.js
                // or node_modules/packageName
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
                // npm package names are URL-safe, but some servers don't like @ symbols
                // console.log(`npm.${packageName.replace('@', '')}`, module.context)
                return `npm.${packageName.replace('@', '')}`
              } else {
                // console.log('main', module.context)
                return 'main'
              }
            }
          }
        }
      }
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  },
})
