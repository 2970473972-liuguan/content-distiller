# 内容蒸馏 Content Distiller

![CI](https://github.com/2970473972-liuguan/content-distiller/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

粘贴一段小说或视频文案,几秒钟蒸馏成摘要、情节人物卡片,或读书笔记——不用自己再读一遍全文。

**[在线体验 →](https://content-distiller-ruby.vercel.app)**

<!-- 部署后替换成实际效果截图或 GIF -->
<!-- ![demo](./docs/demo.gif) -->

## 解决了什么问题

长文本(网络小说、视频文案、公众号长文)读起来费时间,但很多时候我们只需要核心情节、关键人物关系,或者几条值得记下来的观点。这个工具把"整段读完再总结"这件事交给大模型,提供三种蒸馏模式:

- **精简摘要**——几段话讲清楚内容主线
- **情节 + 人物卡片**——按时间线拆出关键节点和人物关系
- **读书笔记**——提炼观点、细节和一句话点评

## 技术架构

```
浏览器 (React 页面)
   │  粘贴文本 + 选择模式
   ▼
Next.js API Route (/app/api/summarize)
   │  拼接 Prompt
   ▼
DeepSeek API
   │  返回蒸馏结果
   ▼
浏览器渲染结果
```

前后端在同一个 Next.js 项目里:页面用 React + Tailwind 写,`/app/api/summarize` 这个 API Route 负责在服务端调用大模型。访客可以在页面设置里填入自己的 DeepSeek Key,Key 只保存在浏览器本地,不会写入前端代码或日志。

## 技术栈

- [Next.js 15](https://nextjs.org/)(App Router)
- TypeScript
- Tailwind CSS
- DeepSeek API(OpenAI 兼容格式,支持站长默认 Key 或访客个人 Key)
- GitHub Actions(CI)+ Vercel(部署)

## 使用自己的 Key

线上页面右上角的「设置」里可以开启「使用我自己的 API Key」。开启后,请求会使用访客自己填写的 DeepSeek 额度和所选模型;未开启时使用站长配置的默认 Key。

服务端对单 IP 做了基础限流(默认每分钟 12 次),避免被恶意刷接口。生产环境的 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL` 通过 Vercel 环境变量配置。

## 本地运行

```bash
git clone https://github.com/2970473972-liuguan/content-distiller.git
cd content-distiller
npm install
cp .env.example .env.local   # 填入你的 DEEPSEEK_API_KEY
npm run dev
```

打开 http://localhost:3000 即可使用。

## 路线图

- [ ] 支持视频文案(字幕/转写文本)作为输入
- [ ] 接入抖音 / B 站收藏夹,把收藏内容自动转成蒸馏卡片
- [ ] 支持定时召回:把过去蒸馏过的内容按周期重新推送

## License

MIT
