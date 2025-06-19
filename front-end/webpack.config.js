const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const base = require("./webpack.base");

module.exports = merge(base, {
  entry: { index: "./src/index.tsx" },
  output: {
    path: path.resolve(__dirname, "../back-end/build"),
    filename: "index.js",
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      templateContent: /* html */ `
      <html>
        <head>          
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Oswald:wght@200..700&family=Protest+Strike&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">


          <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
          <meta http-equiv="Pragma" content="no-cache">
          <meta http-equiv="Expires" content="0">
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">          
          <title>WaveForm</title>
          <base href="/">                    
        </head>
        <script defer src="wavesurfer.min.js"></script>
        <script defer src="wavesurfer.timeline.min.js"></script>
        <script defer src="wavesurfer.regions.min.js"></script>
        <script defer src="wavesurfer.cursor.min.js"></script>        
        <body style="margin: 0; padding: 0; width: 100%; height: 100%;"> 
          <div id="app">
                   
          </div>          
        </body>
      </html>
      `,
    }),
  ],
});
