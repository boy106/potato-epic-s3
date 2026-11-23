# 模块地图 / Module Map — 土豆史诗（POTATO EPIC）

> W0「源码树还原」产物。数据来源：对 build 产物 4 个 pack 的静态解析 + 对还原后
> `src/js/*.js`（prettier 格式化）的 acorn 顶层作用域扫描。
> 生成方式：静态分析（词法引用匹配），**粗粒度**，不是精确调用图。

## 一、总览

- 模块总数：**103**（pack1=15，pack2=53，pack3=5，pack4=30；W5b 新增 js/gyro.js）
- 外加 1 个独立 worker 文件 `js/chunk_worker.js`（不在任何 pack 内，磁盘直载）
- 模块间**零 import/export**，全部通过**全局变量**耦合（script 注入式加载）
- 因此 **pack1 → pack2 → pack3 → pack4 及 pack 内顺序不可改变**，重建见 `tools/build.mjs`
- 5 个名字同时出现在 pack 模块与磁盘独立文件的模块
  （blockdata / worldgen_data / modapi / gen_worker / chunk_worker）：
  前 4 个 pack 内版本与磁盘版本**内容一致**（仅换行符 / `// min` 标记差异）；
  `chunk_worker.js` 仅存在于磁盘（worker 入口，由 `js/terrain2.js` 以
  `new Worker("js/chunk_worker.js")` 加载，并 `importScripts` 其余数据文件）。

## 二、模块清单（按 pack 分组，加载顺序 = 表内顺序）

### pack1.js — 基础层：完整性/资源/数据/生成器

| # | 模块 | 体积 | 声明全局数 | 依赖模块数 | 被依赖数 | 主要声明全局 |
|---|------|-----:|-----:|-----:|-----:|------|
| 1 | js/integrity.js | 3.4K | 1 | 1 | 2 | Integrity |
| 2 | js/mods.js | 9.0K | 1 | 2 | 8 | Mods |
| 3 | js/assets.js | 126.2K | 1 | 1 | 7 | ASSETS |
| 4 | js/assets_i1.js | 41.7K | 0 | 3 | 0 |  |
| 5 | js/assets_i2.js | 25.5K | 0 | 3 | 0 |  |
| 6 | js/emoji.js | 0.0K | 1 | 0 | 1 | EMOJI |
| 7 | js/texts.js | 0.0K | 1 | 0 | 1 | MC_TEXTS |
| 8 | js/util.js | 8.6K | 23 | 2 | 65 | CHUNK, MAX_BLOCKS, HEIGHT, SECTIONS, SEA, MIN_Y, ALL_SECTIONS, setWorldFormat, … |
| 9 | js/worldgen_data.js | 35.3K | 1 | 0 | 7 | WG_DATA |
| 10 | js/worldgen.js | 104.7K | 1 | 5 | 6 | WG |
| 11 | js/blockdata.js | 684.8K | 2 | 1 | 6 | BLOCK_DATA, BLOCK_TAGS |
| 12 | js/itemdata.js | 146.7K | 1 | 0 | 3 | ITEM_DATA |
| 13 | js/recipedata.js | 78.5K | 1 | 0 | 3 | RECIPE_DATA |
| 14 | js/modapi.js | 42.5K | 0 | 16 | 0 |  |
| 15 | js/mods_data.js | 0.1K | 0 | 1 | 0 |  |

### pack2.js — 核心层：方块/世界/渲染/实体/UI/玩法系统

