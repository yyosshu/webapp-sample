const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskItems = document.getElementById('taskItems');
const message = document.getElementById('message');

const renderTasks = (tasks) => {
  if (!Array.isArray(tasks)) {
    return;
  }

  taskItems.innerHTML = '';

  if (tasks.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'まだタスクがありません。追加してみましょう。';
    emptyItem.classList.add('empty');
    taskItems.appendChild(emptyItem);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.classList.add('task-item');
    const title = document.createElement('span');
    title.textContent = task.title;
    item.appendChild(title);

    const completeButton = document.createElement('button');
    completeButton.type = 'button';
    completeButton.textContent = '完了';
    completeButton.classList.add('complete-button');
    completeButton.setAttribute('aria-label', `${task.title} を完了`);
    completeButton.addEventListener('click', () => {
      completeTask(task.id, task.title);
    });

    item.appendChild(completeButton);
    taskItems.appendChild(item);
  });
};

const setMessage = (text = '', isError = false) => {
  message.textContent = text;
  message.style.color = isError ? '#c81e1e' : '#0891b2';
};

const fetchTasks = async () => {
  try {
    const response = await fetch('/tasks');
    if (!response.ok) {
      throw new Error('タスク一覧の取得に失敗しました。');
    }
    const data = await response.json();
    renderTasks(data);
  } catch (error) {
    console.error(error);
    setMessage('タスクを読み込めませんでした。ページを再読み込みしてください。', true);
  }
};

const addTask = async (title) => {
  try {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'タスクの追加に失敗しました。');
    }

    const task = await response.json();
    setMessage(`「${task.title}」を追加しました。`);
    taskInput.value = '';
    taskInput.focus();
    await fetchTasks();
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
};

const completeTask = async (id, title) => {
  try {
    const response = await fetch(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'タスクの完了に失敗しました。');
    }

    setMessage(`「${title}」を完了しました。`);
    await fetchTasks();
  } catch (error) {
    console.error(error);
    setMessage(error.message, true);
  }
};

// フォーム送信時の処理
if (taskForm) {
  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = taskInput.value.trim();
    if (title === '') {
      setMessage('タスクタイトルを入力してください。', true);
      taskInput.focus();
      return;
    }
    addTask(title);
  });
}

fetchTasks();
