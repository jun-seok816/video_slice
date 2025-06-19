const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const base = require("./webpack.base");

module.exports = merge(base, {
  entry : { index: "./index_src/index.tsx" },
  output: {
    path    : path.resolve(__dirname, "../back-end/indexPage"),
    filename: "indexPage.js",
    clean   : false,                       // CleanWebpackPlugin이 대신 처리
  },

  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ["**/*", "!assets/**", "!assets", "!index-dark-ai.html"],
      verbose: true,
    }),
  ],
});
