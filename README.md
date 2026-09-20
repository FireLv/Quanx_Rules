# Quanx_Rules

Quantumult X 规则集（按 App 分类）。

## 文件列表

| 文件 | 类型 | 说明 |
|------|------|------|
| `ChatGPT_Rules.conf` | 重写 | ChatGPT 移动端规则 |
| `Gemini_Rules.conf` | 重写 | Gemini 规则 |
| `VipshopAd.conf` | 重写 | 唯品会开屏广告屏蔽（url reject，需 MITM） |
| `startup_v3.js` | 脚本 | 唯品会开屏彻底关闭脚本（改写服务端开关，可选） |
| `BestpayChinaMobileAds.conf` | 重写 | 翼支付 + 中国移动 去开屏/首页弹窗（2026-09-18 抓包实证，7 条规则） |
| `JDAds.conf` | 重写 | 京东去开屏广告（2026-09-19 抓包实证，素材预取拦截） |
| `quantumult_merged_20260912.conf` | 完整配置 | 已并入上述全部规则的 QX 完整配置（含证书，勿公开分发给他人无关用途） |

---

## 唯品会开屏广告屏蔽

基于 2026-09-08 抓包 (HAR) 分析。唯品会开屏广告全走核心业务域 `mapi.appvipshop.com`，
域名级分流无法精准拦截，因此使用**重写 url reject**（MITM）按 URL 拦截，不影响首页/商品功能。

### 1. 添加重写规则（必做）

Quantumult X → 右下角「配置」→「**重写**」→「远程重写」→ 右上角「＋」→ 类型选「**重写**」→ 粘贴：

```
https://cdn.jsdelivr.net/gh/FireLv/Quanx_Rules@main/VipshopAd.conf
```

国内直连 GitHub raw 不通，jsDelivr 镜像稳定。资源标签写「唯品会开屏屏蔽」，保存。

前提：MITM 已开启、证书已信任（QX 抓包分析时已装过）。

### 2. 彻底关闭开屏（可选）

如果 url reject 后仍有开屏，需配合脚本改写服务端开屏开关 `startUpConf.view_switch=0`。

Quantumult X → 配置 → 重写 → 远程重写 →「＋」：

```
https://cdn.jsdelivr.net/gh/FireLv/Quanx_Rules@main/startup_v3.js
```

本地重写（二选一，远程脚本引用需要本地规则指向它）：

```
[rewrite_local]
^https://mapi\.appvipshop\.com/vips-mobile/rest/operation/startup/v3 url script-response-body startup_v3.js
```

### 屏蔽清单（HAR 分析结论）

| 环节 | 请求 | 处理 |
|------|------|------|
| 开屏总开关 | `operation/startup/v3` | 脚本改写 `view_switch=0`（**不可 reject**，返回首页菜单等关键数据） |
| 开屏广告取数 | `activity/advertisement/get` | url reject |
| 弹窗配置 | `operation/popup/v1` | url reject（可选） |
| 悬浮球/浮层 | `layout/assistant/float_ball`、`activity/float_ball/get` | url reject（可选） |
| 广告素材 CDN | `(b\|h2).appsimg.com/*/upload/{momin,mst}/` | url reject（可选；`merchandise`/`brand` 商品图目录保留） |
| 广告埋点 | `sc.appvipshop.com` 含 `advtrigger` | url reject（可选） |

**注意**：`mapi.appvipshop.com` 是核心 API 网关，`startup/v3`、`operation/switch/v1`、`dynamic-config/v1`
返回首页关键数据，**切勿整体 REJECT**；`appsimg.com` 的 `merchandise/`（商品图）与 `brand/`（品牌图）目录也不可屏蔽。

## 京东去开屏广告

基于 2026-09-19 抓包（`quantumult-x-2026-09-19-133652.har`，522 条请求，京东 16.0.0）。

远程引用：

```
https://cdn.jsdelivr.net/gh/FireLv/Quanx_Rules@main/JDAds.conf
```

手工并入则需把 hostname 写进 `[mitm]`：

```
hostname = %APPEND% m.360buyimg.com
```

### 为什么拦素材而不是拦取数接口

京东 16.x 的开屏是**预缓存型**：取数走加密通道（全包无 URL 型 `functionId=start`，
`client.action` 体内 `functionId=startup` 的响应只有 `{"deviceLevel":1}` 属设备分级；
`basicConfig` 378KB 深搜无开屏开关），素材走本地缓存 —— 墨鱼《去开屏 V2.0》京东段被标
`[invalid]` 的根因正在于此，URL 层已拦不到取数。