| # | 模块 | 体积 | 声明全局数 | 依赖模块数 | 被依赖数 | 主要声明全局 |
|---|------|-----:|-----:|-----:|-----:|------|
| 16 | js/blocks.js | 80.8K | 97 | 11 | 70 | T, BLOCKS, ITEMS, ITEM_KEY, BID, SH_CUBE, SH_CROSS, SH_LIQUID, … |
| 17 | js/world.js | 67.7K | 42 | 4 | 37 | OPACITY, EMIT, SOLIDCUBE, IS_FLUID, REPLACEABLE, AOCUBE, WLOG, TORCHLIKE, … |
| 18 | js/mesher.js | 39.6K | 38 | 6 | 10 | VSTRIDE, FACE_SHADE, setFaceShade, FACES, AO_D1, AO_D2, FACE_UV, FACE_UVR, … |
| 19 | js/models.js | 107.5K | 1 | 2 | 1 | VMODELS |
| 20 | js/vmodels.js | 15.9K | 14 | 7 | 13 | VM, matchWhen, axisDir, rotAxis, rotElement, rotVariant, FACING4, DIR_VEC, … |
| 21 | js/render.js | 100.4K | 23 | 14 | 20 | CHUNK_VS, CHUNK_FS, ENT_VS, ENT_FS, SKY_VS, SKY_FS, TEX_VS, TEX_FS, … |
| 22 | js/render2.js | 12.6K | 0 | 4 | 0 |  |
| 23 | js/shaders.js | 81.9K | 60 | 9 | 5 | FX_NAMES, FX_CFG, MAT_LEAVES, MAT_PLANT, MAT_WATER, MAT_EMIT, MAT_LAVA, MAT_PLANT_STILL, … |
| 24 | js/audio.js | 23.9K | 4 | 2 | 44 | Sound, SOUND_CACHE_BYTES, ARMOR_EQUIP, armorEquipSound |
| 25 | js/subtitles.js | 0.0K | 1 | 0 | 1 | SUBTITLES |
| 26 | js/entity.js | 97.1K | 49 | 10 | 34 | chunkOf, cellB, cellWet, blockBy, _fullBoxes, fullCollisionAt, blockBoxes, boxPut, … |
| 27 | js/mobs2.js | 41.3K | 17 | 6 | 22 | createMob, randomDespawn, particleBurst, teleportEntity, Enderman, ZombifiedPiglin, FlyingMob, Blaze, … |
| 28 | js/ui.js | 91.5K | 13 | 22 | 45 | Font, shade, iconSmooth, SHINE_GOLD, SHINE_BLUE, UI, ContainerScreen, CraftingScreen, … |
| 29 | js/save.js | 13.1K | 4 | 4 | 12 | LS, DB, encodeChunk, decodeChunk |
| 30 | js/game.js | 218.0K | 15 | 43 | 47 | IOS_WEBGL, WEBKIT_GL, ADVANCEMENTS, TUTORIAL, CROP_TICK, VIS_NONE, VIS_SEL, Game, … |
| 31 | js/terrain2.js | 43.3K | 27 | 14 | 7 | VB_BASE, VBIOME, hexRGB, DRY_FOLIAGE, initVanillaBiomes, vbiomeIndex, parseSeed, seed32, … |
| 32 | js/features.js | 110.3K | 1 | 7 | 18 | Features |
| 33 | js/trees.js | 36.5K | 0 | 3 | 0 |  |
| 34 | js/structures_data.js | 0.3K | 0 | 0 | 0 |  |
| 35 | js/structgen.js | 35.7K | 0 | 4 | 0 |  |
| 36 | js/structtypes.js | 40.3K | 0 | 4 | 0 |  |
| 37 | js/gen_worker.js | 5.2K | 0 | 2 | 0 |  |
| 38 | js/structures.js | 8.6K | 1 | 5 | 3 | Loot |
| 39 | js/nbt.js | 6.7K | 0 | 0 | 0 |  |
| 40 | js/anvil.js | 18.4K | 1 | 7 | 1 | VanillaImport |
| 41 | js/export.js | 25.4K | 1 | 8 | 1 | RoomExport |
| 42 | js/screens.js | 72.5K | 27 | 22 | 24 | SPLASHES, ImportScreen, LoadingScreen, TitleScreen, WorldListScreen, ConfirmScreen, EditWorldScreen, CreateWorldScreen, … |
| 43 | js/commands.js | 14.5K | 17 | 8 | 3 | CMD_ITEMS, CMD_MOBS, CMD_STRUCTS, CMD_PLAYERS, CMD_DIMS, CMD_MODES, CMD_SEL, CMD_EFFECTS, … |
| 44 | js/controls.js | 16.8K | 11 | 8 | 9 | KEYBIND_CATS, KEY_DEFAULT, KEY_CN, KEY_NAMES, keyLabel, keyOf, bindingsFor, bindDown, … |
| 45 | js/dims.js | 35.2K | 4 | 12 | 6 | DIM_CN, FLAMMABLE, SPAWNER_MOBS, CreditsScreen |
| 46 | js/nether_mobs.js | 15.3K | 8 | 10 | 1 | wearsGold, BARTER, Piglin, PIGLIN_CALM, Hoglin, Strider, netherMade, netherSpot |
| 47 | js/village_mobs.js | 21.6K | 12 | 9 | 5 | VILLAGER_TYPES, PROFESSIONS, PROFESSION_CN, villagerTypeAt, JOB_SITES, villagerSkin, entityTexOf, Villager, … |
| 48 | js/merchant.js | 15.0K | 7 | 6 | 29 | T_, E, TRADES, LEVEL_XP, LEVEL_CN, hasItem, MerchantScreen |
| 49 | js/effects.js | 23.6K | 22 | 12 | 15 | EFFECT_LIST, EFFECTS, romanLevel, POTIONS, potionColor, FOOD_EFFECTS, FOOD_LEFTOVER, ALWAYS_EDIBLE, … |
| 50 | js/enchant.js | 17.7K | 31 | 9 | 13 | ENCH, ENCH_LIST, enchMinCost, enchMaxCost, enchCompatible, enchLevel, armorEnch, heldEnch, … |
| 51 | js/workstations.js | 28.3K | 22 | 8 | 7 | SGA, StationScreen, EnchantingScreen, ANVIL_NEXT, AnvilScreen, GrindstoneScreen, StonecutterScreen, TRIM_CN, … |
| 52 | js/equip.js | 51.1K | 35 | 13 | 11 | OFF, keyOfStack, isSpear, AMMO, glintOf, DISPLAY, applyDisplay, TRIM_DARKER, … |
| 53 | js/vehicles.js | 41.6K | 33 | 14 | 7 | BOAT_WOODS, BOAT_ITEM, CART_ITEM, vanillaPart, Vehicle, Boat, RAIL_EXITS, isRail, … |
| 54 | js/redstone.js | 66.0K | 45 | 13 | 6 | RS_DIRS, RS_DN, RS_H, RS_OPP, RS_CW, FACE_NAME, rsKey, prop, … |
| 55 | js/itemuse.js | 16.4K | 11 | 8 | 5 | IU_STAGES, copperInfo, STRIP, PATHABLE, DYE_COLORS, Thrown, _iuUseEquipment, _iuUsingTick, … |
| 56 | js/entitydata.js | 197.6K | 1 | 1 | 4 | ENTITY_DATA |
| 57 | js/etex.js | 48.3K | 1 | 0 | 3 | ETEX |
| 58 | js/emodel.js | 10.7K | 8 | 4 | 8 | EM, _emV, emSample, emPack, emHead, emLimbs, emQuad, emHumanoid |
| 59 | js/vmobs.js | 38.5K | 26 | 14 | 15 | VMOB, VMOB_CLASS, defVMob, foodIds, _foodCache, isFood, randInt, pickW, … |
| 60 | js/mobs_animals.js | 116.2K | 56 | 12 | 12 | biomeName, lerpRot, HORSE_COLORS, HORSE_MARKS, HORSE_ARMOR, Horse, dyeTintOf, horseAnim, … |
| 61 | js/mobs_water.js | 27.4K | 17 | 7 | 2 | inWaterAt, fishFlop, finWag, Fish, Cod, SALMON_SIZE, Salmon, Pufferfish, … |
| 62 | js/mobs_hostile.js | 72.4K | 33 | 16 | 6 | diffMul, lookVec, Humanoid, drawVArmor, randomArmor, SkeletonKind, ZombieKind, ZD, … |
| 63 | js/mobitems.js | 26.9K | 11 | 16 | 3 | climateAt, FARM_SKIN, farmAnim, upsideDown, BABY_HUMANOID, STICK_FOR, nameTagUse, LEASHABLE, … |
| 64 | js/spawning.js | 15.1K | 20 | 10 | 3 | SPAWN_CAPS, SPAWN_GROUND, spawnCatOf, spawnMustKeep, SPAWN_CLUSTER, spawnArea, spawnDarken, slimeChunk, … |
| 65 | js/draw2.js | 9.7K | 3 | 5 | 1 | lerpAngle, wrapA, CHEST_ROT |
| 66 | js/blockents.js | 20.1K | 15 | 8 | 7 | DYE_RGB, dyeOf, FACING_DEG, beYaw, beParts, chestTexBase, SIGN_TEXT_RGB, signDark, … |
| 67 | js/decor.js | 31.7K | 20 | 19 | 5 | EXTRA, zhT, faceRot, DIR_NAME, Hanging, ItemFrame, PAINTINGS, PAINTING_PLACEABLE, … |
| 68 | js/items3.js | 53.0K | 18 | 16 | 3 | keyOf3, LUCK, isBundle, bundleWeight, bundleFill, bundleInsert, bundleTake, FishingHook, … |

