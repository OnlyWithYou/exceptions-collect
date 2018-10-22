
const Koa = require('koa');
const fs = require('fs');
const sourceMap = require('source-map');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const rp = require('request-promise');
// 载入配置文件
const configs = require('./config.js');
const app = new Koa();
const router = new Router();
app.use(bodyParser());

// 读取文件
const readFile = file => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf-8', (error, data) => {
            if (error) return reject(error);
            resolve(data);
        });
    });
};

// 定位异常位置
const locate = async (fileName, line, column) => {
    // map文件地址
    const mapFilePath = `${configs.mapFilesPath}/${fileName}.map`;
    const rawSourceMap = JSON.parse(await readFile(mapFilePath));
    const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
    const result = consumer.originalPositionFor({
        line: line,
        column: column
    });
    consumer.destroy();
    return result;
};

// 接口定义
router.post('/exceptions/error', async (ctx, next) => {
    try {
        const data = ctx.request.body;
        let errorStack = data.msg;
        let errorStackList = data.msg.split('\n');
        let firstLine = errorStackList[1];
        const locationInfo = /[0-9a-zA-Z\-]+\.[0-9a-zA-Z]+\.js:\d+:\d+/.exec(firstLine)[0];
        const fileName = /[0-9a-zA-Z\-]+\.[0-9a-zA-Z]+\.js/.exec(locationInfo)[0];
        const line = Number(locationInfo.match(/:\d+/g)[0].substr(1));
        const column = Number(locationInfo.match(/:\d+/g)[1].substr(1));
        const originalLocationInfo = await locate(fileName, line, column);
        firstLine = firstLine.replace(/(.+)/, `(${originalLocationInfo.source}:${originalLocationInfo.line}:${originalLocationInfo.column})`);
        errorStackList[1] = firstLine;
        errorStack = errorStackList.join('\n');
        const options = {
            uri: `${configs.targetDomain}/ws-truck/resource/f`,
            qs: {
                uid: data.uid,
                ref: data.ref,
                msg: errorStack
            },
            headers: {
                'X-Requested-By': 'eshipping'
            },
            json: true // Automatically parses the JSON string in the response
        };
        await rp(options)
            .then(res => {
                if (res.success) {
                    console.log('异常发送成功');
                    ctx.response.body = {
                        success: true,
                        message: '异常发送成功'
                    };
                }
            })
            .catch(err => {
                console.log('异常发送失败');
                ctx.response.body = {
                    success: false,
                    message: err
                };
            });
    } catch (e) {
        ctx.response.body = {
            success: false,
            message: e
        };
    }
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(configs.port);
console.log(`Server is listening at port ${configs.port}`);
