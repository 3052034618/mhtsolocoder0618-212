import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'shanjing.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    start_point TEXT NOT NULL,
    distance REAL NOT NULL,
    elevation_gain REAL NOT NULL,
    elevation_loss REAL NOT NULL,
    difficulty TEXT NOT NULL,
    duration TEXT NOT NULL,
    season_recommendation TEXT NOT NULL DEFAULT '[]',
    precautions TEXT,
    photos TEXT NOT NULL DEFAULT '[]',
    gpx_url TEXT,
    author_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    season TEXT,
    actual_duration TEXT,
    difficulty_feeling TEXT,
    rating INTEGER NOT NULL,
    content TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    UNIQUE(user_id, route_id)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    date TEXT NOT NULL,
    meeting_point TEXT NOT NULL,
    expected_count INTEGER NOT NULL DEFAULT 10,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'recruiting',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (leader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    intro TEXT,
    experience TEXT,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(team_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS team_itineraries (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    day_index INTEGER NOT NULL,
    route_node TEXT NOT NULL,
    accommodation TEXT,
    duration TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS safety_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    team_id TEXT,
    route_id TEXT,
    checkin_time TEXT NOT NULL DEFAULT (datetime('now')),
    expected_return_time TEXT NOT NULL,
    checkout_time TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (route_id) REFERENCES routes(id)
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_routes_province ON routes(province);
  CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty);
  CREATE INDEX IF NOT EXISTS idx_routes_author ON routes(author_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_route ON reviews(route_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_route ON favorites(route_id);
  CREATE INDEX IF NOT EXISTS idx_teams_route ON teams(route_id);
  CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
  CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
  CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
  CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_team ON messages(team_id);
  CREATE INDEX IF NOT EXISTS idx_safety_checkins_user ON safety_checkins(user_id);
  CREATE INDEX IF NOT EXISTS idx_safety_checkins_status ON safety_checkins(status);
  CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
`)

// Schema migrations - add missing columns/tables to existing databases
try {
  const tmCols = db.prepare("PRAGMA table_info(team_members)").all() as { name: string }[]
  const tmColNames = tmCols.map(c => c.name)
  if (!tmColNames.includes('intro')) {
    db.prepare("ALTER TABLE team_members ADD COLUMN intro TEXT").run()
  }
  if (!tmColNames.includes('experience')) {
    db.prepare("ALTER TABLE team_members ADD COLUMN experience TEXT").run()
  }
} catch (e) {
  console.warn('Migration team_members warning:', e)
}

try {
  const tiExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='team_itineraries'").get() as any
  if (!tiExists) {
    db.exec(`
      CREATE TABLE team_itineraries (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        day_index INTEGER NOT NULL,
        route_node TEXT NOT NULL,
        accommodation TEXT,
        duration TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );
    `)
  }
} catch (e) {
  console.warn('Migration team_itineraries warning:', e)
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const passwordHash = bcrypt.hashSync('password123', 10)

  const users = [
    { id: uuidv4(), username: '山野行者', email: 'hiker1@example.com', avatar: '' },
    { id: uuidv4(), username: '云上漫步', email: 'hiker2@example.com', avatar: '' },
    { id: uuidv4(), username: '户外小白', email: 'hiker3@example.com', avatar: '' },
    { id: uuidv4(), username: '巅峰猎手', email: 'hiker4@example.com', avatar: '' },
    { id: uuidv4(), username: '溪谷探路者', email: 'hiker5@example.com', avatar: '' },
  ]

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, email, password_hash, avatar) VALUES (?, ?, ?, ?, ?)'
  )

  for (const u of users) {
    insertUser.run(u.id, u.username, u.email, passwordHash, u.avatar)
  }

  const photo1 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20hiking%20trail%20with%20fog%20and%20green%20forest&image_size=landscape_16_9'
  const photo2 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=alpine%20meadow%20with%20wildflowers%20and%20snow%20peaks&image_size=landscape_16_9'
  const photo3 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rocky%20mountain%20path%20with%20dramatic%20cliff%20views&image_size=landscape_16_9'
  const photo4 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=autumn%20forest%20trail%20with%20golden%20leaves&image_size=landscape_16_9'
  const photo5 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=waterfall%20hike%20through%20lush%20bamboo%20forest&image_size=landscape_16_9'
  const photo6 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snowy%20mountain%20trek%20with%20blue%20sky&image_size=landscape_16_9'
  const photo7 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=desert%20canyon%20hiking%20with%20red%20rocks&image_size=landscape_16_9'
  const photo8 = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lakeside%20mountain%20trail%20at%20sunrise&image_size=landscape_16_9'

  const routes = [
    {
      id: uuidv4(), name: '梅里雪山雨崩徒步', province: '云南', start_point: '德钦县西当村',
      distance: 68, elevation_gain: 3200, elevation_loss: 2800, difficulty: '困难',
      duration: '4-5天', season_recommendation: JSON.stringify(['春季', '秋季']),
      precautions: '高原反应风险，需提前适应海拔；雨季山路湿滑，注意防滑；必备防晒和保暖装备',
      photos: JSON.stringify([photo1, photo2]), gpx_url: '', author_id: users[0].id
    },
    {
      id: uuidv4(), name: '四姑娘山长坪沟穿越', province: '四川', start_point: '小金县四姑娘山镇',
      distance: 42, elevation_gain: 2100, elevation_loss: 1900, difficulty: '困难',
      duration: '3-4天', season_recommendation: JSON.stringify(['夏季', '秋季']),
      precautions: '高海拔徒步，建议携带氧气瓶；沟内信号弱，提前下载离线地图；注意野生动物出没',
      photos: JSON.stringify([photo3, photo6]), gpx_url: '', author_id: users[1].id
    },
    {
      id: uuidv4(), name: '墨脱徒步线路', province: '西藏', start_point: '林芝市派镇',
      distance: 96, elevation_gain: 4500, elevation_loss: 4200, difficulty: '专家',
      duration: '5-7天', season_recommendation: JSON.stringify(['春季', '秋季']),
      precautions: '需办理边防证；蚂蟥密集区做好防护；雨季极易塌方，务必关注天气预报；建议结伴同行',
      photos: JSON.stringify([photo1]), gpx_url: '', author_id: users[3].id
    },
    {
      id: uuidv4(), name: '莫干山竹林古道', province: '浙江', start_point: '德清县莫干山镇',
      distance: 12, elevation_gain: 580, elevation_loss: 580, difficulty: '简单',
      duration: '半天', season_recommendation: JSON.stringify(['春季', '夏季', '秋季']),
      precautions: '夏季注意防蚊虫；部分古道石阶湿滑；建议穿防滑登山鞋',
      photos: JSON.stringify([photo5, photo4]), gpx_url: '', author_id: users[2].id
    },
    {
      id: uuidv4(), name: '黄山天都峰环线', province: '安徽', start_point: '黄山市汤口镇',
      distance: 18, elevation_gain: 1200, elevation_loss: 1200, difficulty: '中等',
      duration: '1-2天', season_recommendation: JSON.stringify(['春季', '秋季']),
      precautions: '天都峰台阶陡峭，恐高者慎行；旺季人流较大，建议错峰出行；山上住宿需提前预订',
      photos: JSON.stringify([photo3, photo8]), gpx_url: '', author_id: users[4].id
    },
    {
      id: uuidv4(), name: '武功山高山草甸穿越', province: '江西', start_point: '萍乡市麻田乡',
      distance: 35, elevation_gain: 1800, elevation_loss: 1800, difficulty: '中等',
      duration: '2-3天', season_recommendation: JSON.stringify(['夏季', '秋季']),
      precautions: '山顶风大，注意防风保暖；草甸无遮蔽，做好防晒；露营需自带帐篷和睡袋',
      photos: JSON.stringify([photo2, photo8]), gpx_url: '', author_id: users[0].id
    },
    {
      id: uuidv4(), name: '张掖丹霞地质徒步', province: '甘肃', start_point: '张掖市临泽县',
      distance: 8, elevation_gain: 320, elevation_loss: 320, difficulty: '简单',
      duration: '半天', season_recommendation: JSON.stringify(['春季', '夏季', '秋季']),
      precautions: '干旱地区注意补水防晒；禁止踩踏丹霞地貌；景区内须沿指定步道行走',
      photos: JSON.stringify([photo7]), gpx_url: '', author_id: users[1].id
    },
    {
      id: uuidv4(), name: '稻城亚丁转山', province: '四川', start_point: '稻城县香格里拉镇',
      distance: 32, elevation_gain: 1600, elevation_loss: 1600, difficulty: '困难',
      duration: '2-3天', season_recommendation: JSON.stringify(['夏季', '秋季']),
      precautions: '海拔4000米以上，高原反应风险大；牛奶海路段风大寒冷；建议携带高热量食物和热水',
      photos: JSON.stringify([photo6, photo2, photo8]), gpx_url: '', author_id: users[3].id
    }
  ]

  const insertRoute = db.prepare(
    `INSERT INTO routes (id, name, province, start_point, distance, elevation_gain, elevation_loss,
      difficulty, duration, season_recommendation, precautions, photos, gpx_url, author_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const r of routes) {
    insertRoute.run(
      r.id, r.name, r.province, r.start_point, r.distance, r.elevation_gain, r.elevation_loss,
      r.difficulty, r.duration, r.season_recommendation, r.precautions, r.photos, r.gpx_url, r.author_id
    )
  }

  const reviews = [
    { id: uuidv4(), route_id: routes[0].id, user_id: users[1].id, season: '秋季', actual_duration: '5天', difficulty_feeling: '比预期难', rating: 5, content: '雨崩太美了！冰湖和神瀑都值得一看，虽然路途辛苦但绝对值得。建议住上雨崩，风景更好。' },
    { id: uuidv4(), route_id: routes[0].id, user_id: users[2].id, season: '春季', actual_duration: '4天', difficulty_feeling: '适中', rating: 4, content: '春天的雨崩满山杜鹃花，美不胜收。不过翻越南宗垭口时比较累，建议控制节奏。' },
    { id: uuidv4(), route_id: routes[1].id, user_id: users[0].id, season: '秋季', actual_duration: '3天', difficulty_feeling: '有点难', rating: 5, content: '长坪沟的秋色绝了！从原始森林到高山草甸，景观变化丰富。木骡子营地很美。' },
    { id: uuidv4(), route_id: routes[1].id, user_id: users[3].id, season: '夏季', actual_duration: '4天', difficulty_feeling: '非常困难', rating: 4, content: '夏季雨水多，山路湿滑增加了难度。但原始森林的绿意和野花让人心旷神怡。' },
    { id: uuidv4(), route_id: routes[2].id, user_id: users[4].id, season: '秋季', actual_duration: '6天', difficulty_feeling: '极具挑战', rating: 5, content: '墨脱是真正的探险之旅！从雪山到热带雨林的垂直气候变化太震撼了，这一辈子值得走一次。' },
    { id: uuidv4(), route_id: routes[3].id, user_id: users[0].id, season: '夏季', actual_duration: '4小时', difficulty_feeling: '很轻松', rating: 4, content: '非常适合新手的入门线路，竹林幽静，空气清新。周末休闲好去处，适合带家人。' },
    { id: uuidv4(), route_id: routes[3].id, user_id: users[3].id, season: '秋季', actual_duration: '3小时', difficulty_feeling: '轻松', rating: 5, content: '秋天的莫干山太治愈了！金黄的竹林加上凉爽的秋风，整个人都放松下来。' },
    { id: uuidv4(), route_id: routes[4].id, user_id: users[1].id, season: '春季', actual_duration: '2天', difficulty_feeling: '有点累', rating: 4, content: '黄山果然名不虚传，云海日出太壮观了。天都峰确实很险，需要一定体力。' },
    { id: uuidv4(), route_id: routes[5].id, user_id: users[2].id, season: '夏季', actual_duration: '2天', difficulty_feeling: '适中', rating: 5, content: '武功山的草甸在夏天简直像绿毯一样铺满山脊，帐篷节气氛超好！日出也特别美。' },
    { id: uuidv4(), route_id: routes[5].id, user_id: users[4].id, season: '秋季', actual_duration: '3天', difficulty_feeling: '适中', rating: 4, content: '秋天的武功山金色草甸别有一番风味，但风比夏天大很多，帐篷差点被吹跑。' },
    { id: uuidv4(), route_id: routes[6].id, user_id: users[2].id, season: '秋季', actual_duration: '3小时', difficulty_feeling: '轻松', rating: 4, content: '丹霞地貌的色彩太梦幻了，日落时分最美。就是景区内限制较多，不能自由走动。' },
    { id: uuidv4(), route_id: routes[7].id, user_id: users[0].id, season: '秋季', actual_duration: '3天', difficulty_feeling: '比较困难', rating: 5, content: '亚丁三神山都看到了，仙乃日、央迈勇、夏诺多吉各具特色。牛奶海蓝得不像话！' },
  ]

  const insertReview = db.prepare(
    `INSERT INTO reviews (id, route_id, user_id, season, actual_duration, difficulty_feeling, rating, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const r of reviews) {
    insertReview.run(r.id, r.route_id, r.user_id, r.season, r.actual_duration, r.difficulty_feeling, r.rating, r.content)
  }

  const teams = [
    {
      id: uuidv4(), route_id: routes[0].id, leader_id: users[0].id,
      date: '2025-04-15', meeting_point: '德钦县西当村停车场',
      expected_count: 8, notes: '有高原经验者优先，需自备露营装备', status: 'recruiting'
    },
    {
      id: uuidv4(), route_id: routes[4].id, leader_id: users[4].id,
      date: '2025-05-01', meeting_point: '黄山市汤口镇换乘中心',
      expected_count: 12, notes: '适合新手，老带新，不落下任何一个人', status: 'recruiting'
    },
    {
      id: uuidv4(), route_id: routes[5].id, leader_id: users[1].id,
      date: '2025-06-20', meeting_point: '萍乡市麻田乡登山口',
      expected_count: 10, notes: '帐篷节期间同行，一起看日出', status: 'full'
    }
  ]

  const insertTeam = db.prepare(
    `INSERT INTO teams (id, route_id, leader_id, date, meeting_point, expected_count, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const t of teams) {
    insertTeam.run(t.id, t.route_id, t.leader_id, t.date, t.meeting_point, t.expected_count, t.notes, t.status)
  }

  const teamMembers = [
    { id: uuidv4(), team_id: teams[0].id, user_id: users[0].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[0].id, user_id: users[1].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[0].id, user_id: users[2].id, status: 'pending', intro: '有过高原徒步经验，身体素质好，可以帮大家背包', experience: '走过雨崩、稻城亚丁' },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[4].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[2].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[0].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[2].id, user_id: users[1].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[2].id, user_id: users[3].id, status: 'approved', intro: null, experience: null },
    { id: uuidv4(), team_id: teams[2].id, user_id: users[4].id, status: 'pending', intro: '第一次露营，但参加过多次一日徒步，想体验山顶看日出', experience: '武功山、黄山、莫干山' },
  ]

  const insertTeamMember = db.prepare(
    'INSERT INTO team_members (id, team_id, user_id, status, intro, experience) VALUES (?, ?, ?, ?, ?, ?)'
  )

  for (const m of teamMembers) {
    insertTeamMember.run(m.id, m.team_id, m.user_id, m.status, m.intro, m.experience)
  }

  const itineraries = [
    { id: uuidv4(), team_id: teams[1].id, day_index: 1, route_node: '汤口镇换乘中心 → 云谷寺 → 白鹅岭 → 北海宾馆', accommodation: '北海宾馆', duration: '约6小时', notes: '建议坐云谷索道上山，节省体力' },
    { id: uuidv4(), team_id: teams[1].id, day_index: 2, route_node: '光明顶看日出 → 飞来石 → 排云亭 → 西海大峡谷 → 慈光阁', accommodation: '山下民宿', duration: '约8小时', notes: '峡谷台阶多，注意膝盖保护' },
    { id: uuidv4(), team_id: teams[0].id, day_index: 1, route_node: '西当村 → 南宗垭口 → 上雨崩', accommodation: '上雨崩客栈', duration: '约7小时', notes: '翻越南宗垭口约12公里，海拔上升1200米' },
    { id: uuidv4(), team_id: teams[0].id, day_index: 2, route_node: '上雨崩 → 冰湖 → 上雨崩', accommodation: '上雨崩客栈', duration: '约6小时', notes: '冰湖往返海拔上升约800米，带够饮用水' },
    { id: uuidv4(), team_id: teams[0].id, day_index: 3, route_node: '上雨崩 → 下雨崩 → 神瀑 → 下雨崩', accommodation: '下雨崩客栈', duration: '约5小时', notes: '神瀑是藏民转山圣地，尊重当地风俗' },
    { id: uuidv4(), team_id: teams[0].id, day_index: 4, route_node: '下雨崩 → 尼农大峡谷 → 德钦', accommodation: '德钦酒店', duration: '约6小时', notes: '尼农峡谷路段较窄，注意落石' },
  ]

  const insertItinerary = db.prepare(
    'INSERT INTO team_itineraries (id, team_id, day_index, route_node, accommodation, duration, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  for (const it of itineraries) {
    insertItinerary.run(it.id, it.team_id, it.day_index, it.route_node, it.accommodation, it.duration, it.notes)
  }

  const messagesData = [
    { id: uuidv4(), team_id: teams[0].id, user_id: users[0].id, content: '大家好！4月15日雨崩徒步，请提前到达西当村停车场集合', type: 'text' },
    { id: uuidv4(), team_id: teams[0].id, user_id: users[1].id, content: '收到！我14号就到德钦适应一下海拔', type: 'text' },
    { id: uuidv4(), team_id: teams[0].id, user_id: users[0].id, content: '好的，提前适应很重要。我整理了一份装备清单，稍后发给大家', type: 'text' },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[4].id, content: '五一黄山行出发！大家注意带够水和干粮', type: 'text' },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[2].id, content: '第一次爬黄山，有点紧张又很期待！', type: 'text' },
    { id: uuidv4(), team_id: teams[1].id, user_id: users[0].id, content: '别担心，天都峰如果觉得太难可以走旁边的一线天', type: 'text' },
    { id: uuidv4(), team_id: teams[2].id, user_id: users[1].id, content: '帐篷节当天人会很多，大家记得早点占位', type: 'text' },
    { id: uuidv4(), team_id: teams[2].id, user_id: users[3].id, content: '我带了个大帐篷，可以多住两个人', type: 'text' },
  ]

  const insertMessage = db.prepare(
    'INSERT INTO messages (id, team_id, user_id, content, type) VALUES (?, ?, ?, ?, ?)'
  )

  for (const m of messagesData) {
    insertMessage.run(m.id, m.team_id, m.user_id, m.content, m.type)
  }

  const checkins = [
    {
      id: uuidv4(), user_id: users[0].id, team_id: teams[0].id, route_id: routes[0].id,
      checkin_time: '2025-04-15 08:00:00', expected_return_time: '2025-04-19 18:00:00',
      checkout_time: '2025-04-19 16:30:00', status: 'completed'
    },
    {
      id: uuidv4(), user_id: users[1].id, team_id: teams[0].id, route_id: routes[0].id,
      checkin_time: '2025-04-15 08:00:00', expected_return_time: '2025-04-19 18:00:00',
      checkout_time: null, status: 'active'
    },
    {
      id: uuidv4(), user_id: users[4].id, team_id: teams[1].id, route_id: routes[4].id,
      checkin_time: '2025-05-01 07:00:00', expected_return_time: '2025-05-02 18:00:00',
      checkout_time: '2025-05-02 15:00:00', status: 'completed'
    },
  ]

  const insertCheckin = db.prepare(
    `INSERT INTO safety_checkins (id, user_id, team_id, route_id, checkin_time, expected_return_time, checkout_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const c of checkins) {
    insertCheckin.run(c.id, c.user_id, c.team_id, c.route_id, c.checkin_time, c.expected_return_time, c.checkout_time, c.status)
  }

  const contacts = [
    { id: uuidv4(), user_id: users[0].id, name: '张明（配偶）', phone: '13800001111' },
    { id: uuidv4(), user_id: users[0].id, name: '李华（朋友）', phone: '13900002222' },
    { id: uuidv4(), user_id: users[1].id, name: '王芳（母亲）', phone: '13700003333' },
    { id: uuidv4(), user_id: users[2].id, name: '赵丽（姐姐）', phone: '13600004444' },
    { id: uuidv4(), user_id: users[3].id, name: '陈刚（兄弟）', phone: '13500005555' },
    { id: uuidv4(), user_id: users[4].id, name: '刘洋（伴侣）', phone: '13400006666' },
  ]

  const insertContact = db.prepare(
    'INSERT INTO emergency_contacts (id, user_id, name, phone) VALUES (?, ?, ?, ?)'
  )

  for (const c of contacts) {
    insertContact.run(c.id, c.user_id, c.name, c.phone)
  }
}

export default db