### pack3.js — 特殊玩法：特殊武器/袭击/指令运行/Mod UI/Mod 代码

| # | 模块 | 体积 | 声明全局数 | 依赖模块数 | 被依赖数 | 主要声明全局 |
|---|------|-----:|-----:|-----:|-----:|------|
| 69 | js/specials.js | 30.5K | 5 | 15 | 1 | STAR_SHAPE, isHead, DYE_RGB_ARR, specialRecipe, shieldTex |
| 70 | js/raids.js | 17.2K | 11 | 8 | 0 | RAID_MAX_OMEN, RAID_COOLDOWN, RAIDER_WAVES, RAIDER_TYPES, raidGroups, VILLAGE_POI, villagePoi, sectionHasPoi, … |
| 71 | js/cmdrun.js | 48.0K | 30 | 15 | 5 | CmdError, cmdFail, GAME_RULES, RULE_ALIAS, cmdWords, stripNs, vanillaY, cmdPos, … |
| 72 | js/mods_ui.js | 37.4K | 18 | 14 | 3 | MOD_BLUE, SmoothScroll, ModListScreen, modIconImgs, drawModIcon, modFrame, modWrap, modMB, … |
| 73 | js/mods_code.js | 0.1K | 0 | 1 | 0 |  |

### pack4.js — 平台层：入口/触控/网络/账号/商城/遥测/防作弊

