// API 基础 URL
const API_BASE = '/api';

// 当前状态
const state = {
  currentPrefix: '',
  files: [],
  allFiles: [], // 搜索结果
  isLoading: false,
  isSearching: false,

  // 分页状态
  pagination: {
    currentPage: 1,
    totalPages: 1,
    pageSize: 50,
    continuationTokens: {}, // 存储每页的 continuation token
    hasMore: false,
  },

  // 排序状态
  sort: {
    field: 'name',
    order: 'asc', // 'asc' or 'desc'
  },

  // 画廊状态
  gallery: {
    images: [],
    loadedCount: 0,
    isLoading: false,
    hasMore: true,
    sortBy: 'name',
  },
};

// DOM 元素
const elements = {
  fileListBody: document.getElementById('fileListBody'),
  refreshBtn: document.getElementById('refreshBtn'),
  searchInput: document.getElementById('searchInput'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
  sortField: document.getElementById('sortField'),
  sortOrder: document.getElementById('sortOrder'),
  previewModal: document.getElementById('previewModal'),
  previewContent: document.getElementById('previewContent'),
  fileCount: document.getElementById('fileCount'),
  currentPage: document.getElementById('currentPage'),
  totalPages: document.getElementById('totalPages'),
  firstPageBtn: document.getElementById('firstPageBtn'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  lastPageBtn: document.getElementById('lastPageBtn'),
  // 画廊元素
  galleryMasonry: document.getElementById('galleryMasonry'),
  galleryCount: document.getElementById('galleryCount'),
  gallerySort: document.getElementById('gallerySort'),
  refreshGalleryBtn: document.getElementById('refreshGalleryBtn'),
  loadMoreGallery: document.getElementById('loadMoreGallery'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
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
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'],
    video: ['mp4', 'webm', 'ogg'],
    audio: ['mp3', 'wav', 'flac'],
    pdf: ['pdf'],
  };
  for (const [type, exts] of Object.entries(types)) {
    if (exts.includes(ext)) return type;
  }
  return 'other';
}

// 排序文件
function sortFiles(files) {
  const { field, order } = state.sort;
  const sorted = [...files].sort((a, b) => {
    // 文件夹排在前面
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'lastModified':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        break;
    }
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}

// 加载文件列表（带分页）
async function loadFiles(resetPage = true) {
  if (state.isLoading) return;

  // 如果在搜索模式，使用搜索结果
  if (state.isSearching) {
    renderPaginatedFiles(state.allFiles);
    updatePaginationUI();
    return;
  }

  state.isLoading = true;

  try {
    // 重置到第一页
    if (resetPage) {
      state.pagination.currentPage = 1;
      state.pagination.continuationTokens = {};
    }

    elements.fileListBody.innerHTML = '<div class="loading">加载中...</div>';

    // 获取当前页的 continuation token
    const continuationToken = state.pagination.continuationTokens[state.pagination.currentPage];

    const params = new URLSearchParams({
      prefix: state.currentPrefix,
      'max-keys': state.pagination.pageSize.toString(),
    });

    if (continuationToken) {
      params.append('continuation-token', continuationToken);
    }

    const response = await fetch(`${API_BASE}/objects?${params}`);
    const result = await response.json();

    if (result.success) {
      state.files = result.data.items || [];
      state.pagination.hasMore = result.data.isTruncated;
      state.pagination.keyCount = result.data.keyCount || state.files.length;

      // 保存下一页的 token
      if (result.data.isTruncated && result.data.nextMarker) {
        state.pagination.continuationTokens[state.pagination.currentPage + 1] = result.data.nextMarker;
      }

      // 计算总页数（估算）
      if (!result.data.isTruncated) {
        state.pagination.totalPages = state.pagination.currentPage;
      } else {
        // 估算总页数
        const estimatedTotal = state.pagination.currentPage * state.pagination.pageSize;
        state.pagination.totalPages = Math.ceil(estimatedTotal / state.pagination.pageSize);
      }

      renderPaginatedFiles(state.files);
      updatePaginationUI();
    } else {
      elements.fileListBody.innerHTML = `<div class="empty">加载失败: ${result.error}</div>`;
    }
  } catch (error) {
    elements.fileListBody.innerHTML = `<div class="empty">加载失败: ${error.message}</div>`;
  } finally {
    state.isLoading = false;
  }
}

// 搜索文件（全库搜索）
async function searchFiles(keyword) {
  if (!keyword.trim()) {
    state.isSearching = false;
    state.allFiles = [];
    loadFiles(true);
    return;
  }

  if (state.isLoading) return;

  state.isLoading = true;
  state.isSearching = true;

  try {
    elements.fileListBody.innerHTML = '<div class="loading">搜索中...</div>';

    const params = new URLSearchParams({
      q: keyword,
      limit: '1000',
    });

    const response = await fetch(`${API_BASE}/search?${params}`);
    const result = await response.json();

    if (result.success) {
      state.allFiles = result.data.items || [];
      state.pagination.currentPage = 1;
      renderPaginatedFiles(state.allFiles);
      updatePaginationUI();
    } else {
      elements.fileListBody.innerHTML = `<div class="empty">搜索失败: ${result.error}</div>`;
    }
  } catch (error) {
    elements.fileListBody.innerHTML = `<div class="empty">搜索失败: ${error.message}</div>`;
  } finally {
    state.isLoading = false;
  }
}

// 渲染分页文件
function renderPaginatedFiles(files) {
  // 先排序
  const sortedFiles = sortFiles(files);

  // 如果是搜索模式，前端分页
  if (state.isSearching) {
    const startIndex = (state.pagination.currentPage - 1) * state.pagination.pageSize;
    const endIndex = startIndex + state.pagination.pageSize;
    const pageFiles = sortedFiles.slice(startIndex, endIndex);

    state.pagination.totalPages = Math.ceil(sortedFiles.length / state.pagination.pageSize) || 1;

    renderFileList(pageFiles, true);
  } else {
    renderFileList(sortedFiles, false);
  }

  // 更新文件计数
  const fileCount = sortedFiles.filter(f => f.type === 'file').length;
  const folderCount = sortedFiles.filter(f => f.type === 'folder').length;
  elements.fileCount.textContent = `${fileCount} 个文件, ${folderCount} 个文件夹`;
}

// HTML 转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 渲染文件列表
function renderFileList(files, isSearchResult) {
  if (files.length === 0) {
    const emptyText = isSearchResult ? '未找到匹配的文件' : '暂无文件';
    elements.fileListBody.innerHTML = `<div class="empty">${emptyText}</div>`;
    return;
  }

  elements.fileListBody.innerHTML = files.map((file) => {
    const displayName = isSearchResult ? file.name : file.name.replace(state.currentPrefix, '');
    const displayPath = isSearchResult ? `<div class="file-path">${escapeHtml(file.name)}</div>` : '';
    const escapedName = escapeHtml(file.name);

    return `
    <div class="file-item" data-type="${file.type}" data-name="${escapedName}">
      <div class="file-name">
        <span class="file-icon">${getFileIcon(file.name, file.type === 'folder')}</span>
        <div class="file-name-wrapper">
          <span class="file-name-text">${escapeHtml(displayName)}</span>
          ${displayPath}
        </div>
      </div>
      <div>${formatSize(file.size)}</div>
      <div>${formatDate(file.lastModified)}</div>
      <div class="file-actions">
        ${file.type === 'folder'
          ? `<button class="icon-btn" data-action="openFolder">打开</button>`
          : `<button class="icon-btn" data-action="previewFile">预览</button>
             <button class="icon-btn" data-action="downloadFile">下载</button>`
        }
      </div>
    </div>
  `;
  }).join('');
}

// 更新分页 UI
function updatePaginationUI() {
  const { currentPage, totalPages, hasMore } = state.pagination;

  elements.currentPage.textContent = currentPage;
  elements.totalPages.textContent = state.isSearching ? totalPages : (hasMore ? `${totalPages}+` : totalPages);

  // 更新按钮状态
  elements.firstPageBtn.disabled = currentPage <= 1;
  elements.prevPageBtn.disabled = currentPage <= 1;
  elements.nextPageBtn.disabled = state.isSearching ? currentPage >= totalPages : !hasMore;
  elements.lastPageBtn.disabled = state.isSearching ? currentPage >= totalPages : false;
}

// 打开文件夹
function openFolder(name) {
  state.currentPrefix = name;
  state.isSearching = false;
  state.pagination.continuationTokens = {};
  elements.searchInput.value = '';
  updateBreadcrumb();
  loadFiles(true);
}

// 更新面包屑
function updateBreadcrumb() {
  const breadcrumb = document.querySelector('.breadcrumb');
  const parts = state.currentPrefix.split('/').filter(Boolean);

  // 创建 root 面包屑项
  const rootItem = document.createElement('span');
  rootItem.className = 'breadcrumb-item';
  rootItem.textContent = 'root';
  rootItem.addEventListener('click', () => navigateToFolder(''));

  breadcrumb.innerHTML = '';
  breadcrumb.appendChild(rootItem);

  // 添加子路径面包屑项
  parts.forEach((part, i) => {
    const prefix = parts.slice(0, i + 1).join('/') + '/';
    const item = document.createElement('span');
    item.className = 'breadcrumb-item';
    item.textContent = part;
    item.addEventListener('click', () => navigateToFolder(prefix));
    breadcrumb.appendChild(item);
  });
}

// 导航到文件夹
function navigateToFolder(prefix) {
  state.currentPrefix = prefix;
  state.isSearching = false;
  state.pagination.continuationTokens = {};
  elements.searchInput.value = '';
  updateBreadcrumb();
  loadFiles(true);
}

// 翻页操作
function goToPage(page) {
  if (page < 1 || page === state.pagination.currentPage) return;

  // 搜索模式：前端分页
  if (state.isSearching) {
    state.pagination.currentPage = page;
    renderPaginatedFiles(state.allFiles);
    updatePaginationUI();
  } else {
    // 普通模式：需要从服务器加载
    state.pagination.currentPage = page;
    loadFiles(false);
  }
}

// 预览文件
async function previewFile(name) {
  try {
    const fileType = getFileType(name);
    const response = await fetch(`${API_BASE}/signed-url?key=${encodeURIComponent(name)}&expires=3600`);
    const result = await response.json();
    console.log('result: ', result);

    if (result.success) {
      const url = result.data.url;
      let content = '';

      switch (fileType) {
        case 'image':
          content = `<img src="${url}" alt="${escapeHtml(name)}">`;
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
          content = `
            <div class="preview-fallback">
              <div class="fallback-icon">📄</div>
              <p>此文件类型不支持在线预览</p>
              <p class="file-name">${escapeHtml(name)}</p>
              <button class="btn btn-primary preview-download-btn" data-file-name="${escapeHtml(name)}">下载文件</button>
            </div>
          `;
      }

      elements.previewContent.innerHTML = content;
      elements.previewModal.classList.remove('hidden');

      // 绑定下载按钮事件
      const downloadBtn = elements.previewContent.querySelector('.preview-download-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => downloadFile(name));
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
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    alert('下载失败: ' + error.message);
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
elements.refreshBtn.addEventListener('click', () => loadFiles(true));

// 搜索防抖
elements.searchInput.addEventListener('input', debounce((e) => {
  const keyword = e.target.value;
  searchFiles(keyword);
}, 500));

// 每页数量选择
elements.pageSizeSelect.addEventListener('change', (e) => {
  state.pagination.pageSize = parseInt(e.target.value, 10);
  state.pagination.continuationTokens = {};
  loadFiles(true);
});

// 排序字段选择
elements.sortField.addEventListener('change', (e) => {
  state.sort.field = e.target.value;
  if (state.isSearching) {
    renderPaginatedFiles(state.allFiles);
  } else {
    renderPaginatedFiles(state.files);
  }
});

// 排序方向切换
elements.sortOrder.addEventListener('click', () => {
  const currentOrder = state.sort.order;
  const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
  state.sort.order = newOrder;
  elements.sortOrder.setAttribute('data-order', newOrder);

  if (state.isSearching) {
    renderPaginatedFiles(state.allFiles);
  } else {
    renderPaginatedFiles(state.files);
  }
});

// 分页按钮
elements.firstPageBtn.addEventListener('click', () => goToPage(1));
elements.prevPageBtn.addEventListener('click', () => goToPage(state.pagination.currentPage - 1));
elements.nextPageBtn.addEventListener('click', () => goToPage(state.pagination.currentPage + 1));
elements.lastPageBtn.addEventListener('click', () => goToPage(state.pagination.totalPages));

// 模态框事件
document.querySelector('.modal-close').addEventListener('click', () => {
  elements.previewModal.classList.add('hidden');
});

elements.previewModal.addEventListener('click', (e) => {
  if (e.target === elements.previewModal.querySelector('.modal-overlay')) {
    elements.previewModal.classList.add('hidden');
  }
});

// 文件操作按钮事件委托
elements.fileListBody.addEventListener('click', (e) => {
  // 检查是否点击了按钮
  const btn = e.target.closest('.icon-btn');
  if (btn) {
    const fileItem = btn.closest('.file-item');
    if (!fileItem) return;

    const fileName = fileItem.dataset.name;
    const action = btn.dataset.action;

    switch (action) {
      case 'openFolder':
        openFolder(fileName);
        break;
      case 'previewFile':
        previewFile(fileName);
        break;
      case 'downloadFile':
        downloadFile(fileName);
        break;
    }
    return;
  }

  // 检查是否点击了文件名
  const fileNameWrapper = e.target.closest('.file-name-wrapper');
  if (fileNameWrapper) {
    const fileItem = fileNameWrapper.closest('.file-item');
    if (!fileItem) return;

    const fileName = fileItem.dataset.name;
    const fileType = fileItem.dataset.type;

    if (fileType === 'folder') {
      openFolder(fileName);
    } else {
      previewFile(fileName);
    }
  }
});

// ESC 键关闭预览
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !elements.previewModal.classList.contains('hidden')) {
    elements.previewModal.classList.add('hidden');
  }
});

// ========== 画廊功能 ==========

// 图片扩展名列表
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif'];

// 判断是否为图片
function isImageFile(name) {
  const ext = name.split('.').pop().toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

// 加载画廊图片
async function loadGallery(reset = true) {
  if (state.gallery.isLoading) return;

  state.gallery.isLoading = true;

  try {
    if (reset) {
      state.gallery.images = [];
      state.gallery.loadedCount = 0;
      state.gallery.hasMore = true;
      elements.galleryMasonry.innerHTML = '<div class="gallery-loading"><div class="spinner"></div><p>加载图片中...</p></div>';
    }

    // 使用搜索 API 获取所有图片文件
    const response = await fetch(`${API_BASE}/search?q=&limit=500`);
    const result = await response.json();

    console.log('Gallery API result:', result);

    if (result.success) {
      const items = result.data.items || [];
      console.log('Items before filter:', items);

      const images = items.filter(item => {
        const isFile = item.type === 'file';
        const isImg = isImageFile(item.name);
        console.log(`${item.name}: type=${item.type}, isFile=${isFile}, isImage=${isImg}`);
        return isFile && isImg;
      });

      console.log('Filtered images:', images);

      state.gallery.images = images;
      state.gallery.hasMore = false;
      state.gallery.loadedCount = images.length;

      await renderGallery();
    }
  } catch (error) {
    console.error('Gallery load error:', error);
    elements.galleryMasonry.innerHTML = `<div class="gallery-empty"><div class="gallery-empty-icon">⚠️</div><p>加载失败: ${error.message}</p></div>`;
  } finally {
    state.gallery.isLoading = false;
  }
}

// 渲染画廊
async function renderGallery() {
  const images = sortGalleryImages(state.gallery.images);

  if (images.length === 0) {
    elements.galleryMasonry.innerHTML = `
      <div class="gallery-empty">
        <div class="gallery-empty-icon">🖼️</div>
        <p>暂无图片</p>
      </div>
    `;
    elements.galleryCount.textContent = '0 张图片';
    elements.loadMoreGallery.classList.add('hidden');
    return;
  }

  elements.galleryCount.textContent = `${images.length} 张图片`;

  // 获取签名 URL
  const imageUrls = await Promise.all(
    images.map(async (img) => {
      try {
        const response = await fetch(`${API_BASE}/signed-url?key=${encodeURIComponent(img.name)}&expires=3600`);
        const result = await response.json();
        return result.success ? result.data.url : null;
      } catch {
        return null;
      }
    })
  );

  elements.galleryMasonry.innerHTML = images.map((img, index) => {
    const url = imageUrls[index];
    const hasImage = !!url;
    // 更自然的动画延迟
    const delay = Math.min(index * 0.03, 0.4);

    return `
    <div class="gallery-item ${!hasImage ? 'image-error' : ''}" data-name="${escapeHtml(img.name)}" style="animation-delay: ${delay}s">
      ${hasImage
        ? `<img class="gallery-item-image" src="${url}" alt="${escapeHtml(img.name)}" loading="lazy">`
        : `<div class="gallery-item-placeholder">🖼️</div>`
      }
      <div class="gallery-item-info">
        <div class="gallery-item-name">${escapeHtml(img.name.split('/').pop())}</div>
        <div class="gallery-item-meta">
          <span>${formatSize(img.size)}</span>
        </div>
      </div>
      <div class="gallery-item-actions">
        <button class="gallery-action-btn" data-action="preview" title="预览">👁️</button>
        <button class="gallery-action-btn" data-action="download" title="下载">⬇️</button>
      </div>
    </div>
  `;
  }).join('');

  // 显示/隐藏加载更多按钮
  if (state.gallery.hasMore) {
    elements.loadMoreGallery.classList.remove('hidden');
  } else {
    elements.loadMoreGallery.classList.add('hidden');
  }
}

// 排序画廊图片
function sortGalleryImages(images) {
  const sortBy = state.gallery.sortBy;
  return [...images].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case 'size':
        return b.size - a.size;
      default:
        return 0;
    }
  });
}

// 画廊排序
elements.gallerySort?.addEventListener('change', async (e) => {
  state.gallery.sortBy = e.target.value;
  await renderGallery();
});

// 刷新画廊
elements.refreshGalleryBtn?.addEventListener('click', () => loadGallery(true));

// 加载更多
elements.loadMoreBtn?.addEventListener('click', () => loadGallery(false));

// 画廊点击事件
elements.galleryMasonry?.addEventListener('click', (e) => {
  const galleryItem = e.target.closest('.gallery-item');
  if (!galleryItem) return;

  const actionBtn = e.target.closest('.gallery-action-btn');
  const fileName = galleryItem.dataset.name;

  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.dataset.action;
    if (action === 'preview') {
      previewFile(fileName);
    } else if (action === 'download') {
      downloadFile(fileName);
    }
  } else {
    // 点击图片预览
    previewFile(fileName);
  }
});

// ========== 视图切换 ==========

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
    item.classList.add('active');

    const view = item.dataset.view;
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');

    // 切换到画廊视图时加载图片
    if (view === 'gallery' && state.gallery.images.length === 0) {
      loadGallery(true);
    }
  });
});


// 初始化
loadFiles(true);
