# 基线核查与参考证据

核查日期：2026-09-13。所有性能建议均是实验预算，不是测得结果。

## 代码核查

完整仓库已取得；未发现 AGENTS.md。main 与 v1.0.0 均为 `3f2ecc2bc918276b291d90ad4a65aa8f22e15dd8`。GitHub Pages 仅在 main push 或手动触发时发布 `dist/`，因此新增实验分支和本目录不会发布正式站。不要从实验分支手动触发现有 Pages workflow。

| 文件 / 系统 | 已核实的实现 | 对实验的影响 |
| --- | --- | --- |
| package.json | 原生 JS 静态站，无应用依赖、无构建阶段；check/test/dev 三个入口 | 不需要框架迁移；3D 可隔离加入 |
| dist/index.html | 10 个 panel 加 Hero；5 境、5 位管理层、95 个成员；内容保留于 DOM | 保留语义与无 JS 内容，不能把名单做成仅 WebGL 可见 |
| dist/app.js | 约 50.5 KB；IIFE 集中协调布局、调度、品牌移动、Hero、液滴与输入 | 不是独立模块可直接插拔；只在实验副本抽出状态接口 |
| WorldScene | 两层 2D Canvas、离屏五境图集、三层地貌；桌面 5 波形分量、touch 3 分量 | 核心已存在深度/遮挡语言，无需另造陌生世界 |
| Hero 加载 | boot 并行等待五张图，单图超时 4.5 秒；开场时间轴 5.6 秒，可跳过，12 秒总回退 | 首屏不可再等待所有 3D 资源完成；“图像加载”与“开场时长”分别测量 |
| 品牌 | BRAND_MODE 为 wordmark，2 与上标 n；候选图片保留但不是当前主模式 | 不应把候选标徽当正式 logo，Core 先沿用 2ⁿ 比例 |
| 桌面滚动 | scrollY → renderedScroll → 横向 track；bridge 和 members 有局部停留进度 | 不能用全页百分比直接替代局部阶段 |
| mobile-story.js | 原生 shell.scrollLeft，Hero 移入 track，两个长 hold 内 sticky；IntersectionObserver 控制章节 | 保留原生惯性；新 Core 适配，不能接管原生滚动 |
| touch-timeline.js | 快速跨阶段时抽取代表事件，队列最多 4 项，96 ms 截止；可反向 | 后续液滴交接应读取 visual phase，不能分别追赶不同进度 |
| motion.js / liquid.js | 确定性轨迹、汇聚预计算、分裂、表面积近似守恒、局部形变、连颈 | 重用几何与时序；禁止以“换成 3D”重写成一般爆炸粒子 |
| SVG 实际路径 | app.js 创建 SVG；touch 母滴、连接、子滴分开绘制避免接缝 | README 所说 SVG/Canvas 不能当作当前 Canvas 后端已启用 |
| liquid-renderers.js | 仓库存在 SVG/Canvas 备选渲染器，但 index.html 未加载它 | 属于参考资产，不是已经工作的切换接口 |
| 性能与生命周期 | touch Hero DPR 1、约 30fps 绘制；桌面 DPR 上限 1.5；hidden 停帧，pageshow、旋转、地址栏变化有处理 | 分级和生命周期要继承；WebGL context lost 仍需新增 |
| CSS | style → v35 → mobile → polish → visual-impact，层叠与 input 属性共同生效 | 不在 main 再叠一份全局覆盖；实验样式设独立作用域 |
| 半周年影片 | 17,330,848 字节，preload=none、playsinline、手动 controls | 保留按需播放；播放期间 Core 不争抢资源 |

现存 touch 路径会设置禁止缩放的 viewport 并拦截 pinch。这不是本轮擅自修改 v1 的理由，但实验不应照搬为新要求；阶段 3 必须验证允许缩放时的阅读与几何更新。

五张 PNG 均为 1504×1046，每张 RGBA8 解码约 6.0 MiB，合计约 30.0 MiB；文件总量 5,030,073 字节。此估算不包括 mipmap、浏览器副本、GPU 上传、地貌图集、双 Canvas 和视频。文件尺寸小于显存/内存成本，必须分别预算。完整大小、图像尺寸和哈希见 baseline.json。

验证记录：`npm run check` 通过；`npm test` 7/7 通过，覆盖现有汇聚可逆/面积、滴间分离、局部形变、分裂交接与开场时序。它们不证明浏览器 FPS、iOS 图像合成或新 3D 性能。