| # | 模块 | 体积 | 声明全局数 | 依赖模块数 | 被依赖数 | 主要声明全局 |
|---|------|-----:|-----:|-----:|-----:|------|
| 74 | js/main.js | 15.5K | 1 | 14 | 2 | bindInput |
| 75 | js/touch.js | 28.5K | 8 | 11 | 15 | TouchDevice, touchLook, touchSizeOf, touchOn, touchHoldUse, TOUCH_ICONS, TouchControls, bindTouch, lookWrite(W5b) |
| 76 | js/gyro.js | ~19K | 2 | 3 | 1 | GYRO_TUNING, Gyro（W5b 新增，见 §六） |
| 77 | js/perf.js | 28.8K | 11 | 11 | 15 | FramePacer, PerfMon, MemMon, DynRes, PRESET_NAMES, PRESETS, detectPreset, applyPreset, … |
| 78 | js/netconfig.js | 0.1K | 1 | 0 | 1 | NET_CONFIG |
| 79 | js/net.js | 149.8K | 65 | 39 | 23 | NET_MOBS, NET_PLAYER_T, R2D, angDiff, toYaw, fromYaw, NET_FACE, oursToWin, … |
| 80 | js/beacon.js | 11.2K | 11 | 10 | 0 | BEACON_POWERS, BEACON_BASE, BEACON_PAY, beaconTier, BEAM_COLOR, beamAvg, beaconBeam, beaconLevels, … |
| 81 | js/cmdblock.js | 18.9K | 36 | 8 | 0 | CMD_MODE, CMD_BLOCK_OF, CMD_MODE_CN, GM_BLOCKS, cmdKey, cmdProp, cmdConditional, cmdMarkMet, … |
| 82 | js/telemetry.js | 34.7K | 11 | 10 | 19 | TELEMETRY_V, GAME_BUILD, Telemetry, Crumbs, Instances, SensorProbe, FEEDBACK_KINDS, postFeedback, … |
| 83 | js/toy.js | 22.4K | 2 | 2 | 9 | ToyError, Toy |
| 84 | js/account.js | 59.5K | 24 | 13 | 19 | xhr, Account, ACCOUNT_SETTINGS, drawCard, ICON_PIX, drawIcon, unlockCelebrate, UnlockSparks, … |
| 85 | js/capes.js | 43.4K | 1 | 7 | 8 | Capes |
| 86 | js/skins.js | 20.1K | 2 | 10 | 12 | Skins, WardrobeScreen |
| 87 | js/cloudsave.js | 21.1K | 3 | 7 | 0 | CloudSave, CloudScreen, CloudConflictScreen |
| 88 | js/social.js | 7.3K | 3 | 8 | 2 | textOk, InviteCardScreen, showAnnounce |
| 89 | js/mobile.js | 35.9K | 9 | 13 | 5 | Stage, DPAD_RC, touchDescFollows, buzz, QUICK_PHRASES, QUICK_EMOTES, QuickChatScreen, TouchLayoutScreen, … |
| 90 | js/onboard.js | 41.9K | 18 | 14 | 2 | LEGAL, AgreementScreen, PLAYER_KINDS, PlayerKindScreen, QUALITY_CARDS, SHADER_CARDS, QualityScreen, FPS_TEST_V, … |
| 91 | js/jing_tex.js | 0.3K | 1 | 0 | 1 | JING_TEX |
| 92 | js/companion.js | 43.6K | 9 | 17 | 5 | JING_KAOMOJI, COMPANION_OFF, Companion, wrapText, CompanionChatScreen, CompanionScreen, CompanionSharedScreen, CompanionLimitsScreen, … |
| 93 | js/extras.js | 40.8K | 14 | 15 | 4 | Extras, hudMarker, Minimap, WP_COLORS, Waypoints, WaypointScreen, Marks, ReconnectScreen, … |
| 94 | js/cosmetics.js | 30.8K | 1 | 8 | 9 | Cosmetics |
| 95 | js/news.js | 38.4K | 6 | 11 | 2 | NewsBoard, NEWS_T, newsEase, newsEaseIO, NewsScreen, NewsEditScreen |
| 96 | js/checkin.js | 35.9K | 6 | 13 | 3 | Checkin, CHK_PENGUIN, CHK_PAL, CHK_BOX, chkRnd, CheckinScreen |
| 97 | js/shareholders.js | 35.0K | 7 | 11 | 2 | Share, SH, EMPTY_SEAT, SHARE_STYLES, SHARE_GIFT, ShareholdersScreen, openShareholders |
| 98 | js/live.js | 4.3K | 1 | 3 | 8 | Live |
| 99 | js/minigame.js | 13.4K | 3 | 6 | 1 | LEGACY_COL, Legacy, MG |
| 100 | js/anticheat.js | 7.9K | 1 | 6 | 1 | AntiCheat |
| 101 | js/p2p.js | 56.0K | 24 | 25 | 2 | P2P_MAX, p2pUrl, p2pBlocks, p2pPackChunk, p2pUnpackChunk, p2pFrame, beJson, beKey, … |
| 102 | js/panorama.js | 5.6K | 3 | 4 | 1 | PANO_FACES, panoBasis, Panorama |
| 103 | js/potato.js | 548.9K | 0 | 31 | 0 |  |

