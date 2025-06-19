/**
 * root part
 *
 * @description
 * 		-
 *
 * @Revision
 *   00. Job    : Create
 *       Date   : 2022.1.10
 *       Worker : osjbox@gmail.com
 *       Note   :
 *
 */

//                                                       +=============================
//=======================================================+ import
//                                                       +=============================

const path = require('path')
const { merge : mv_Merge } = require('webpack-merge')
const mv_Webpack_Base = require('./webpack.config.base')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

//                                                       +=============================
//=======================================================+ config
//                                                       +=============================

const mv_Result = mv_Merge(mv_Webpack_Base, {
  //                                          +-------------------------
  // -----------------------------------------+ mode
  //                                          +-------------------------
  mode: "production",

  //                                          +-------------------------
  // -----------------------------------------+ entry
  //                                          +-------------------------
  entry: "./src/Hello.tsx",

  //                                          +-------------------------
  // -----------------------------------------+ output
  //                                          +-------------------------
  // https://webpack.kr/configuration/output/#outputlibrary
  output: {
    // library:  {
    //   // Web Browser 의 Windows.esLib 변수 가 생성되도록 한다.
    //   name : 'jsLib',
    //   type : 'umd',
    //   // Web Browser 의 Windows.jsLib 에 Class 또는 Module 을 노출 하도록 한다.
    //   umdNamedDefine : true,
    // },
    // path: path.resolve(__dirname, './dist'),
    // publicPath: '/dist/',
    // filename: 'jsLib.js',
    // clean : true,
  },

  // externals: {
  //   'React': 'React'
  // }
});

//                                                       +=============================
//=======================================================+ exports
//                                                       +=============================
module.exports = mv_Result;
