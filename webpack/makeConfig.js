import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import TerserPlugin from 'terser-webpack-plugin';
import _ from 'lodash';
import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULTS = {
  isDevelopment: process.env.NODE_ENV !== 'production',
  baseDir: path.join(__dirname, '..'),
};

function makePlugins(options) {
  const plugins = [];
  if (!options.isDevelopment) {
    plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'statistics.html',
      })
    );
  }
  return plugins;
}

function makeConfig(options = {}) {
  _.defaults(options, DEFAULTS);
  const {isDevelopment} = options;

  return {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',
    entry: {
      viz: path.join(options.baseDir, 'src/browser.js'),
    },
    output: {
      path: path.join(options.baseDir, 'dist'),
      filename: '[name].min.js',
      clean: true,
    },
    plugins: makePlugins(options),
    module: {
      rules: [],
    },
    optimization: {
      minimize: !isDevelopment,
      usedExports: true,
      sideEffects: true,
      mergeDuplicateChunks: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: true,
            mangle: true,
          },
        }),
      ],
    },
    resolve: {
      extensions: ['.js'],
      fallback: {
        assert: 'assert/',
        stream: 'stream-browserify',
        buffer: 'buffer/',
        util: 'util/',
        crypto: 'crypto-browserify',
      },
    },
  };
}

export default makeConfig;
export { DEFAULTS };