（另：`js/chunk_worker.js`，磁盘独立 worker，8.7K，由 pack2 的 terrain2.js 加载。）

## 三、模块体量排序（Top 20）

| # | 模块 | 格式化后体积 |
|---|------|------:|
| 1 | js/blockdata.js | 684.8K |
| 2 | js/potato.js | 548.9K |
| 3 | js/game.js | 218.0K |
| 4 | js/entitydata.js | 197.6K |
| 5 | js/net.js | 149.8K |
| 6 | js/itemdata.js | 146.7K |
| 7 | js/assets.js | 126.2K |
| 8 | js/mobs_animals.js | 116.2K |
| 9 | js/features.js | 110.3K |
| 10 | js/models.js | 107.5K |
| 11 | js/worldgen.js | 104.7K |
| 12 | js/render.js | 100.4K |
| 13 | js/entity.js | 97.1K |
| 14 | js/ui.js | 91.5K |
| 15 | js/shaders.js | 81.9K |
| 16 | js/blocks.js | 80.8K |
| 17 | js/recipedata.js | 78.5K |
| 18 | js/screens.js | 72.5K |
| 19 | js/mobs_hostile.js | 72.4K |
| 20 | js/world.js | 67.7K |

## 四、全局依赖关系（静态粗梳理）

依赖定义：模块 A 的顶层作用域声明（`const/let/var/function/class`、
`window.X =`/`self.X =`）中出现在模块 B 正文（词法匹配）→ B 依赖 A。

### 4.1 最被依赖的模块（入边 Top 15）——全局基础设施层

