// Catalog of every mini game. The generator turns each entry into a page
// under /blog/games/<slug>/ and a card on the index; the runtime loads the
// matching module from /blog/games-lib/<slug>.js on demand.
//
// accent = hue offset (degrees) applied on top of the site theme color, so
// every game reads as a variation of the visitor's chosen palette.

export const CATEGORIES = [
  { key: 'arcade', name: '街机动作', desc: '手速与反应，越玩越快' },
  { key: 'puzzle', name: '益智解谜', desc: '慢慢想，想通了很爽' },
  { key: 'board', name: '棋牌对弈', desc: '和 AI 或规则较劲' },
  { key: 'match', name: '消除匹配', desc: '连成一片的快感' },
  { key: 'skill', name: '反应训练', desc: '测测你的极限' },
  { key: 'casual', name: '休闲创意', desc: '随手玩两下' },
]

const svg = (body) =>
  `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`

const S = 'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"'
const S2 = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
const F = 'fill="currentColor"'

export const GAMES = [
  // ---------------- 街机动作 ----------------
  {
    slug: 'snake', name: '贪吃蛇', en: 'Snake', category: 'arcade', accent: 0,
    desc: '起始页那条蛇的完整版。吃食物变长，撞墙或咬到自己就结束。',
    controls: '方向键 / WASD 控制，手机可滑动屏幕',
    icon: svg(`<rect x="6" y="6" width="36" height="36" rx="6" ${S}/><path d="M14 30h8v-8h8v-8h4" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="32" r="3" ${F}/>`),
  },
  {
    slug: 'tetris', name: '俄罗斯方块', en: 'Tetris', category: 'arcade', accent: 160,
    desc: '经典七连块，带下一块预览、影子提示和硬降。消行升级，越来越快。',
    controls: '方向键移动旋转 · 空格硬降 · 手机拖动点按',
    icon: svg(`<rect x="7" y="27" width="11" height="11" rx="2.5" ${S}/><rect x="18" y="16" width="11" height="11" rx="2.5" ${S}/><rect x="18" y="27" width="11" height="11" rx="2.5" ${F} opacity="0.85"/><rect x="29" y="27" width="11" height="11" rx="2.5" ${S} opacity="0.6"/>`),
  },
  {
    slug: 'breakout', name: '打砖块', en: 'Breakout', category: 'arcade', accent: 240,
    desc: '接住小球打光砖块，还有加宽挡板和减速道具，一关比一关快。',
    controls: '鼠标 / 拖动移动挡板 · 点击或空格发射',
    icon: svg(`<rect x="7" y="8" width="10" height="6" rx="2" ${F} opacity="0.6"/><rect x="19" y="8" width="10" height="6" rx="2" ${F} opacity="0.85"/><rect x="31" y="8" width="10" height="6" rx="2" ${F} opacity="0.6"/><rect x="13" y="16" width="10" height="6" rx="2" ${S2}/><rect x="25" y="16" width="10" height="6" rx="2" ${S2}/><circle cx="24" cy="30" r="3.4" ${F}/><rect x="15" y="38" width="18" height="4.5" rx="2.2" ${S}/>`),
  },
  {
    slug: 'dino', name: '像素跑酷', en: 'Dino Run', category: 'arcade', accent: 280,
    desc: '一键起跳的无尽跑酷，越跑越快，暗色模式自动变夜晚。',
    controls: '空格 / 点击跳跃',
    icon: svg(`<path d="M6 38h36" ${S}/><rect x="10" y="18" width="13" height="13" rx="4" ${S}/><circle cx="19.5" cy="22.5" r="1.8" ${F}/><path d="M32 38V27M36.5 38v-7" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>`),
  },
  {
    slug: 'flappy', name: '像素小鸟', en: 'Flappy', category: 'arcade', accent: 45,
    desc: '一键控制高度，从管道缝隙里穿过去。手感很贱，但会上瘾。',
    controls: '空格 / 点击拍翅膀',
    icon: svg(`<rect x="6" y="6" width="9" height="14" rx="2" ${F} opacity="0.55"/><rect x="6" y="30" width="9" height="12" rx="2" ${F} opacity="0.55"/><rect x="33" y="6" width="9" height="18" rx="2" ${F} opacity="0.35"/><rect x="33" y="34" width="9" height="8" rx="2" ${F} opacity="0.35"/><circle cx="24" cy="24" r="6" ${S}/><path d="M20 24l-4 3" ${S2}/>`),
  },
  {
    slug: 'doodle', name: '跳跃者', en: 'Doodle', category: 'arcade', accent: 100,
    desc: '不停往上跳，踩稳每一块台阶，还有弹簧能一飞冲天。',
    controls: '←→ / A D 或手机左右倾斜区域',
    icon: svg(`<rect x="8" y="34" width="14" height="4" rx="2" ${F} opacity="0.6"/><rect x="26" y="24" width="14" height="4" rx="2" ${F} opacity="0.8"/><rect x="10" y="14" width="14" height="4" rx="2" ${F} opacity="0.5"/><circle cx="33" cy="17" r="5.5" ${S}/><path d="M30 12l-2-3M36 12l2-3" ${S2}/>`),
  },
  {
    slug: 'invaders', name: '太空侵略者', en: 'Invaders', category: 'arcade', accent: 200,
    desc: '敌阵一步步压下来，躲在掩体后面把它们全部打光。',
    controls: '←→ 移动 · 空格开火',
    icon: svg(`<path d="M14 12h4v-4h12v4h4v6h4v8H10v-8h4v-6Z" ${S}/><circle cx="20" cy="20" r="1.8" ${F}/><circle cx="28" cy="20" r="1.8" ${F}/><path d="M24 32v6" ${S}/><path d="M16 42h16l-8-6-8 6Z" ${S}/>`),
  },
  {
    slug: 'pong', name: '弹球对战', en: 'Pong', category: 'arcade', accent: 210,
    desc: '最古老的电子游戏。和 AI 你来我往，先得 7 分者胜。',
    controls: '↑↓ / 鼠标拖动挡板',
    icon: svg(`<rect x="7" y="8" width="34" height="32" rx="4" ${S}/><path d="M24 10v28" ${S2} stroke-dasharray="3 4"/><rect x="11" y="16" width="3" height="10" rx="1.5" ${F}/><rect x="34" y="22" width="3" height="10" rx="1.5" ${F}/><circle cx="24" cy="24" r="2.6" ${F}/>`),
  },
  {
    slug: 'jump', name: '跳一跳', en: 'Jump', category: 'arcade', accent: 320,
    desc: '按住蓄力，松手起跳。落在中心有额外加分，连中还有连击。',
    controls: '按住蓄力，松开起跳',
    icon: svg(`<rect x="6" y="30" width="14" height="12" rx="3" ${S}/><rect x="28" y="24" width="14" height="18" rx="3" ${S} opacity="0.6"/><path d="M18 22c3-6 8-6 11-2" ${S2} stroke-dasharray="3 3"/><rect x="12" y="20" width="7" height="10" rx="3" ${F}/>`),
  },
  {
    slug: 'tower100', name: '下一百层', en: '100 Floors', category: 'arcade', accent: 20,
    desc: '平台不断上移，一层层往下踩，别被顶到天花板也别踩到尖刺。',
    controls: '←→ / A D 移动',
    icon: svg(`<path d="M6 10h36" ${S}/><rect x="10" y="20" width="12" height="3.5" rx="1.7" ${F} opacity="0.55"/><rect x="26" y="28" width="12" height="3.5" rx="1.7" ${F} opacity="0.75"/><rect x="12" y="36" width="12" height="3.5" rx="1.7" ${F} opacity="0.55"/><circle cx="16" cy="15" r="4.5" ${S}/>`),
  },
  {
    slug: 'shooter', name: '飞机大战', en: 'Shooter', category: 'arcade', accent: 260,
    desc: '弹幕、道具、Boss 血条一应俱全，看你能撑到第几波。',
    controls: '方向键 / 拖动移动，自动开火',
    icon: svg(`<path d="M24 6l6 14h-4v8h-4v-8h-4l6-14Z" ${F}/><path d="M12 26l6-3v8l-6-2v-3ZM36 26l-6-3v8l6-2v-3Z" ${S2}/><circle cx="14" cy="38" r="3" ${S2}/><circle cx="34" cy="38" r="3" ${S2}/><circle cx="24" cy="40" r="3" ${S2}/>`),
  },
  {
    slug: 'tank', name: '坦克大战', en: 'Tank', category: 'arcade', accent: 130,
    desc: '砖墙能打穿，钢墙打不动。守住基地，消灭所有敌方坦克。',
    controls: '方向键移动 · 空格开炮',
    icon: svg(`<rect x="8" y="26" width="32" height="12" rx="4" ${S}/><rect x="18" y="16" width="12" height="10" rx="3" ${S}/><path d="M24 16V8" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="15" cy="32" r="2" ${F}/><circle cx="24" cy="32" r="2" ${F}/><circle cx="33" cy="32" r="2" ${F}/>`),
  },
  {
    slug: 'racing', name: '极速赛车', en: 'Racing', category: 'arcade', accent: 350,
    desc: '俯视视角躲车流，速度一路往上飙，蹭到就结束。',
    controls: '←→ / A D 变道',
    icon: svg(`<path d="M12 6v36M36 6v36" ${S2} opacity="0.5"/><path d="M24 10v6M24 22v6M24 34v6" ${S2} stroke-dasharray="0" opacity="0.7"/><rect x="17" y="26" width="14" height="14" rx="4" ${S}/><rect x="19" y="8" width="10" height="10" rx="3" ${F} opacity="0.5"/>`),
  },
  {
    slug: 'pinball', name: '弹珠台', en: 'Pinball', category: 'arcade', accent: 300,
    desc: '双挡板守住底线，撞击弹力柱疯狂刷分，还能召唤多球。',
    controls: 'A D / ←→ 控制左右挡板',
    icon: svg(`<rect x="9" y="6" width="30" height="36" rx="10" ${S}/><circle cx="19" cy="17" r="3.5" ${F} opacity="0.75"/><circle cx="30" cy="23" r="3.5" ${F} opacity="0.5"/><path d="M14 34l6 4M34 34l-6 4" ${S}/><circle cx="24" cy="14" r="2.4" ${F}/>`),
  },

  // ---------------- 益智解谜 ----------------
  {
    slug: '2048', name: '2048', en: '2048', category: 'puzzle', accent: 40,
    desc: '滑动合并相同数字，看看能不能凑出 2048。',
    controls: '方向键 / WASD，手机可滑动',
    icon: svg(`<rect x="6" y="6" width="16" height="16" rx="4" ${S}/><rect x="26" y="6" width="16" height="16" rx="4" ${S} opacity="0.55"/><rect x="6" y="26" width="16" height="16" rx="4" ${S} opacity="0.55"/><rect x="26" y="26" width="16" height="16" rx="4" ${F} opacity="0.9"/>`),
  },
  {
    slug: 'minesweeper', name: '扫雷', en: 'Minesweeper', category: 'puzzle', accent: 120,
    desc: '首点必不踩雷，支持初级与进阶两档，数字连点自动展开。',
    controls: '左键翻开 · 右键插旗；手机轻触翻开 · 长按插旗',
    icon: svg(`<circle cx="24" cy="27" r="12" ${S}/><path d="M24 11v6M24 37v-4M11 27h4M37 27h-4M14.7 17.7l3.2 3.2M33.3 17.7l-3.2 3.2" ${S}/><circle cx="20.5" cy="23.5" r="2.4" ${F}/>`),
  },
  {
    slug: 'puzzle15', name: '数字华容道', en: '15 Puzzle', category: 'puzzle', accent: 320,
    desc: '把 1 到 15 滑回原位，打乱保证一定有解。',
    controls: '点击滑块或用方向键',
    icon: svg(`<rect x="7" y="7" width="15" height="15" rx="3.5" ${S}/><rect x="26" y="7" width="15" height="15" rx="3.5" ${F} opacity="0.8"/><rect x="7" y="26" width="15" height="15" rx="3.5" ${F} opacity="0.55"/><rect x="26" y="26" width="15" height="15" rx="3.5" ${S} stroke-dasharray="4 4" opacity="0.6"/>`),
  },
  {
    slug: 'lightsout', name: '关灯游戏', en: 'Lights Out', category: 'puzzle', accent: 55,
    desc: '点一下会连带上下左右一起翻转，把整片灯全部熄灭。',
    controls: '点击方格，难度可调',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="6" ${S}/><rect x="14" y="14" width="8" height="8" rx="2" ${F}/><rect x="26" y="14" width="8" height="8" rx="2" ${F} opacity="0.3"/><rect x="14" y="26" width="8" height="8" rx="2" ${F} opacity="0.3"/><rect x="26" y="26" width="8" height="8" rx="2" ${F}/>`),
  },
  {
    slug: 'hanoi', name: '汉诺塔', en: 'Hanoi', category: 'puzzle', accent: 175,
    desc: '大盘不能压小盘，把整摞盘子搬到最右边，3 到 7 层可调。',
    controls: '点击柱子拿起 / 放下',
    icon: svg(`<path d="M6 40h36" ${S}/><path d="M13 40V14M24 40V14M35 40V14" ${S2} opacity="0.6"/><rect x="5" y="34" width="16" height="4.5" rx="2.2" ${F}/><rect x="7" y="28" width="12" height="4.5" rx="2.2" ${F} opacity="0.75"/><rect x="9" y="22" width="8" height="4.5" rx="2.2" ${F} opacity="0.5"/>`),
  },
  {
    slug: 'game24', name: '24 点', en: '24 Game', category: 'puzzle', accent: 85,
    desc: '四个数字用加减乘除凑出 24，出题带穷举验证，保证有解。',
    controls: '点数字和运算符组合，可撤销',
    icon: svg(`<rect x="6" y="10" width="14" height="20" rx="3" ${S}/><rect x="26" y="10" width="14" height="20" rx="3" ${S} opacity="0.6"/><path d="M13 36v8M9 40h8M31 40h8" ${S}/><path d="M28 36l6 6M34 36l-6 6" ${S2} opacity="0.7"/>`),
  },
  {
    slug: 'bulls', name: '猜数字', en: '1A2B', category: 'puzzle', accent: 15,
    desc: '猜四位不重复数字，A 是位置数字都对，B 是数字对位置错。',
    controls: '数字键盘输入，回车确认',
    icon: svg(`<rect x="7" y="9" width="34" height="12" rx="4" ${S}/><path d="M14 15h4M23 15h4M32 15h2" ${S}/><rect x="9" y="27" width="8" height="7" rx="2" ${F} opacity="0.7"/><rect x="20" y="27" width="8" height="7" rx="2" ${F} opacity="0.45"/><rect x="31" y="27" width="8" height="7" rx="2" ${F} opacity="0.7"/><path d="M13 39h22" ${S2} opacity="0.5"/>`),
  },
  {
    slug: 'sudoku', name: '数独', en: 'Sudoku', category: 'puzzle', accent: 190,
    desc: '挖洞法生成唯一解，支持候选数标记和冲突高亮，三档难度。',
    controls: '选格子后输入数字，可标记候选',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S}/><path d="M18.3 7v34M29.7 7v34M7 18.3h34M7 29.7h34" ${S2} opacity="0.55"/><path d="M12 14h1M35 14h1M23 25h1M12 36h1M35 36h1" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`),
  },
  {
    slug: 'sokoban', name: '推箱子', en: 'Sokoban', category: 'puzzle', accent: 30,
    desc: '只能推不能拉，把所有箱子推到目标点。内置多关，可随时撤销。',
    controls: '方向键推动，支持撤销',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S} opacity="0.5"/><rect x="19" y="19" width="11" height="11" rx="2.5" ${S}/><path d="M19 19l11 11M30 19L19 30" ${S2} opacity="0.6"/><circle cx="12" cy="24" r="3.5" ${F}/><rect x="34" y="20" width="5" height="8" rx="1.5" ${S2} stroke-dasharray="3 3"/>`),
  },
  {
    slug: 'klotski', name: '华容道', en: 'Klotski', category: 'puzzle', accent: 5,
    desc: '横刀立马经典布局，把曹操从下方缺口挪出去。',
    controls: '点击或拖动滑块',
    icon: svg(`<rect x="8" y="7" width="32" height="34" rx="4" ${S}/><rect x="18" y="11" width="12" height="12" rx="2.5" ${F} opacity="0.85"/><rect x="11" y="11" width="5" height="12" rx="2" ${F} opacity="0.45"/><rect x="32" y="11" width="5" height="12" rx="2" ${F} opacity="0.45"/><rect x="18" y="26" width="12" height="5" rx="2" ${F} opacity="0.6"/>`),
  },
  {
    slug: 'nonogram', name: '数织', en: 'Nonogram', category: 'puzzle', accent: 220,
    desc: '按行列数字提示涂格子，最后会拼出一幅像素画。',
    controls: '左键涂黑 · 右键标叉',
    icon: svg(`<path d="M16 8v33M8 16h33" ${S2} opacity="0.6"/><rect x="16" y="16" width="25" height="25" rx="2" ${S}/><rect x="19" y="19" width="6" height="6" ${F}/><rect x="32" y="19" width="6" height="6" ${F}/><rect x="19" y="32" width="6" height="6" ${F}/><rect x="32" y="32" width="6" height="6" ${F}/><path d="M9 21h4M9 30h4M21 9v4M30 9v4" ${S2}/>`),
  },
  {
    slug: 'numberlink', name: '数字连线', en: 'Number Link', category: 'puzzle', accent: 145,
    desc: '把同色端点用不交叉的线连起来，还要铺满整张棋盘。',
    controls: '按住从一端拖到另一端',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S} opacity="0.45"/><circle cx="14" cy="14" r="3.5" ${F}/><circle cx="34" cy="34" r="3.5" ${F}/><path d="M14 18v10h20v-10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="14" r="3" ${S2}/><circle cx="14" cy="34" r="3" ${S2}/>`),
  },
  {
    slug: 'maze', name: '迷宫探险', en: 'Maze', category: 'puzzle', accent: 165,
    desc: '随机生成的迷宫加视野迷雾，走投无路时可以看一眼最短路。',
    controls: '方向键 / 滑动移动',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S}/><path d="M15 7v20h9v7h-9M33 41V21h-9v-7h9" ${S2}/><circle cx="11" cy="11" r="2.4" ${F}/><circle cx="37" cy="37" r="2.4" ${F}/>`),
  },

  // ---------------- 棋牌对弈 ----------------
  {
    slug: 'gomoku', name: '五子棋', en: 'Gomoku', category: 'board', accent: 200,
    desc: '和会算棋型的 AI 下一盘，先连成五子者胜。',
    controls: '点击交叉点落子',
    icon: svg(`<path d="M8 16h32M8 24h32M8 32h32M16 8v32M24 8v32M32 8v32" ${S2} opacity="0.55"/><circle cx="16" cy="24" r="5" ${F}/><circle cx="32" cy="16" r="5" ${S}/>`),
  },
  {
    slug: 'reversi', name: '黑白棋', en: 'Reversi', category: 'board', accent: 20,
    desc: '夹住就翻面，抢住四个角。AI 懂位置价值，别小看它。',
    controls: '点击提示点落子',
    icon: svg(`<circle cx="17" cy="17" r="8" ${F}/><circle cx="31" cy="31" r="8" ${S}/><path d="M31 9a8 8 0 0 1 8 8M17 39a8 8 0 0 1-8-8" ${S}/>`),
  },
  {
    slug: 'tictactoe', name: '井字棋', en: 'Tic Tac Toe', category: 'board', accent: 250,
    desc: '看着简单，但这个 AI 用的是完美策略——你最多只能逼平。',
    controls: '点击空格，可切换先后手',
    icon: svg(`<path d="M18 8v32M30 8v32M8 18h32M8 30h32" ${S2} opacity="0.6"/><path d="M11 11l4 4M15 11l-4 4" ${S}/><circle cx="24" cy="24" r="4" ${S}/><path d="M33 33l4 4M37 33l-4 4" ${S}/>`),
  },
  {
    slug: 'checkers', name: '西洋跳棋', en: 'Checkers', category: 'board', accent: 35,
    desc: '能吃必须吃，连跳一气呵成，走到底线升王倒着走。',
    controls: '点击棋子再点目标格',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S} opacity="0.45"/><circle cx="17" cy="17" r="6" ${F} opacity="0.85"/><circle cx="31" cy="31" r="6" ${S}/><path d="M28 29l3-3 3 3" ${S2}/>`),
  },
  {
    slug: 'xiangqi', name: '中国象棋', en: 'Xiangqi', category: 'board', accent: 355,
    desc: '完整走法规则、将军与将死判定，AI 会算子力和位置。',
    controls: '点击棋子再点目标点',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S}/><path d="M7 24h34" ${S2} opacity="0.5"/><circle cx="17" cy="16" r="6" ${S}/><circle cx="31" cy="32" r="6" ${F} opacity="0.8"/><path d="M14 16h6M17 13v6" ${S2}/>`),
  },
  {
    slug: 'blackjack', name: '21 点', en: 'Blackjack', category: 'board', accent: 340,
    desc: '要牌、停牌、加倍，庄家 17 点必停。别爆了就行。',
    controls: '点击按钮决策',
    icon: svg(`<rect x="8" y="12" width="18" height="26" rx="3" transform="rotate(-10 8 12)" ${S}/><rect x="24" y="10" width="18" height="26" rx="3" ${S}/><path d="M33 17l4 6-4 6-4-6 4-6Z" ${F}/>`),
  },
  {
    slug: 'yahtzee', name: '快艇骰子', en: 'Yahtzee', category: 'board', accent: 275,
    desc: '五颗骰子最多掷三次，锁住想要的，填满十三个计分格。',
    controls: '点骰子锁定，点计分格记录',
    icon: svg(`<rect x="6" y="18" width="18" height="18" rx="4" ${S}/><rect x="26" y="10" width="16" height="16" rx="4" ${S} opacity="0.6"/><circle cx="12" cy="24" r="1.9" ${F}/><circle cx="18" cy="30" r="1.9" ${F}/><circle cx="12" cy="30" r="1.9" ${F}/><circle cx="18" cy="24" r="1.9" ${F}/><circle cx="34" cy="18" r="1.9" ${F}/>`),
  },
  {
    slug: 'solitaire', name: '纸牌接龙', en: 'Solitaire', category: 'board', accent: 150,
    desc: 'Windows 同款 Klondike。点击移动而不是拖拽，手机也顺手。',
    controls: '点击选牌，再点目标堆',
    icon: svg(`<rect x="6" y="8" width="14" height="19" rx="3" ${S}/><rect x="28" y="8" width="14" height="19" rx="3" ${S} opacity="0.55"/><rect x="12" y="22" width="14" height="19" rx="3" ${F} opacity="0.75"/><path d="M17 30l3 4-3 4-3-4 3-4Z" fill="var(--panel, #fff)"/>`),
  },
  {
    slug: 'freecell', name: '空当接龙', en: 'FreeCell', category: 'board', accent: 185,
    desc: '四个空位随便挪，几乎每一局都能解开——就看你会不会。',
    controls: '点击选牌，再点目标堆',
    icon: svg(`<rect x="6" y="7" width="8" height="11" rx="2" ${S2} stroke-dasharray="3 3"/><rect x="17" y="7" width="8" height="11" rx="2" ${S2} stroke-dasharray="3 3"/><rect x="34" y="7" width="8" height="11" rx="2" ${S}/><rect x="9" y="24" width="10" height="16" rx="2.5" ${F} opacity="0.7"/><rect x="23" y="24" width="10" height="16" rx="2.5" ${S}/>`),
  },

  // ---------------- 消除匹配 ----------------
  {
    slug: 'match3', name: '消消乐', en: 'Match 3', category: 'match', accent: 330,
    desc: '交换相邻方块连成三个，掉落会引发连锁，步数有限。',
    controls: '点击相邻两格交换，或滑动',
    icon: svg(`<circle cx="14" cy="14" r="5" ${F} opacity="0.85"/><circle cx="24" cy="14" r="5" ${F} opacity="0.85"/><circle cx="34" cy="14" r="5" ${F} opacity="0.85"/><circle cx="14" cy="26" r="5" ${S2}/><circle cx="24" cy="26" r="5" ${S2}/><circle cx="34" cy="26" r="5" ${S2} opacity="0.5"/><circle cx="19" cy="37" r="4" ${S2} opacity="0.4"/><circle cx="30" cy="37" r="4" ${S2} opacity="0.4"/>`),
  },
  {
    slug: 'onet', name: '连连看', en: 'Onet', category: 'match', accent: 105,
    desc: '两张相同的牌，连线不超过两个折点就能消掉。卡住了能洗牌。',
    controls: '点击两张相同的牌',
    icon: svg(`<rect x="7" y="9" width="13" height="13" rx="3" ${S}/><rect x="28" y="26" width="13" height="13" rx="3" ${S}/><path d="M13.5 22v10h21V26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 3"/><circle cx="13.5" cy="15.5" r="2.4" ${F}/><circle cx="34.5" cy="32.5" r="2.4" ${F}/>`),
  },
  {
    slug: 'bubble', name: '泡泡龙', en: 'Bubble', category: 'match', accent: 195,
    desc: '瞄准角度打上去，三个同色就爆，断开连接的会一起掉下来。',
    controls: '移动瞄准，点击发射',
    icon: svg(`<circle cx="14" cy="12" r="5.5" ${F} opacity="0.8"/><circle cx="25" cy="12" r="5.5" ${S2}/><circle cx="36" cy="12" r="5.5" ${F} opacity="0.5"/><circle cx="19.5" cy="22" r="5.5" ${S2} opacity="0.7"/><circle cx="30.5" cy="22" r="5.5" ${F} opacity="0.6"/><path d="M24 40v-8" ${S}/><circle cx="24" cy="42" r="3" ${F}/>`),
  },
  {
    slug: 'zuma', name: '祖玛', en: 'Zuma', category: 'match', accent: 25,
    desc: '珠链沿轨道往前爬，从中间射进去凑三个同色炸掉它。',
    controls: '移动瞄准，点击发射',
    icon: svg(`<path d="M40 24a16 16 0 1 1-16-16" ${S2} opacity="0.5" stroke-dasharray="4 4"/><circle cx="30" cy="10" r="3.6" ${F} opacity="0.85"/><circle cx="38" cy="17" r="3.6" ${S2}/><circle cx="40" cy="27" r="3.6" ${F} opacity="0.6"/><circle cx="24" cy="26" r="5" ${S}/><path d="M24 26l6-6" ${S2}/>`),
  },
  {
    slug: 'mahjong', name: '麻将连连看', en: 'Mahjong', category: 'match', accent: 65,
    desc: '层叠的牌堆，只有两侧不被压住的牌才能点，配对消除。',
    controls: '点击两张可选的相同牌',
    icon: svg(`<rect x="8" y="16" width="12" height="16" rx="2.5" ${S}/><rect x="28" y="16" width="12" height="16" rx="2.5" ${S}/><rect x="18" y="10" width="12" height="16" rx="2.5" ${F} opacity="0.8"/><path d="M12 22h4M32 22h4" ${S2}/>`),
  },
  {
    slug: 'suika', name: '合成大西瓜', en: 'Suika', category: 'match', accent: 350,
    desc: '同样大小的水果碰在一起会合成更大的，别让它们堆过头顶。',
    controls: '左右移动，点击投放',
    icon: svg(`<path d="M10 40h28" ${S} opacity="0.5"/><circle cx="18" cy="32" r="8" ${S}/><circle cx="33" cy="34" r="6" ${F} opacity="0.7"/><circle cx="27" cy="20" r="5" ${F} opacity="0.45"/><circle cx="15" cy="16" r="3.5" ${S2}/>`),
  },

  // ---------------- 反应训练 ----------------
  {
    slug: 'memory', name: '记忆翻牌', en: 'Memory', category: 'skill', accent: 80,
    desc: '翻开两张相同的牌就配对成功，用最少步数清空棋盘。',
    controls: '点击或轻触卡片',
    icon: svg(`<rect x="5" y="10" width="16" height="24" rx="4" transform="rotate(-8 5 10)" ${S}/><rect x="26" y="12" width="16" height="24" rx="4" ${S}/><path d="M31 24h6M34 21v6" ${S}/>`),
  },
  {
    slug: 'simon', name: '西蒙记忆', en: 'Simon', category: 'skill', accent: 60,
    desc: '四个色块按顺序闪烁，凭记忆复现，每轮多记一个。',
    controls: '看完闪烁后点击复现',
    icon: svg(`<path d="M24 6a18 18 0 0 1 18 18h-8a10 10 0 0 0-10-10V6Z" ${F} opacity="0.85"/><path d="M24 6a18 18 0 0 0-18 18h8a10 10 0 0 1 10-10V6Z" ${S2}/><path d="M6 24a18 18 0 0 0 18 18v-8a10 10 0 0 1-10-10H6Z" ${S2}/><path d="M42 24a18 18 0 0 1-18 18v-8a10 10 0 0 0 10-10h8Z" ${F} opacity="0.5"/>`),
  },
  {
    slug: 'whack', name: '打地鼠', en: 'Whack', category: 'skill', accent: 100,
    desc: '60 秒限时，地鼠越冒越快，金色地鼠三倍分，连击有加成。',
    controls: '点击冒头的地鼠',
    icon: svg(`<ellipse cx="24" cy="36" rx="14" ry="4.5" ${S}/><path d="M14 34v-8a10 10 0 0 1 20 0v8" ${S}/><circle cx="20" cy="26" r="1.8" ${F}/><circle cx="28" cy="26" r="1.8" ${F}/><path d="M22.5 30.5c1 .8 2 .8 3 0" ${S2}/>`),
  },
  {
    slug: 'reaction', name: '反应速度', en: 'Reaction', category: 'skill', accent: 140,
    desc: '变绿的瞬间出手，五轮取平均，看看你是不是电竞级反应。',
    controls: '变绿后尽快点击',
    icon: svg(`<path d="M26 5 12 27h9l-3 16 16-24h-9l1-14Z" ${S} fill="currentColor" fill-opacity="0.25"/>`),
  },
  {
    slug: 'schulte', name: '舒尔特方格', en: 'Schulte', category: 'skill', accent: 210,
    desc: '按 1 到 25 顺序点，专注力训练经典项目，点错要罚时。',
    controls: '按数字顺序点击',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S}/><path d="M18.3 7v34M29.7 7v34M7 18.3h34M7 29.7h34" ${S2} opacity="0.45"/><rect x="8" y="8" width="9.5" height="9.5" rx="2" ${F} opacity="0.7"/><rect x="30.5" y="30.5" width="9.5" height="9.5" rx="2" ${F} opacity="0.35"/>`),
  },
  {
    slug: 'memorymatrix', name: '记忆矩阵', en: 'Memory Matrix', category: 'skill', accent: 235,
    desc: '方格闪一下就消失，凭记忆点回来，格子会越来越多。',
    controls: '记住闪烁的格子再点击',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S} opacity="0.5"/><rect x="11" y="11" width="9" height="9" rx="2" ${F}/><rect x="28" y="11" width="9" height="9" rx="2" ${S2}/><rect x="11" y="28" width="9" height="9" rx="2" ${S2}/><rect x="28" y="28" width="9" height="9" rx="2" ${F}/>`),
  },
  {
    slug: 'colormatch', name: '色差挑战', en: 'Color Match', category: 'skill', accent: 290,
    desc: '一堆同色方块里藏着一个不一样的，找出来。色差越来越小。',
    controls: '点击颜色不同的那个',
    icon: svg(`<rect x="7" y="7" width="15" height="15" rx="3" ${F} opacity="0.35"/><rect x="26" y="7" width="15" height="15" rx="3" ${F} opacity="0.35"/><rect x="7" y="26" width="15" height="15" rx="3" ${F} opacity="0.75"/><rect x="26" y="26" width="15" height="15" rx="3" ${F} opacity="0.35"/>`),
  },
  {
    slug: 'aim', name: '瞄准训练', en: 'Aim Trainer', category: 'skill', accent: 15,
    desc: '30 秒内尽可能多地击中靶子，统计命中率和平均反应。',
    controls: '点击靶心',
    icon: svg(`<circle cx="24" cy="24" r="16" ${S}/><circle cx="24" cy="24" r="9" ${S2} opacity="0.7"/><circle cx="24" cy="24" r="3" ${F}/><path d="M24 4v6M24 38v6M4 24h6M38 24h6" ${S}/>`),
  },
  {
    slug: 'typing', name: '打字速度', en: 'Typing', category: 'skill', accent: 170,
    desc: '照着句子打，实时统计速度和正确率，打错会标红。',
    controls: '直接用键盘输入',
    icon: svg(`<rect x="5" y="14" width="38" height="22" rx="4" ${S}/><path d="M12 21h2M19 21h2M26 21h2M33 21h2M12 27h2M19 27h2M26 27h2M33 27h2M16 33h16" ${S2}/>`),
  },
  {
    slug: 'mathsprint', name: '速算冲刺', en: 'Math Sprint', category: 'skill', accent: 125,
    desc: '60 秒做尽量多的四则运算，答对加时，难度会跟着涨。',
    controls: '点数字键盘或直接敲键盘',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="5" ${S}/><path d="M14 18h8M18 14v8M28 18h7M26 30h8M30 26v8" ${S}/><path d="M13 31l5-5M18 31l-5-5" ${S2}/>`),
  },
  {
    slug: 'pianotiles', name: '别踩白块', en: 'Piano Tiles', category: 'skill', accent: 205,
    desc: '四条轨道往下掉黑块，只能踩黑的，速度一路加快。',
    controls: 'DFJK 或点击对应轨道',
    icon: svg(`<rect x="7" y="6" width="34" height="36" rx="3" ${S} opacity="0.5"/><path d="M15.5 6v36M24 6v36M32.5 6v36" ${S2} opacity="0.4"/><rect x="8" y="10" width="7" height="11" rx="1.5" ${F} opacity="0.85"/><rect x="25" y="20" width="7" height="11" rx="1.5" ${F} opacity="0.85"/><rect x="16.5" y="31" width="7" height="11" rx="1.5" ${F} opacity="0.85"/>`),
  },
  {
    slug: 'rhythm', name: '节奏大师', en: 'Rhythm', category: 'skill', accent: 315,
    desc: '音符掉到判定线时按键，Perfect / Good / Miss 三档判定加连击。',
    controls: 'DFJK 或点击轨道',
    icon: svg(`<path d="M8 34a4 4 0 1 0 8 0V14l16-4v20" ${S}/><path d="M28 34a4 4 0 1 0 8 0" ${S}/><path d="M16 20l16-4" ${S2}/>`),
  },

  // ---------------- 休闲创意 ----------------
  {
    slug: 'rps', name: '石头剪刀布', en: 'RPS', category: 'casual', accent: 40,
    desc: '这个 AI 会记录你的出拳习惯来预测下一步。别有固定套路。',
    controls: '点击出拳',
    icon: svg(`<circle cx="14" cy="16" r="7" ${S}/><path d="M28 10l5 7-5 7M40 10l-5 7 5 7" ${S2}/><rect x="10" y="30" width="28" height="10" rx="4" ${F} opacity="0.6"/>`),
  },
  {
    slug: 'slot', name: '老虎机', en: 'Slot', category: 'casual', accent: 350,
    desc: '三轴依次缓停，连成一线有倍率。纯看运气，不花钱。',
    controls: '点击拉杆开始',
    icon: svg(`<rect x="7" y="10" width="30" height="28" rx="4" ${S}/><rect x="11" y="17" width="6" height="12" rx="2" ${F} opacity="0.75"/><rect x="19" y="17" width="6" height="12" rx="2" ${F} opacity="0.5"/><rect x="27" y="17" width="6" height="12" rx="2" ${F} opacity="0.75"/><path d="M41 16v10" ${S}/><circle cx="41" cy="13" r="3" ${F}/>`),
  },
  {
    slug: 'hexguess', name: '猜色值', en: 'Hex Guess', category: 'casual', accent: 265,
    desc: '给你一个颜色，猜它的 HEX 值。和本站的调色盘是一家人。',
    controls: '从三个选项里选，或直接输入',
    icon: svg(`<circle cx="24" cy="20" r="13" ${S}/><path d="M24 7v26" ${S2} opacity="0.5"/><path d="M11 20h26" ${S2} opacity="0.5"/><path d="M15 40h18" ${S}/><path d="M19 36l-2 4M29 36l2 4" ${S2}/>`),
  },
  {
    slug: 'wordle', name: '猜词', en: 'Wordle', category: 'casual', accent: 90,
    desc: '六次机会猜五字母单词，绿色位置对，黄色字母对位置错。',
    controls: '键盘输入，回车提交',
    icon: svg(`<rect x="6" y="9" width="9" height="9" rx="2" ${F} opacity="0.85"/><rect x="17" y="9" width="9" height="9" rx="2" ${S2}/><rect x="28" y="9" width="9" height="9" rx="2" ${F} opacity="0.45"/><rect x="6" y="21" width="9" height="9" rx="2" ${S2}/><rect x="17" y="21" width="9" height="9" rx="2" ${F} opacity="0.85"/><rect x="28" y="21" width="9" height="9" rx="2" ${S2}/><path d="M10 37h28" ${S2} opacity="0.5"/>`),
  },
  {
    slug: 'idiom', name: '成语接龙', en: 'Idiom Chain', category: 'casual', accent: 10,
    desc: '用上一个成语的末字接下一个，内置词库，限时挑战。',
    controls: '从候选里选，或输入四字成语',
    icon: svg(`<rect x="6" y="12" width="15" height="15" rx="3" ${S}/><rect x="27" y="21" width="15" height="15" rx="3" ${S}/><path d="M21 19h6M21 19v10h6" ${S2} stroke-dasharray="3 3"/><path d="M11 19h5M32 28h5" ${S2}/>`),
  },
  {
    slug: 'lifegame', name: '生命游戏', en: 'Life', category: 'casual', accent: 155,
    desc: '康威细胞自动机。画几个点让它自己演化，内置滑翔机等经典图案。',
    controls: '拖动画细胞，可暂停调速',
    icon: svg(`<rect x="7" y="7" width="34" height="34" rx="4" ${S} opacity="0.45"/><rect x="21" y="12" width="6" height="6" ${F}/><rect x="28" y="19" width="6" height="6" ${F}/><rect x="14" y="26" width="6" height="6" ${F}/><rect x="21" y="26" width="6" height="6" ${F}/><rect x="28" y="26" width="6" height="6" ${F}/>`),
  },
]

export const GAMES_BY_CATEGORY = CATEGORIES.map((cat) => ({
  ...cat,
  games: GAMES.filter((g) => g.category === cat.key),
})).filter((c) => c.games.length)
