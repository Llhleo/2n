# 2n

2n Florr.io Guild 官方纪念网站：[正式站](https://llhleo.github.io/2n/)。

横向故事依次呈现五生态、管理层、成员液滴汇聚与分裂、半周年纪念和半周年影片。触屏设备使用原生横向滚动；桌面保留滚动驱动的横向叙事。

## 维护内容

管理层标题、说明、职位、名字与贡献说明统一编辑 [`dist/leaders-data.js`](dist/leaders-data.js)。`dist/index.html` 中的管理层内容是无 JavaScript 时的静态回退快照，正常内容维护无需同步修改。

## 本地预览与检查

```sh
npm run dev
npm run check
npm test
```

`dist/` 是 GitHub Pages 站点目录；`tools/` 存放预览与检查工具。发布摘要见 [`RELEASE-v1.0.md`](RELEASE-v1.0.md)。