| 模块 | 被依赖数 | 角色 |
|-----|-----:|------|
| js/blocks.js | 70 | 方块定义/BLOCK-BID 体系（最核心数据枢纽） |
| js/util.js | 65 | 通用工具函数 |
| js/game.js | 47 | 游戏主循环/状态机 |
| js/ui.js | 45 | UI 框架 |
| js/audio.js | 44 | 音效引擎 |
| js/world.js | 37 | 世界/区块容器 |
| js/entity.js | 34 | 实体基类体系 |
| js/merchant.js | 29 | 商店/物品堆叠逻辑 |
| js/screens.js | 24 | 屏幕状态切换 |
| js/net.js | 23 | 联机网络 |
| js/mobs2.js | 22 | 生物基础行为 |
| js/render.js | 20 | WebGL 渲染管线 |
| js/telemetry.js | 19 | 遥测 |
| js/account.js | 19 | 账号/登录 |
| js/features.js | 18 | 世界特性（矿脉/结构装饰） |

### 4.2 依赖最多的模块（出边 Top 10）——上层集成点

| 模块 | 依赖数 | 角色 |
|-----|-----:|------|
| js/game.js | 43 | 主循环（几乎横向依赖所有系统） |
| js/net.js | 39 | 联机（集成实体/方块/UI/同步） |
| js/potato.js | 31 | 平台特化（B 站 Toy 侧逻辑，41 万字符巨石） |
| js/p2p.js | 25 | P2P 联机 |
| js/ui.js | 22 | UI 装配 |
| js/screens.js | 22 | 屏幕装配 |
| js/decor.js | 19 | 装饰方块行为 |
| js/companion.js | 17 | 伙伴系统 |
| js/modapi.js | 16 | Mod API 门面 |
| js/mobs_hostile.js | 16 | 敌对生物 |

### 4.3 声明全局最多的模块（Top 10）

| 模块 | 顶层全局数 |
|-----|-----:|
| 124 | js/blocks.js | 97 |
| 125 | js/net.js | 65 |
| 126 | js/shaders.js | 60 |
| 127 | js/mobs_animals.js | 56 |
| 128 | js/entity.js | 49 |
| 129 | js/redstone.js | 45 |
| 130 | js/world.js | 42 |
| 131 | js/mesher.js | 38 |
| 132 | js/cmdblock.js | 36 |
| 133 | js/equip.js | 35 |

### 4.4 分层画像

- **pack1（基础层）**：完整性上报、Mod 装载器、资源清单、文案、工具、地形/方块/物品/配方数据、Mod API。几乎无对外依赖，是被依赖的根。
- **pack2（核心层）**：方块系统（blocks.js 为全局枢纽）、世界/网格化/渲染/着色器、实体与生物 AI 群、UI/save/game、地形生成 worker 客户端、结构/红石/装备/载具等玩法子系统。
- **pack3（特殊玩法层）**：特殊武器 specials、袭击 raids、指令运行时 cmdrun（自带 VM）、Mod UI/代码装载收尾。量少而重。
- **pack4（平台层）**：main 入口点火、触控、性能遥测、联机 net/p2p/beacon、B 站平台对接 toy/account/checkin/shareholders、商城 cosmetics/news、防作弊 anticheat、平台巨石 potato.js。
- **worker 侧**：`js/gen_worker.js` / `js/chunk_worker.js`（磁盘直载），经 `importScripts` 复用 assets/util/worldgen/worldgen_data/blockdata/modapi——即 worker 与主线程共享同一批全局脚本。

## 五、已知限制

1. 变量名已压缩（terser 级 minify），模块内命名不可恢复，本地图仅达**结构级**可维护。
2. 依赖关系为词法近似：同名遮蔽、动态访问（`window[name]`）、字符串拼接引用不计入或误计。
3. `integrity.js` 对脚本内容做哈希上报 telemetry（不阻断执行）；拆分/重建后其上报哈希会与原始 build 不同，属预期行为。
4. pack 模块与磁盘独立文件的差异（换行符/`// min` 头）见报告 `w0-restore-report.md` §3。

## 六、W5b 陀螺仪模块（js/gyro.js）与接入点

> GDD：`docs/gdd/05-gyroscope-spec.md`（W5a 定稿）。实现报告：`docs/architecture/w5b-implementation-report.md`。

