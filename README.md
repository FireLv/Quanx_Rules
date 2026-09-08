# Quanx_Rules

Quantumult X 规则集（按 App 分类）。

## 文件列表

| 文件 | 类型 | 说明 |
|------|------|------|
| `ChatGPT_Rules.conf` | 重写 | ChatGPT 移动端规则 |
| `Gemini_Rules.conf` | 重写 | Gemini 规则 |
| `VipshopAd.conf` | 重写 | 唯品会开屏广告屏蔽（url reject，需 MITM） |
| `startup_v3.js` | 脚本 | 唯品会开屏彻底关闭脚本（改写服务端开关，可选） |

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

## 为什么不用分流（filter）规则

Quantumult X 分流规则只支持 host/host-keyword/host-suffix/user-agent/ip-cidr/geoip/process 等**域名/IP 层**类型，
**不支持 url 正则**。唯品会广告与正常业务共用同一批域名（`mapi.appvipshop.com` 等），域名级拦截必然误伤，
所以只能走重写（MITM）层按 URL 拦截。
