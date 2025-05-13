const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'), // The folder that your hosting service (e.g., Netlify) will serve.
    filename: 'bundle.js',
    clean: true, // Cleans the output folder before each build.
    publicPath: '/', // Ensures assets are served from the root.
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Process JavaScript and JSX files.
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/, // Process CSS files.
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i, // Handle image files.
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|ttf|otf|eot)$/, // Handle font files.
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    // Dotenv will load your .env file and make variables available as process.env.*.
    new Dotenv(),
    new HtmlWebpackPlugin({
      template: './src/index.html', // Your HTML file entry point.
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './dist/_redirects', to: '' }, // Copy the _redirects file to the output folder.
      ],
    }),
    // Uncomment the following if you need additional injection of process.env values.
    // new webpack.DefinePlugin({
    //   'process.env': JSON.stringify(process.env),
    // }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'], // Include common extensions.
    alias: {
      // Optional: add an alias for easier import of your wrapperfetch utility.
      '@wrapperfetch': path.resolve(__dirname, './src/utils/wrapperfetch.js'),
    },
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true, // Redirects all unknown routes to index.html.
  },
};