### 6.1 js/gyro.js（pack4 #76，加载于 touch.js 之后、perf.js 之前）

| 声明全局 | 说明 |
|---|---|
| `GYRO_TUNING` | 调参块（集中定义，§9 遗留调参项）：pitch 映射 0.8、单事件死区 0.05°、累计死区 0.1°、EMA α=0.5、单帧钳制 30°、旋转静默 300ms、恢复丢事件 2、无数据窗口 1.5s、衰减尾 80ms/K0.6 |
| `Gyro`（self.Gyro） | 模块门面：`getMode/effMode/setMode/getSens/setSens/uiPickMode/resetDefaults/groupVisible/matchLocked/adsActive` + `_test`（纯数学与注入钩子，不进运行时路径） |

结构契约：

- `deviceorientation` 回调内只做「差分累加进缓冲」：姿态 → 四元数（W3C 内旋 Z-X'-Y''，
  q=qz⊗qx⊗qy，设备系→地心系）→ 与上一事件求世界系相对旋转 → 分解出「绕世界竖直轴」
  （视角 yaw）与「绕设备顶边轴」（视角 pitch）两个角度差，push 进 `pend`。不缓冲任何
  计算之外的量；α 回绕与 ±180 跳变由四元数吸收，无需特判。
- 死区 → EMA → 灵敏度（base/ads 按 H5 切换点）→ pitch×0.8 → 单帧 ±30° 钳制 →
  **H2 统一视角写入口 `lookWrite()`**（touch.js 新增全局函数，触屏滑动与陀螺仪共用），
  全部在 rAF 主循环内消费：包装 `Game.prototype.frame`（与 xzguns bundle 同款挂钩方式）。
- H1 开镜唯一事实源：`XZ.aimAmount(player)`（xzguns 的 `player.xz.aimT`），**禁止 FOV 推断**。
- H3 对局状态：`g.state==="play"`、`!g.ui.screen`、`!p.deathTime>0 && p.health>0`、
  `g.mode!=="spectator"`、`document.hidden`、`ui.h<=ui.w`（横屏）、`XZ.match.state().paused`。
- 对局内锁定判定（§6.2/§6.3）：`XZ.match.on(g)`——与黑市平板辅助页同源判定；
  靶场/普通世界为 false → 放开实时调参（§6.4）。
- 无传感器零开销旁路（§7.1）：`TouchDevice.touch` 为假则永不注册监听；
  `frameTick` 每帧首行布尔短路。`gyroNoSensor` 标记（上次会话确认无有效数据）控制
  下次冷启动整组隐藏，收到有效数据即自愈清除。
- 存储：单对象序列化路径（`potato-settings`），新增 `gyroMode / gyroSensBase / gyroSensAds`
  三字段（§1.1 推荐路径），缺失/非法按默认（1/100/100）处理不报错。

### 6.2 接入点改动清单

| 文件 | 位置 | 改动 |
|---|---|---|
| src/js/gyro.js | 新增 | 模块本体 |
| src/js/touch.js | `touchLook` 之后 | 新增全局 `lookWrite(g,dYaw,dPitch,src)`；`TouchControls.movePlay` "look" 分支改调它（行为等价，见 w5b 报告 §2） |
| src/js/potato.js | `PotatoSettings.build()` touch 页 | 新增「陀螺仪」分组（档位 seg / 双滑条 / 说明 / 恢复默认），对局中锁定 |
| src/js/potato.js | `PotatoSettings.fill()` | 新增 `t.seg` 分段控件模板分支；滑条 input 支持 `enabled===false → disabled` |
| src/js/potato.js | `PotatoSettings.mount()` click 委托 | 新增 `[data-gm]` 分段按钮分支 |
| src/index.html / tools/pack-order.json | pack4 touch.js 之后 | 注册 js/gyro.js |

## 七、W10c 搜打撤（SFE）模块与接入点

> GDD：`docs/gdd/06-sfe-spec.md`。技术方案：`docs/architecture/sfe-map-tech-plan.md`。
> 实现报告：`docs/architecture/w10c-implementation-report.md`。

### 7.1 新增模块（4 个，共 ~70KB）

