/* eslint-disable
  import/order,
  multiline-ternary,
  no-param-reassign,
*/
import del from 'del';
import path from 'path';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';
import ImportRetryPlugin from "../../dist/index"
const module = (config) => {
  return {
    rules: config.rules || config.loader
      ?[
        {
            test: /\.js$/,
             exclude: /node_modules/, 
             loader: "babel-loader"
        }
    ]
      : [],
  }
};

const plugins = config => ([
  new webpack.optimize.SplitChunksPlugin({
    name: ['runtime'],
    minChunks: Infinity,
  }),
  new ImportRetryPlugin()
].concat(config.plugins || []));

const output = (config) => {
  return {
    path: path.resolve(
      __dirname,
      `../outputs/${config.output ? config.output : ''}`,
    ),
    filename: '[name].bundle.js',
  };
};

export default function (fixture, config, options) {
  // webpack Config
  config = {
    context: path.resolve(__dirname, '..', 'fixtures'),
    entry: `./${fixture}`,
    output: output(config),
    module: module(config),
    plugins: plugins(config),
  };
  // Compiler Options
  options = Object.assign({ output: false }, options);

  if (options.output) del.sync(config.output.path);

  const compiler = webpack(config);
  let  mfs =  new MemoryFS();
  if (!options.output) compiler.outputFileSystem = mfs;

  return new Promise((resolve, reject) => compiler.run((err, stats) => {
    if (err) reject(err);
    resolve( mfs.readFileSync(stats.toJson().outputPath+"/"+stats.toJson().assetsByChunkName.main));
  }));
}
