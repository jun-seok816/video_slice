// webpack.base.js
const path = require("path");

module.exports = {
  // --- 환경 공통 ---
  mode: process.env.NODE_ENV || "development",
  target: "web",

  // --- 해상도 & 별칭 ---
  resolve: {
    extensions: [
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".json",
      ".css",
      ".scss",
      "html",
    ],
    alias: {
      "@Lib": path.resolve(__dirname, "index_src"),
      "@jsLib": path.resolve(__dirname, "src"),
      "@allType": path.resolve(__dirname, "../back-end/src/all_Types.ts"),
      "@allStore": path.resolve(__dirname, "../back-end/src/all_Store.ts"),
      "@BackEnd": path.resolve(__dirname, "../back-end"),
      "@img": path.resolve(__dirname, "src/img"),
    },
    fallback: { console: false, fs: false },
  },

  // --- 로더 공통 ---
  module: {
    rules: [
      {
        // JS / JSX
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: { presets: ["@babel/preset-env", "@babel/preset-react"] },
        },
      },
      { test: /\.tsx?$/, exclude: /node_modules/, use: "ts-loader" }, // TS / TSX
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.scss$/, use: ["style-loader", "css-loader", "sass-loader"] },
      { test: /\.less$/, use: ["style-loader", "css-loader", "less-loader"] },
      {
        test: /\.(png|jpe?g|gif|svg|webp|html)$/,
        type: "asset/resource",
        generator: { filename: "images/[name][ext]?[hash]" },
      },
    ],
  },

  performance: { hints: false },
  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
  optimization: { minimize: false },
};