| 模块 | pack / 位置 | 体积 | 门面全局 | 职责 |
|---|---|---:|---|---|
| js/sfe_mapdata.js | pack1 #10（worldgen_data 之后）+ 磁盘独立（gen_worker importScripts） | 16.6K | `SFE_MAP`（self） | 调参块 TUNE（时间轴/读条/变现/仓库/AI 分档/720² 地图档）、当量表 GOODS_VALUE/MATERIAL_VALUE、LOOT T0-T4、POI/撤离点/巢穴哈希网格参数、gen2 噪声世界注入 `injectWorldgen()`（noise_settings.sfe + final_density「信号−垂直梯度」配方；空 configured_carver 置 null） |
| js/sfe_world.js | pack4 #102a（panorama 之后、potato 之前） | 6.5K | `SFE_WORLD`（self） | 固定 seed（seedStr+mapVersion 派生）、世界元数据（ephemeral:true）、高度采样器 makeHeightSampler（裸 BID palette）、start/end 对局生命周期、installGuards（DB.putChunks 吞写盘 + autosaveStart 跳过 = 局终即弃）、aiCap 分档 |
| js/sfe_poi.js | pack4 #102b | 14.2K | `SFE_POI`（self） | computePlan 确定性规划（主 POI spacing16 + 散点 spacing6 频率抽稀 + 撤离锚 3+3 + 巢穴 + spawn 螺旋搜索）、rollTable/fillChest 战利品、valueOf/stackValue/sellValue 当量折算（floor × 50%）、tickPlacement 运行期落位（budget 2/次）、buildAnchor（平台/容器/深坑/信标） |
| js/sfe_rules.js | pack4 #102c | 33.7K | `SFE_RULES`（self） | 对局状态机 PHASES（DEPLOY→LOOT→EXTRACT_OPEN→EXTRACT_MAIN→FORCE_END）、读条 5s（打断暂停不清进度）、死亡掉落 + 保险格快照（`potato:sfe:insnap`）、仓库 24 格（`potato:sfe:stash`）、变现结算（逐格 floor、单局封顶 500，本地账本 `potato:sfe:earn` + `XZ.sfeReward` 预留）、出击准备 DOM 页、AI 遭遇战调度（cap 24/16）、HUD/全图、install() 最小接线 wrap + `_test` mock 钩子 |

### 7.2 接入点改动清单

| 文件 | 位置 | 改动 |
|---|---|---|
| src/js/gen_worker.js | importScripts 链 + Generator 构造 | 增 `sfe_mapdata.js`；`d0 = a.dim || "overworld"` 注入 `new WG.Generator(seed, WG_DATA, palette, d0)`，genFor 维度重定向 → `noise_settings.sfe` 生效 |
| src/js/terrain2.js | GenPool init payload | `...(self.SFE_GEN ? { dim: self.SFE_GEN } : {})` |
| src/js/potato.js | 大厅 04/05 卡后 | 06 号卡 `item(icon,"06","SFE","#F5A623","搜打撤","PVE · 搜物资 · 撤离变现","sfe")`；act 增 `"sfe" → SFE_RULES.openPrep(a)` |
| src/js/sfe_rules.js | install() | Game.prototype tick/hurt/swing/die/onPlayerDeath/onMobKilled/startTitle、UI.prototype.drawHUD、外层 wrap（不侵入原方法） |
| src/js/sfe_world.js | installGuards() | DB.putChunks ephemeral 守卫（cloudsave.js:94 外层再包一层，对局期吞写盘）；autosaveStart 跳过 |
| src/index.html / tools/pack-order.json | pack1 #10 + pack4 #102a-c | 注册 4 个新模块；build.mjs STANDALONE_REQUIRED 增 sfe_mapdata.js（worker 双重身份） |

### 7.3 注意事项（后续维护）

- **BID/BLOCKS 是 blocks.js 顶层 `const`（全局词法绑定）**，不在 `self`/`window` 上——任何模块引用必须裸标识符（`self.BID` 恒为 undefined），sfe_poi/sfe_rules 已按此约定。
- `noise_settings.sfe` 为首个 gen2 噪声自研世界；WG_DATA 原始 noise/density_function 数据在本 build 为空对象，改地形配方只需动 sfe_mapdata.js 的 injectWorldgen。
- SFE 对局不写任何 chunk 数据到 IndexedDB / cloud dirty（守卫链），世界 id `sfe~<ts36>` 结算即删；`potato:sfe:*` 三个 localStorage key 是唯一持久层。

