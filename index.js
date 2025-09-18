const path = require('path');
const fs = require('fs/promises');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// JSONボディを扱うミドルウェア
app.use(express.json());

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));

// タスクを保存するファイルパス
// Vercel などのサーバーレス環境では /var/task 配下が読み取り専用のため、
// 書き込み可能な /tmp へ退避し、ローカル開発では従来通りリポジトリ配下を使う。
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.env.VERCEL ? '/tmp' : __dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// タスクをファイルから読み込むユーティリティ
const readTasks = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
      return [];
    }
    throw error;
  }
};

// タスクをファイルに書き込むユーティリティ
const writeTasks = async (tasks) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
};

// タスク一覧の取得
app.get('/tasks', async (_req, res, next) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// タスクの追加（タイトルのみ）
app.post('/tasks', async (req, res, next) => {
  try {
    const { title } = req.body;

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'タイトルは必須です。' });
    }

    const tasks = await readTasks();
    const task = {
      id: Date.now().toString(),
      title: title.trim(),
    };

    tasks.push(task);
    await writeTasks(tasks);

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// タスクの完了（削除）
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'タスクIDが指定されていません。' });
    }

    const tasks = await readTasks();
    const nextTasks = tasks.filter((task) => task.id !== id);

    if (nextTasks.length === tasks.length) {
      return res.status(404).json({ error: 'タスクが見つかりません。' });
    }

    await writeTasks(nextTasks);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// シンプルなエラーハンドリング
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました。' });
});

app.listen(port, () => {
  console.log(`Task app listening on port ${port}`);
});
