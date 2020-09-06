const path = require('path');
const webpack = require('webpack');
const ENV="development";
const envVariables = new webpack.DefinePlugin({                                 
    ENV: JSON.stringify(process.env.ENV)                                                                                                                                 
});

module.exports = {
  mode: 'development',
  entry: './scripts/handling-EHRs-transactions.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
    ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
      envVariables
  ],
};