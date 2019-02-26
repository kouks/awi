const basePath = (dir) => require('path').join(__dirname, dir)
const FriendlyErrors = require('friendly-errors-webpack-plugin')

module.exports = {
  devtool: 'source-map',
  plugins: [
    new FriendlyErrors
  ],
  entry: {
    awi: './src/index.ts',
  },
  output: {
    path: basePath('dist'),
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    library: 'awi',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.ts'],
    alias: {
      '@': basePath('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        include: [basePath('src'), basePath('config')],
        options: { appendTsSuffixTo: [/\.vue$/] }
      }
    ]
  }
}
