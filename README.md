# CAT-exceptions-collect(基于koajs)

## 背景

生产上的js文件是经过webpack打包压缩过的，所以异常所在的位置信息（所在行和列）通常是不准确的，需要一个工具能够通过sourcemap逆解析来还原异常所在的准确位置。

## 功能

1. 提供接口来接收生产上的异常信息  
2. 通过出错js文件对应的map文件来找到正确的异常所在位置（所在行和列）  
3. 将解析后的异常信息发送给后台记录异常信息的接口

## 要求

* node version > 7.6.0

## 部署

1. 将项目部署于要监听的项目所在的主机上
2. 在config.js文件中配置项目
    * 监听端口(port)
    * map文件所在目录(mapFilesPath)
    * CAT接口域名(targetDomain)
3. 配置nginx转发 http://xxxx/exceptions/ 路径
4. `$ npm install`

## 启动
* `$ node app.js`
