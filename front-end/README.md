## 목차

* [소개글](#Single-Page-Application)
* [Architecture](#Architecture)
* [Front 구조](#Front-구조)
* [REST API Reference](#REST-API-Reference)
* [DataBase](#DataBase)
* [WebPack](#WebPack)

<div align="center">
  <h1>Single Page Application 게시판👀</h1>
<a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fjun-seok816%2Fa-bulletin-board&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"/></a>
</div>  


<br/>
<p align="center">
  <img src="https://user-images.githubusercontent.com/72478198/156970307-0734d2a3-5f22-4254-9ab9-0b52c9de429d.gif" alt="animated" />
</p>


<br/>
<p align="center">
  <b>본 문서는 REST API 와 React를 사용하여 만든 게시판에대해 안내합니다</b>
</p>

<h3 align="center">만들어진 사이트는 http://jun.cafe24app.com/ 에서 확인하실 수 있습니다. </h3>   
<br/>
<div align="center">
 
  <img src="https://img.shields.io/badge/React-3D41C8?style=flat-square&logo=React&logoColor=white"/>
  <img src="https://img.shields.io/badge/Webpack-1dc207?style=flat-square&logo=Webpack&logoColor=white"/>
   <img src="https://img.shields.io/badge/Mysql-3D41C8?style=flat-square&logo=Mysql&logoColor=white"/>
</div>

<br/>


<br/>
<div align="center">
    <h1>Architecture</h1>
    <p align="center">
      <img src="https://user-images.githubusercontent.com/72478198/158304863-00efffdd-75a9-414f-9f46-f627d94381e5.png" alt="animated" />
    </p>
 </div> 
<br/>


<br/>
<div align="center">
    <h1>Front 구조</h1>
    <p align="center">
      <img src="https://user-images.githubusercontent.com/72478198/157164745-43be341c-1130-4118-9151-07954b3779e8.png" alt="animated" />
    </p>
 </div> 
<br/>

<div align="center">
  <h1>REST API Reference</h1>
</div> 




# Login API

## Description

　 사용자 인증 API

## Request

#### URL
  
```javascript
POST /Login HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|h_id|String|사용자의 아이디|true|
|h_password|String|사용자의 비밀번호|true|

  
 <br/>
  
## Response

  
|Name|Type|Description|Required|
|---|---|---------|---|
|login|Boolean|사용자의 로그인 성공 여부|true|
|message|String|인증 실패 시 반환되는 에러 메시지|false|

<br/>

# Logout API

## Description

세션을 삭제합니다

## Request

#### URL
  
```javascript
GET /logout HTTP/1.1
Host: http://jun.cafe24app.com/
```

<br/>

# Signup API

## Description

회원가입 및 사용자 인증API

## Request

#### URL
  
```javascript
POST /Signup HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|h_id|String|사용자의 아이디|true|
|h_password|String|사용자의 비밀번호|true|

  
 <br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|사용자의 로그인 성공 여부|true|
|message|String|인증 실패 시 반환되는 에러 메시지|false|

<br/>

# LoginCheck API

## Description

Session이 있는지에 따라 로그인상태 체크하는API

## Request

#### URL
  
```javascript
USE /Signup HTTP/1.1
Host: http://jun.cafe24app.com/
```
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|loginToken|String|사용자의 로그인 성공확인된 인증토큰|true|


<br/>

# Write API

## Description

게시글 작성 API

## Request

#### URL
  
```javascript
POST /Notice/Write HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|h_title|String|게시글의 제목|true|
|h_write|String|게시글의 본문|true|
|h_radioBtn|String|게시글이 해당하는 글머리|true|

  
 <br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 업로드성공 여부 |true|
|message|String|업로드 실패,성공 시 반환되는 메시지|true|

<br/>



# Delete API

## Description

게시글 삭제 API

## Request

#### URL
  
```javascript
POST /Notice/Delete HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_number|Number|게시글의 고유번호|true|

  
 <br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 삭제성공 여부 |true|
|message|String|삭제 실패,성공 시 반환되는 메시지|true|

<br/>

# Update API

## Description

게시글 수정 API

## Request

#### URL
  
```javascript
POST /Notice/Update HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_title|String|게시글의 제목|true|
|f_post|String|게시글의 본문|true|

  
 <br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 수정성공 여부 |true|
|message|String|수정 실패,성공 시 반환되는 메시지|true|

<br/>

# Recommend API

## Description

게시글 추천 API 한사람이 같은 게시글을 한번만 추천할 수 있게 구현

## Request

#### URL
  
```javascript
POST /Notice/Recommend HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_number|Number|게시글의 고유번호|true|

  
 <br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 추천성공 여부 |true|
|message|String|추천 실패,성공 시 반환되는 메시지|true|

<br/>


# Main/:category API

## Description

카테고리에 해당하는 게시글 목록을 반환하는 API

## Request

#### URL
  
```javascript
GET /Notice/Main/:category HTTP/1.1
Host: http://jun.cafe24app.com/
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|:category|String|머리글 |true|

  
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 목록반환 성공 여부 |true|
|message|String|게시글 목록반환 실패,성공 시 반환되는 메시지|true|

<br/>

# Main/:id API

## Description

ID에 해당하는 게시글정보를 반환하는 API

## Request

#### URL
  
```javascript
GET /Notice/Main/:id HTTP/1.1
Host: http://jun.cafe24app.com/
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|:id|Number|게시글 고유번호|true|

  
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|게시글 정보반환 성공 여부 |true|
|message|String|게시글 정보반환 실패 시 반환되는 메시지|false|
|database|Object|게시글 정보|false|

<br/>

# DatInsert API

## Description

게시글에  댓글작성 API

## Request

#### URL
  
```javascript
POST /Dat/Insert HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_number|Number|게시글의 고유번호|true|
|f_user|String|댓글을 작성한 유저|true|
|f_word|String|댓글의 본문|true|
 
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|댓글 작성성공 여부 |true|
|message|String|댓글작성 실패,성공 시 반환되는 메시지|true|

<br/>


# DatUpdate API

## Description

게시글에 있는 댓글수정 API

## Request

#### URL
  
```javascript
POST /Dat/Update HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_number|Number|게시글의 고유번호|true|
|f_user|String|댓글을 작성한 유저|true|
|f_word|String|댓글의 본문|true|
 
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|댓글수정 성공 여부 |true|
|message|String|댓글수정 실패,성공 시 반환되는 메시지|true|

<br/>

# DatDelete API

## Description

게시글에 있는 댓글삭제 API

## Request

#### URL
  
```javascript
POST /Dat/Delete HTTP/1.1
Host: http://jun.cafe24app.com/
Content-Type: application/json
```

#### Parameter

|Name|Type|Description|Required|
|---|---|---------|---|
|f_datNum|Number|댓글의 고유번호|true|
 
<br/>
  
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|댓글삭제 성공 여부 |true|
|message|String|댓글삭제 실패,성공 시 반환되는 메시지|true|

<br/>

# Dat/Select/:id API

## Description

게시글에 있는 댓글목록 반환 API

## Request

#### URL
  
```javascript
GET /Dat/Select/:id HTTP/1.1
Host: http://jun.cafe24app.com/
```
 
## Response

|Name|Type|Description|Required|
|---|---|---------|---|
|error|Boolean|댓글 검색성공 여부 |true|
|message|String|댓글검색 실패시 반환되는 메시지|false|
|database|Object|댓글목록에 대한 정보|false|

<br/>


# DataBase

##  tbl_user

사용자에 대한 정보를 담는 table

|Name|Type|Description|Default Value|
|---|---|---------|---|
|ai_user|INT|유저의 고유 ID(PK)|AUTO_INCREMENT|
|f_id|VARCHAR|유저의 ID|없음|
|f_password|VARCHAR|유저의 PASSWORD|없음|


## tbl_noticeMain

게시글에 대한 정보를 담는 table

|Name|Type|Description|Default Value|
|---|---|---------|---|
|ai_number|INT|게시글의 고유 ID(PK)|AUTO_INCREMENT|
|f_title|VARCHAR|게시글의 제목|없음|
|f_writer|VARCHAR|게시글의 작성자|없음|
|f_date|TIMESTAMP|게시글이 작성된 날짜|CURRENT_TIMESTAMP|
|f_enterCount|INT|게시글의 조회수|0|
|f_recommend|INT|게시글의 추천수|0|
|f_post|LONGTEXT|게시글의 본문|없음|
|f_datCount|INT|게시글에 달린 댓글갯수|0|
|f_div|VARCHAR|게시글의 글머리|없음|



## tbl_recommend

사용자가 특정게시물을 중복해서 추천했는지에 대한 정보를담는 table

|Name|Type|Description|Default Value|
|---|---|---------|---|
|f_recommend|INT|추천기록, 사용자ID + 게시글 번호(UNIQUE)|없음|
|f_number|INT|게시글의 번호|없음|

## tbl_dat

댓글에 대한 정보를담는 table

|Name|Type|Description|Default Value|
|---|---|---------|---|
|ai_datNum|INT|댓글의 고유 ID(PK)|AUTO_INCREMENT|
|f_number|INT|게시글의 번호|없음|
|f_user|INT|댓글 작성자|없음|
|f_word|INT|댓글 본문|없음|
|f_date|TIMESTAMP|댓글이 작성된 날짜|CURRENT_TIMESTAMP|


# WebPack

WebPack설정을 어떻게 하였는지 설명합니다.

## entry

엔트리 포인트는 React의 가장 상위 컴포넌트인 index.tsx로 설정하였습니다.

```javascript
 entry: {
            "index" : './src/index.tsx',
        },
```

## output

번들을 내보낼 위치를 BackEnd폴더로 설정하였습니다.

```javascript
 output: {
            path: mv_Path.resolve(__dirname, '../back/views'),
            filename: 'index.js',
            clean : true,
            //chunkFormat: 'commonjs'
        },
```

## resolve

확장자를 설정한대로 순서대로 해석합니다.

```javascript
 resolve: {
        extensions: ['.tsx','.ts','.jsx','.js','.json', '.css', '.scss', 'html'],
  },
```

## module.rules

모듈 규칙설정

### Rule.exclude

node_modules 파일은 번들링하지 않도록 제외하였습니다.


```javascript

module:{
  rules:[
    .../
    {exclude: /node_modules/,}
  ]
}
```

### babel-loader

Javascript 와 JavaScript XML에 해당하는 파일은 babel-loader를 사용하여 컴파일하도록 설정하였습니다.  
@babel/preset-env으로  ES2015+ syntax버전에 맞게 컴파일되도록 하였고,  
@babel/preset-react으로 jsx파일을 컴파일되도록 하였습니다.

```javascript  

module:{
  rules:[
      {
          test: /\.jsx?$/,   // .js or .jsx 
          exclude: /node_modules/,
          use : [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/preset-react'],
              }
            },
          ],
        },
  ]
}
```


### ts-loader

typescript와 typescript XML에 해당하는 파일은 ts-loader를 사용하여 컴파일하도록 설정하였습니다.


```javascript
module:{
  rules:[
     {
      test: /\.tsx?$/,   
      exclude: /node_modules/,
      use : [
        {
          loader : 'ts-loader'
        }
      ],
    },
  ]
}
```

### style-loader , css-loader , sass-loader

확장자명이 .scss .css에 해당하는 파일을 컴파일하도록 설정하였습니다  
sass-loader로 scss파일을 컴파일 후   
css-loader로 css파일을 컴파일 후  
style-loader로 최종 컴파일하도록 설정하였습니다.

```javascript  
module:{
  rules:[
        {
          test: /\.(sc|c)ss$/,  // .scss .css
          use: [
            //'cache-loader',
            //MiniCssExtractPlugin.loader,
            'style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
  ]
}
```

### file-loader

해당하는 확장자명을 가진 파일을 컴파일합니다.
만약 파일이름이 동일할 시 앞에 hash코드를 덧붙여 파일이름을 다르게 설정하도록하였습니다.

```javascript
module:{
  rules:[
    {
      test: /\.(png|jpg|gif|svg|html)$/,
      loader: 'file-loader',
      options: {
        name: '[name].[ext]?[hash]'
      }
    }
  ]
}
```

### devtool

개발자도구로 디버깅하기 용이하게 소스맵을 볼 수 있도록 설정하였습니다.

```javascript
 devtool: 'inline-source-map',
```

### optimization 

코드들을 알아볼 수 있게 minimize 설정을 false로 하였습니다.

```javascript
optimization: {
    minimize: false,
 },
```

### HtmlWebpackPlugin

webpack 번들을 제공하는 HTML 파일을 설정한되로 생성하도록 하였습니다.

```javascript
 plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      minify:false,
      templateContent: `
      <html>
        <head>
          <link href='//spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css' rel='stylesheet' type='text/css'>
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `
    })
  ],
```

### devServer

개발자 서버를 사용하여 애플리케이션을 더 빠르게 제작하였습니다.

### historyApiFallback

index.html페이지는 404응답 대신 제공되도록 하였습니다.  
경로가 '/' 일때 index.html이 응답되도록 하였습니다.

```javascript
devServer:{
  historyApiFallback: {
            rewrites : [
              { from: /^\/$/, to: 'index.html' }
            ]
          },
}         
```

### static

옵션을 사용하여 디렉터리에서 정적 파일을 제공하였습니다.

```javascript
const mv_Path = require('path')

//...
devServer:{
  static : [
            {
              directory: mv_Path.resolve(__dirname, './demo'),
              publicPath: '/',
              watch: true,
            },
            {
              directory: mv_Path.resolve(__dirname, './src'),
              publicPath: '/jsLib',
              watch: true,
            },
          ],
}         

```

### client

* progress : 브라우저에서 컴파일 진행률을 백분율로 인쇄합니다.
* overlay : 컴파일중에 오류나 경고가 있는 경우 브라우저에 오류를 뿌리도록 설정합니다.  

```javascript
 client : {
            progress : true,
            overlay: true,
          },
```

### NODE_ENV가 production일때 처리

개발자용 build가 아닌 배포용 build를할때 처리방식입니다.  
webpack객체의 devtool을 source-map으로 설정하여 개발자모드에서 소스내용을 볼 수 없게합니다.  
webpack객체의 plugins에 설정값을 추가합니다.  

* DefinePlugin은 컴파일 시간에 코드의 변수를 다른 값이나 표현식으로 바꿉니다.
* LoaderOptionsPlugin은 전역로더에 minimize옵션을 추가하여 번들을 최소화합니다.

```javascript
const mv_Result ={
//...
  devtool: 'inline-source-map',
  /...
  plugins: [
  /...
  ],

  if (process.env.NODE_ENV === 'production') {
    //module.exports.devtool = 'inline-source-map'
    mv_Result.devtool = 'source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    mv_Result.plugins = (module.exports.plugins || []).concat([
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true
      })
    ])
  }
}
```


[__junGallery__]: http://jun.cafe24app.com/

