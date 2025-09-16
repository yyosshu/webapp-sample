const path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// JSONボディを扱うミドルウェア
app.use(express.json());

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));

// メモリ上でタスクを保持
const tasks = [];

// タスク一覧の取得
app.get('/tasks', (_req, res) => {
  res.json(tasks);
});

// タスクの追加（タイトルのみ）
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'タイトルは必須です。' });
  }

  const task = {
    id: Date.now().toString(),
    title: title.trim(),
  };

  tasks.push(task);
  res.status(201).json(task);
});

// シンプルなエラーハンドリング
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました。' });
});

app.listen(port, () => {
  console.log(`Task app listening on port ${port}`);
});
