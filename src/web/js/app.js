// API 基础 URL
const API_BASE = '/api';

// 当前状态
const state = {
  currentPrefix: '',
  files: [],
  isLoading: false,
  isSearching: false,
};

// DOM 元素
const elements = {
  fileListBody: document.getElementById('fileListBody'),
  refreshBtn: document.getElementById('refreshBtn'),
  uploadBtn: document.getElementById('uploadBtn'),
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
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
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️', ico: '🖼️', bmp: '🖼️',
    // 视频
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬', webm: '🎬', flv: '🎬',
    // 音频
    mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵', m4a: '🎵',
    // 文档
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️',
    txt: '📃', md: '📃', rtf: '📃',
    // 代码
    js: '📜', ts: '📜', py: '📜', java: '📜', css: '📜', html: '🌐', json: '📋', xml: '📋',
    // 压缩包
    zip: '📦', rar: '📦', tar: '📦', gz: '📦', '7z': '📦',
  };
  return icons[ext] || '📄';
}

// 获取文件类型（用于预览判断）
function getFileType(name) {
  const ext = name.split('.').pop().toLowerCase();
  const types = {
    // 图片
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'],
    // 视频
    video: ['mp4', 'webm', 'ogg'],
    // 音频
    audio: ['mp3', 'wav', 'flac'],
    // PDF
    pdf: ['pdf'],
  };
  for (const [type, exts] of Object.entries(types)) {
    if (exts.includes(ext)) return type;
  }
  return 'other';
}

// 加载文件列表
async function loadFiles() {
  if (state.isLoading) return;
  state.isLoading = true;
  state.isSearching = false;

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

// 搜索文件
async function searchFiles(keyword) {
  if (state.isLoading) return;
  if (!keyword.trim()) {
    loadFiles();
    return;
  }

  state.isLoading = true;
  state.isSearching = true;

  try {
    elements.fileListBody.innerHTML = '<div class="loading">搜索中...</div>';

    const params = new URLSearchParams({ q: keyword });
    const response = await fetch(`${API_BASE}/search?${params}`);
    const result = await response.json();

    if (result.success) {
      state.files = result.data.items;
      renderFiles(result.data.items, true);
    } else {
      elements.fileListBody.innerHTML = `<div class="empty">搜索失败: ${result.error}</div>`;
    }
  } catch (error) {
    elements.fileListBody.innerHTML = `<div class="empty">搜索失败: ${error.message}</div>`;
  } finally {
    state.isLoading = false;
  }
}

// 渲染文件列表
function renderFiles(files = state.files, isSearchResult = false) {
  if (files.length === 0) {
    const emptyText = isSearchResult ? '未找到匹配的文件' : '暂无文件';
    elements.fileListBody.innerHTML = `<div class="empty">${emptyText}</div>`;
    return;
  }

  // 搜索结果时显示路径，普通列表只显示文件名
  elements.fileListBody.innerHTML = files.map((file) => {
    const displayName = isSearchResult ? file.name : file.name.replace(state.currentPrefix, '');
    const displayPath = isSearchResult ? `<div class="file-path">${file.name}</div>` : '';

    return `
    <div class="file-item" data-type="${file.type}" data-name="${file.name}">
      <div class="file-name">
        <span class="file-icon">${getFileIcon(file.name, file.type === 'folder')}</span>
        <div class="file-name-wrapper">
          <span class="file-name-text">${displayName}</span>
          ${displayPath}
        </div>
      </div>
      <div>${formatSize(file.size)}</div>
      <div>${formatDate(file.lastModified)}</div>
      <div class="file-actions">
        ${file.type === 'folder'
          ? `<button class="icon-btn" onclick="openFolder('${file.name}')">打开</button>`
          : `<button class="icon-btn" onclick="previewFile('${file.name}')">预览</button>
             <button class="icon-btn" onclick="downloadFile('${file.name}')">下载</button>`
        }
        <button class="icon-btn btn-delete" onclick="deleteFile('${file.name}')">删除</button>
      </div>
    </div>
  `;
  }).join('');
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
  state.isSearching = false;
  elements.searchInput.value = '';
  updateBreadcrumb();
  loadFiles();
}

// 预览文件
async function previewFile(name) {
  try {
    const fileType = getFileType(name);
    const response = await fetch(`${API_BASE}/signed-url?key=${encodeURIComponent(name)}&expires=3600`);
    const result = await response.json();

    if (result.success) {
      const url = result.data.url;
      let content = '';

      switch (fileType) {
        case 'image':
          content = `<img src="${url}" alt="${name}" style="max-width:100%;max-height:80vh;">`;
          break;
        case 'video':
          content = `<video controls autoplay style="max-width:100%;max-height:80vh;">
            <source src="${url}">
            您的浏览器不支持视频播放
          </video>`;
          break;
        case 'audio':
          content = `<audio controls autoplay style="width:100%;">
            <source src="${url}">
            您的浏览器不支持音频播放
          </audio>`;
          break;
        case 'pdf':
          content = `<iframe src="${url}" style="width:100%;height:80vh;border:none;"></iframe>`;
          break;
        default:
          // 其他文件类型，提供下载链接
          content = `
            <div class="preview-fallback">
              <div class="fallback-icon">📄</div>
              <p>此文件类型不支持在线预览</p>
              <p class="file-name">${name}</p>
              <button class="btn btn-primary" onclick="downloadFile('${name}')">下载文件</button>
            </div>
          `;
      }

      elements.previewContent.innerHTML = content;
      elements.previewModal.classList.remove('hidden');
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
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      if (state.isSearching) {
        // 如果在搜索结果中删除，重新搜索
        searchFiles(elements.searchInput.value);
      } else {
        loadFiles();
      }
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
  document.getElementById('uploadPercent').textContent = '0%';

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

    xhr.addEventListener('error', () => {
      alert('上传失败: 网络错误');
      elements.uploadProgress.classList.add('hidden');
    });

    xhr.open('POST', `${API_BASE}/upload`);
    xhr.send(formData);
  } catch (error) {
    alert('上传失败: ' + error.message);
    elements.uploadProgress.classList.add('hidden');
  }
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 事件监听
elements.refreshBtn.addEventListener('click', loadFiles);

elements.searchInput.addEventListener('input', debounce((e) => {
  const keyword = e.target.value;
  if (keyword.trim()) {
    searchFiles(keyword);
  } else {
    loadFiles();
  }
}, 500));

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

document.querySelector('.modal-close').addEventListener('click', () => {
  elements.previewModal.classList.add('hidden');
});

elements.previewModal.addEventListener('click', (e) => {
  if (e.target === elements.previewModal.querySelector('.modal-overlay')) {
    elements.previewModal.classList.add('hidden');
  }
});

// 键盘事件：ESC 关闭预览
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !elements.previewModal.classList.contains('hidden')) {
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