线上浏览器已看到正式 Hero：纸白天空、大型黑色 2ⁿ、下部被三层五境地貌遮挡。这是 Core 必须继承的构图依据。未声称本轮已对正式站完成全部章节真机回归。

## 参考案例：证据与采用范围

### Noomo — The Power of Digital Storytelling

[体验页](https://storytelling.noomoagency.com/) · [制作方完整说明](https://noomoagency.com/insights/the-power-of-digital-storytelling-website)

制作方解释：凤凰的变化承担品牌隐喻，内容密集时退居次要位置；大镜头留给关键转折。桌面和手机使用不同时间线，相机来自 Blender，并根据实际表现调整质量。透明对象排序需要专门处理。

对 2n 的设计推论：借鉴“主体的意义改变”和阅读段主动退让。不要复制玻璃凤凰、火焰或高复杂度材质；Core 应先用实体轮廓成立。

证据范围：完整阅读制作说明；当前云浏览器体验页显示 `Error creating WebGL context.`，未完成现场滚动体验，不能引用它作为本次手机性能验证。

### Shopify Supply / Performance Pack

[制作方项目说明](https://www.nicomadethis.com/supply) · [系列页](https://shopify.supply/collections/performance-pack)

制作方明确描述一个大 3D Scene 与移动 Camera，衣物随滚动变化，Canvas 叠于 HTML；同时使用真实拍摄来表达人的一面。这不等于整站只有一个不变模型。

对 2n 的设计推论：共同空间可以承载不同内容；半周年真实视频是叙事落点，不应被 3D 替换。其 Lenis 不直接移植进 2n 已有双输入架构。

证据范围：技术结构来自制作方说明。当前首页为 Entrepreneur 系列；从菜单定位 Performance Pack 后，该系列页在云浏览器返回 Server error 页面，未完整体验历史交互，不据此评判其现有品质。

### Oryzo.ai

[项目原站](https://oryzo.ai/)

官方页面以杯垫这一物件串起支撑、隔热、圆形、翻面与抓地等不同语义，文字与交互围绕物件属性展开。

对 2n 的设计推论：Core 每次改变必须解释当下内容，而不仅是“换个角度”。管理层阶段解释连接，成员阶段解释整体的组成；不模仿其喜剧语气或产品功能陈列。

证据范围：读取整页文字结构及 DOM，云浏览器画面未正常呈现主体，仅有底色；没有核实其内部 Scene 数量、对象复用方式或移动帧率。

### Lusion WebGL Scroll Sync

[官方代码与说明](https://github.com/lusionltd/WebGL-Scroll-Sync)

这是技术演示，不是完整品牌叙事案例。作者指出原生滚动与 rAF 的时序差异；让 Canvas 随页面滚动再补偿位置可减少 DOM 锚定漂移，但需处理边缘裁切，overscan 又增加绘制成本。

对 2n 的设计推论：一张 Canvas 不自动解决同步；要先检验触屏横滑的实际合成行为。无需将作者纵向 demo 原封不动变成新的滚动引擎。

证据范围：阅读官方 README。未运行其 demo，也未证明其方案在 2n 上更快。

### Skybag Experience

[制作方案例](https://www.undreamstudio.com/projects/skybag-experience/)

制作方将其标为模拟产品发布的概念项目，介绍滚动中的箱体旋转与把手、材质等局部观察，列出 Blender、Three.js 与 WebGL。它不是已核实的 Skybags 官方商业上线案例。

对 2n 的设计推论：近景必须揭示具体内容。Core 内部展开可用，但不能把管理成员变成产品零件。蓝图背景与工业质感不符合当前风格。

证据范围：读取制作方完整页面源码中的可见案例文字。其 Live 链接为测试域名，本轮未能核实完整交互与性能。制作方的“跨设备流畅”属于自述，不是实测证据。

## 可行性判断的依据边界

可确定：现有内容可以保留，静态部署可兼容，已有液滴逻辑可复用；参考项目证明“同一世界中用主体变化组织内容”有成熟设计路径。

仍需证明：属于 2n 的模型辨识度、两个环境接缝是否自然、与当前 v1 相比是否明显更好、真实 iPhone 的帧时间/热稳定性、Core 与旧液滴的视觉交接。

参考站没有提供可直接套用的 2n 性能数字。以下预算为项目选择，非来源承诺。[MDN WebGL 性能实践](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)支持控制像素成本、纹理预算、批量绘制与资源释放的方向，但具体阈值必须由原型测量验证。
