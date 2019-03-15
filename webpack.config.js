const basePath = dir => require('path').join(__dirname, dir)
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const IgnorePlugin = require('webpack').IgnorePlugin

module.exports = {
  node: {
    process: false,
    Buffer: false
  },
  optimization: {
    usedExports: true
  },
  devtool: 'source-map',
  plugins: [
    new FriendlyErrorsPlugin(),
    new IgnorePlugin({
      resourceRegExp: /^(https?|url)/
    })
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
    extensions: ['.ts', '.js'],
    alias: {
      '@': basePath('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        include: [basePath('src')]
      }
    ]
  }
}
