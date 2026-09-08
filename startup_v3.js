// 唯品会开屏广告彻底关闭脚本
// 原理: 改写 startup/v3 响应中的 startUpConf.view_switch = "0" (服务端下发的开屏开关)
// 注意: 此接口同时返回首页菜单/用户属性等关键数据, 严禁整体 REJECT, 只能脚本改写
// 用法(Quantumult X):
//   [rewrite_remote]
//   https://raw.githubusercontent.com/USER/REPO/main/startup_v3.js, tag=唯品会开屏关闭, update-interval=86400
//   [rewrite_local]
//   ^https://mapi\.appvipshop\.com/vips-mobile/rest/operation/startup/v3 url script-response-body startup_v3.js

let body = $response.body;
try {
  let obj = JSON.parse(body);
  let conf = obj && obj.data && obj.data.startUpConf;
  if (conf) {
    conf.view_switch = "0";   // 开屏广告
    conf.gift_switch = "0";   // 开屏红包
    conf.push_time = "0";     // 推送引导
  }
} catch (e) {}
$done({ body: JSON.stringify(obj) });