实证链路（北京时间）：09-20 08:28:14 冷启动 → 08:28:21.949 预下载开屏素材
`m.360buyimg.com/mobilecms/s1125x2436_jfs/...jpg.avif`（200 / 81,658B）。
导出该素材转 PNG 后与截图 `IMG_0655` 逐像素一致。响应头
`Referer: download_Image_JDAppHome`、`Age: 50275`、`Cache-Control: max-age≈90天`
证明：展示用的素材来自本地缓存（秒出），08:28:21 这次是进首页后的**预取刷新**。

因此改为断掉预取供给：

| 环节 | 接口 | 动作 |
|------|------|------|
| 开屏素材预取 | `m.360buyimg.com/mobilecms/s1125x2436_` | reject-200 |

**不影响首页图片**：mobilecms 下首页图片规格为 `s714x714`（商品主图）、`s240x240`、`s225x225`，
规则均不命中；全站 `360buyimg.com` 高度≥1000px 的全屏规格仅 `s1125x2436` 这一个
（本包 35 条 mobilecms 请求中仅 1 条命中）。

### ⚠ 见效条件

拦预取**不会清除已缓存的旧素材**，缓存有效期约 90 天，启用后可能数天内照样出广告。
**需卸载重装京东**清掉本地缓存才会立即见效；此后每次启动的预取都被拦，缓存不再被刷新，即长期无广告。

## 翼支付 + 中国移动 去开屏 / 首页弹窗

基于 2026-09-18 抓包（`quantumult-x-2026-09-18-103204.har`，690 条请求）实证整理，规则见 `BestpayChinaMobileAds.conf`，
7 条启用规则全部命中真实请求，命中项状态码均为 200（未打在已废弃的 404 接口上）。

远程引用（QX 会自动并入该资源自带的 hostname）：

```
https://cdn.jsdelivr.net/gh/FireLv/Quanx_Rules@main/BestpayChinaMobileAds.conf
```

手工并入则需把 hostname 写进 `[mitm]`：

```
hostname = %APPEND% mapi-app.bestpay.com.cn, api-p0.yksdks.com
```

（若已引用墨鱼《去开屏 V2.0》，`client.app.coc.10086.cn` 与 `*.1rtb.net` 会自动并入，无需重复添加。）

### 屏蔽清单

| App | 环节 | 接口 | 动作 |
|------|------|------|------|
| 翼支付 | 开屏取数 | `mapi-app.bestpay.com.cn/gapi/appClient/noEnc/unionOpenAds` | reject-200 |
| 翼支付 | 广告 SDK 竞价/埋点 | `sdk.1rtb.net/sdk/req_ad`、`ad-api.adn-plus.com.cn/mb/sdk1/json`、`ctrace.sogaha.cn/sdkLogPathUrl` | reject-200 / reject |
| 中国移动 | 启动配置 | `client.app.coc.10086.cn/biz-orange/DN/init/startInit` | reject-200 |
| 中国移动 | 开屏配置（YK 广告 SDK） | `api-p0.yksdks.com/v6/gcf` | reject-200 |
| 中国移动 | 首页弹窗 | `client.app.coc.10086.cn/biz-orange/DN/homepagePopup/getSortInfo` | reject-200 |

### 已知局限

1. 中国移动开屏素材有本地缓存，启用后可能还需**连续两次冷启动**才完全消失。
2. 翼支付**首页弹窗**本次抓包未捕获（抓包只覆盖冷启动、未停留首页）。需重抓：
   开抓包 → 冷启动翼支付 → 首页停留 10 秒以上 → 导出。
3. `homepagePopup/getSortInfo` 同时承载自营运营活动弹窗，拦截后首页活动弹窗一并消失。
4. 严禁拦截基础设施域（会导致登录/推送/安全校验异常）：
   `atoken.m.taobao.com`、`amdc.m.taobao.com`、`dypnsapi-dualstack.aliyuncs.com`（号码认证）、
   `ha-cmim.cmcc-cs.cn`、`push.it.10086.cn`、`10086.online-cmcc.cn`、`clientaccess.10086.cn`、`h.app.coc.10086.cn`。

## 为什么不用分流（filter）规则

Quantumult X 分流规则只支持 host/host-keyword/host-suffix/user-agent/ip-cidr/geoip/process 等**域名/IP 层**类型，
**不支持 url 正则**。唯品会广告与正常业务共用同一批域名（`mapi.appvipshop.com` 等），域名级拦截必然误伤，
所以只能走重写（MITM）层按 URL 拦截。
