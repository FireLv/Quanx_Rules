# Quanx_Rules

Quantumult X 规则集（按 App 分类）。

## 文件列表

| 文件 | 说明 |
|------|------|
| `ChatGPT_Rules.conf` | ChatGPT 移动端分流规则 |
| `Gemini_Rules.conf` | Gemini 分流规则 |
| `vipshop-adblock.list` | 唯品会开屏广告屏蔽（分流规则，远程筛选） |
| `startup_v3.js` | 唯品会开屏彻底关闭脚本（配合 `vipshop-adblock.list` 使用，可选） |

---

## 唯品会开屏广告屏蔽

基于 2026-09-08 抓包 (HAR) 分析，屏蔽唯品会 iOS App 的开屏广告、弹窗与浮层。

### 1. 添加分流规则（必做）

Quantumult X → 右下角「配置」→「分流规则」→ 右上角「＋」→ 选择「筛选」→ 粘贴下面 URL →「获取」→ 确认启用。

```
https://raw.githubusercontent.com/FireLv/Quanx_Rules/main/vipshop-adblock.list
```

国内访问 raw.githubusercontent.com 慢的话，用 jsDelivr 镜像：

```
https://cdn.jsdelivr.net/gh/FireLv/Quanx_Rules@main/vipshop-adblock.list
```

也可直接写进配置文件 `[filter_remote]` 段：

```
https://raw.githubusercontent.com/FireLv/Quanx_Rules/main/vipshop-adblock.list, tag=唯品会开屏屏蔽, update-interval=86400, opt-parser=false, force-policy=REJECT
```

### 2. 彻底关闭开屏（可选）

如果添加分流规则后仍有开屏广告，需配合脚本强制关闭开屏开关。

Quantumult X → 配置 → 重写 → 远程重写：

```
https://raw.githubusercontent.com/FireLv/Quanx_Rules/main/startup_v3.js, tag=唯品会开屏关闭, update-interval=86400
```

本地重写（需要开启 MITM，证书信任）：

```
[rewrite_local]
^https://mapi\.appvipshop\.com/vips-mobile/rest/operation/startup/v3 url script-response-body startup_v3.js
```

### 屏蔽清单（HAR 分析结论）

| 环节 | 请求 | 处理 |
|------|------|------|
| 开屏总开关 | `operation/startup/v3` | 脚本改写 `view_switch=0`（不可 REJECT） |
| 开屏广告取数 | `activity/advertisement/get` (is_preload=1) | REJECT |
| 弹窗配置 | `operation/popup/v1` | REJECT |
| 悬浮球/浮层 | `layout/assistant/float_ball`、`activity/float_ball/get` | REJECT |
| 广告素材 CDN | `(b\|h2).appsimg.com/upload/{momin,mst}/` | REJECT |
| 广告埋点 | `sc.appvipshop.com` 含 advtrigger 的请求 | REJECT（可选） |

**注意**：`mapi.appvipshop.com` 是核心 API 网关，`startup/v3`、`operation/switch/v1`、`dynamic-config/v1` 等返回首页关键数据，**切勿整体 REJECT**；`appsimg.com` 的 `merchandise/`（商品图）与 `brand/`（品牌图）目录也**不可屏蔽**。
