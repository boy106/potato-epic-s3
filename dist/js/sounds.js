// js/sounds.js — 本地文件协议（file:）下的音效数据兜底（W8，2026-11-22）
// 消费侧：js/audio.js loadPack() —— 仅 location.protocol === "file:" 时加载本文件，
// HTTPS 环境加载的是 js/sound_events.js（线上已存在）。期望定义 window.SOUNDS。
// 线上 CDN 此文件 404（完整音效数据版从未上线）；本文件提供最小合规版：
// 空事件表 + 无内嵌音频文件，file: 模式下流程走通（packReady=true、无音效），
// 与现状（404 → packReady 永远 false）相比不再静默卡死加载链。
window.SOUNDS = { events: {}, files: null };
