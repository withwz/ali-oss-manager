// API 基础 URL
const API_BASE = '/api';

// 当前状态
const state = {
  currentPrefix: '',
  files: [],
  isLoading: false,
};

// DOM 元素
const elements = {
  fileListBody: document.getElementById('fileListBody'),
  refreshBtn: document.getElementById('refreshBtn'),
  uploadBtn: document.getElementById('uploadBtn'),
  searchInput: document.getElementById('searchInput'),
  uploadZone: document.getElementById('uploadZone'),
  fileInput: document.getElementById('fileInput'),
  uploadProgress: document.getElementById('uploadProgress'),
  uploadProgressBar: document.getElementById('uploadProgressBar'),
  uploadFileName: document.getElementById('uploadFileName'),
  previewModal: document.getElementById('previewModal'),
  previewContent: document.getElementById('previewContent'),
};

// 格式化文件大小
function formatSize(bytes) {
  if (bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString('zh-CN');
}

// 获取文件图标
function getFileIcon(name, isFolder) {
  if (isFolder) return '📁';

  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    // 图片
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    // 视频
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    // 文档
    pdf: '📄', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊',
    // 代码
    js: '📜', ts: '📜', py: '📜', java: '📜', css: '📜',
    // 压缩包
    zip: '📦', rar: '📦', tar: '📦', gz: '📦',
  };
  return icons[ext] || '📄';
}

// 加载文件列表
async function loadFiles() {
  if (state.isLoading) return;
  state.isLoading = true;

  try {
    elements.fileListBody.innerHTML = '<div class="loading">加载中...</div>';

    const params = new URLSearchParams({ prefix: state.currentPrefix });
    const response = await fetch(`${API_BASE}/objects?${params}`);
    const result = await response.json();

    if (result.success) {
      state.files = result.data.items;
      renderFiles();
    } else {
      elements.fileListBody.innerHTML = `<div class="empty">加载失败: ${result.error}</div>`;
    }
  } catch (error) {
    elements.fileListBody.innerHTML = `<div class="empty">加载失败: ${error.message}</div>`;
  } finally {
    state.isLoading = false;
  }
}

// 渲染文件列表
function renderFiles(files = state.files) {
  if (files.length === 0) {
    elements.fileListBody.innerHTML = '<div class="empty">暂无文件</div>';
    return;
  }

  elements.fileListBody.innerHTML = files.map((file) => `
    <div class="file-item" data-type="${file.type}" data-name="${file.name}">
      <div class="file-name">
        <span class="file-icon">${getFileIcon(file.name, file.type === 'folder')}</span>
        <span class="file-name-text">${file.name}</span>
      </div>
      <div>${formatSize(file.size)}</div>
      <div>${formatDate(file.lastModified)}</div>
      <div class="file-actions">
        ${file.type === 'folder'
          ? `<button class="icon-btn" onclick="openFolder('${file.name}')">打开</button>`
          : `<button class="icon-btn" onclick="previewFile('${file.name}')">预览</button>
             <button class="icon-btn" onclick="downloadFile('${file.name}')">下载</button>`
        }
        <button class="icon-btn" onclick="deleteFile('${file.name}')" style="color: var(--danger)">删除</button>
      </div>
    </div>
  `).join('');
}

// 打开文件夹
function openFolder(name) {
  state.currentPrefix = name;
  updateBreadcrumb();
  loadFiles();
}

// 更新面包屑
function updateBreadcrumb() {
  const breadcrumb = document.querySelector('.breadcrumb');
  const parts = state.currentPrefix.split('/').filter(Boolean);
  breadcrumb.innerHTML = `
    <span class="breadcrumb-item" onclick="navigateToFolder('')">root</span>
    ${parts.map((part, i) => {
      const prefix = parts.slice(0, i + 1).join('/') + '/';
      return `<span class="breadcrumb-item" onclick="navigateToFolder('${prefix}')">${part}</span>`;
    }).join('')}
  `;
}

// 导航到文件夹
function navigateToFolder(prefix) {
  state.currentPrefix = prefix;
  updateBreadcrumb();
  loadFiles();
}

// 预览文件
async function previewFile(name) {
  try {
    const response = await fetch(`${API_BASE}/signed-url?key=${encodeURIComponent(name)}&expires=3600`);
    const result = await response.json();

    if (result.success) {
      const ext = name.split('.').pop().toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

      if (imageExts.includes(ext)) {
        elements.previewContent.innerHTML = `<img src="${result.data.url}" alt="${name}">`;
        elements.previewModal.classList.remove('hidden');
      } else {
        window.open(result.data.url, '_blank');
      }
    }
  } catch (error) {
    alert('预览失败: ' + error.message);
  }
}

// 下载文件
async function downloadFile(name) {
  try {
    const response = await fetch(`${API_BASE}/signed-url?key=${encodeURIComponent(name)}&expires=3600`);
    const result = await response.json();

    if (result.success) {
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = name.split('/').pop();
      link.click();
    }
  } catch (error) {
    alert('下载失败: ' + error.message);
  }
}

// 删除文件
async function deleteFile(name) {
  if (!confirm(`确定要删除 "${name}" 吗?`)) return;

  try {
    const response = await fetch(`${API_BASE}/objects/${encodeURIComponent(name)}`, { method: 'DELETE' });
    const result = await response.json();

    if (result.success) {
      loadFiles();
    } else {
      alert('删除失败: ' + result.error);
    }
  } catch (error) {
    alert('删除失败: ' + error.message);
  }
}

// 上传文件
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', state.currentPrefix + file.name);

  elements.uploadFileName.textContent = file.name;
  elements.uploadProgress.classList.remove('hidden');
  elements.uploadProgressBar.style.width = '0%';

  try {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        elements.uploadProgressBar.style.width = percent + '%';
        document.getElementById('uploadPercent').textContent = percent + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.success) {
          loadFiles();
          elements.uploadProgress.classList.add('hidden');
        } else {
          alert('上传失败: ' + result.error);
        }
      }
    });

    xhr.open('POST', `${API_BASE}/upload`);
    xhr.send(formData);
  } catch (error) {
    alert('上传失败: ' + error.message);
    elements.uploadProgress.classList.add('hidden');
  }
}

// 事件监听
elements.refreshBtn.addEventListener('click', loadFiles);

elements.uploadZone.addEventListener('click', () => elements.fileInput.click());

elements.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.add('dragover');
});

elements.uploadZone.addEventListener('dragleave', () => {
  elements.uploadZone.classList.remove('dragover');
});

elements.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    uploadFile(files[0]);
  }
});

elements.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    uploadFile(e.target.files[0]);
  }
});

elements.searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = state.files.filter((file) =>
    file.name.toLowerCase().includes(query)
  );
  renderFiles(filtered);
});

document.querySelector('.modal-close').addEventListener('click', () => {
  elements.previewModal.classList.add('hidden');
});

elements.previewModal.addEventListener('click', (e) => {
  if (e.target === elements.previewModal.querySelector('.modal-overlay')) {
    elements.previewModal.classList.add('hidden');
  }
});

// 导航切换
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');

    const view = item.dataset.view;
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');
  });
});

// 初始化
loadFiles();
