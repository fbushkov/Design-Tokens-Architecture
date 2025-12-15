const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return [
    // Plugin code (runs in Figma's sandbox)
    {
      name: 'plugin',
      mode: isProduction ? 'production' : 'development',
      devtool: isProduction ? false : 'inline-source-map',
      entry: './src/plugin/code.ts',
      output: {
        filename: 'code.js',
        path: path.resolve(__dirname, 'dist'),
        clean: false,
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
      },
    },
    // UI code (runs in iframe)
    {
      name: 'ui',
      mode: isProduction ? 'production' : 'development',
      devtool: isProduction ? false : 'inline-source-map',
      entry: './src/ui/ui.ts',
      output: {
        filename: 'ui.js',
        path: path.resolve(__dirname, 'dist'),
        clean: false,
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
        ],
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/ui/ui.html',
          filename: 'ui.html',
          inject: 'body',
          inlineSource: '.(js|css)$',
        }),
        new HtmlInlineScriptPlugin(),
      ],
    },
  ];
};
