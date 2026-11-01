/* =============================================================================
   K4L1 FORGE // MARKDOWN & TACTICAL DOC VIEWER ENGINE v1.0 (189.89.619 Hz)
   Zero-Dependency GitHub-Flavored Markdown Parser + Live Editor & Doc Catalog
   Concilio ACE (161914) — Arquitectura para Kali (K4L1)
   ============================================================================= */
(function (window, document) {
  'use strict';

  // Catálogo Canónico de Documentos Markdown del Repositorio
  var DOCS_CATALOG = [
    {
      group: "🌌 Cosmología & Lore Anuu",
      items: [
        { id: "espacio89", title: "Arquitectura Espacio 89 (Cosmología)", path: "docs/wiki/ARQUITECTURA_ESPACIO89.md", icon: "🌌" },
        { id: "reliquias", title: "Enciclopedia de las 26 Reliquias", path: "docs/wiki/ENCICLOPEDIA_RELIQUIAS.md", icon: "🏺" },
        { id: "wiki", title: "Wiki Central de Sistemas", path: "docs/wiki/README_WIKI.md", icon: "📖" }
      ]
    },
    {
      group: "📜 Negocio, Tarifas & Contratos",
      items: [
        { id: "tarifario", title: "Tarifario de Servicios Oficial", path: "docs/contracts/Tarifario_Servicios_Detallado.md", icon: "💶" },
        { id: "nda", title: "NDA Confidencialidad E2EE", path: "docs/contracts/NDA_Mutual_Confidencialidad.md", icon: "🔒" },
        { id: "sow", title: "Plantilla Propuesta Comercial (SOW)", path: "docs/contracts/Plantilla_Propuesta_Comercial_SOW.md", icon: "📜" }
      ]
    },
    {
      group: "⚔️ Captación & Estrategia",
      items: [
        { id: "playbook", title: "Playbook de Captación Rápida", path: "docs/outreach/Playbook_Captacion_Rapida.md", icon: "⚡" },
        { id: "filtro", title: "Filtro de Clientes & Cierre 50%", path: "docs/outreach/Filtro_Clientes_y_Cierre_50.md", icon: "🎯" },
        { id: "guiones", title: "Guiones de Comunicación & Outreach", path: "docs/outreach/Guiones_Cold_Outreach.md", icon: "💬" },
        { id: "linkedin_master", title: "LinkedIn Outreach Master", path: "docs/marketing/LinkedIn_Outreach_Master.md", icon: "💼" },
        { id: "twitter_hilos", title: "Hilos Técnicos 30 Días", path: "docs/marketing/Hilos_Twitter_Virales_30_Dias.md", icon: "📡" }
      ]
    },
    {
      group: "🎨 Atlas de Estilos & Diseño",
      items: [
        { id: "atlas", title: "Atlas de Estilos Total (6 Temas)", path: "docs/ATLAS_ESTILOS_TOTAL_K4L1.md", icon: "🎨" },
        { id: "auditoria_estilos", title: "Auditoría Estética & Seinen", path: "docs/AUDITORIA_ESTETICA_Y_ESTILOS.md", icon: "📐" }
      ]
    },
    {
      group: "🛡️ Ingeniería QLLM & Guías K4L1",
      items: [
        { id: "qllm_surgery", title: "Cirugía Neural QLLM & Capa Cuántica Fock", path: "docs/QLLM_NEURAL_SURGERY_ARCHITECTURE.md", icon: "🧠" },
        { id: "api_zerocloud", title: "Protocolo Zero-Cloud Signal & PGP", path: "api/README_API.md", icon: "🔐" },
        { id: "guia_roi", title: "Guía Calculadora ROI & ROSI", path: "docs/ROI_CALCULATOR_GUIDE.md", icon: "🧮" },
        { id: "guia_security", title: "Guía Test de Hardening Linux", path: "docs/SECURITY_AUDIT_TOOL_GUIDE.md", icon: "🛡️" }
      ]
    },
    {
      group: "🏛️ Manifiesto & Perfil",
      items: [
        { id: "readme", title: "README Principal K4L1 Studio", path: "README.md", icon: "🏛️" },
        { id: "prompt_gemini", title: "Super Prompt Gemini Web (README)", path: "docs/PROMPT_GEMINI_WEB_README.md", icon: "✨" },
        { id: "perfil", title: "Perfil GitHub K4L189", path: "docs/GITHUB_PROFILE_README.md", icon: "👤" }
      ]
    }
  ];

  var docCache = {};
  var currentDocId = "espacio89";
  var activeTab = "reader"; // 'reader' | 'editor'
  var modalEl = null;

  /* -------------------------------------------------------------------------
     PARSER MARKDOWN (GFM Nativo, 60 FPS, Zero Dependencies)
     ------------------------------------------------------------------------- */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseMarkdown(md) {
    if (!md) return '';

    // Normalizar saltos de línea
    var src = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Extraer bloques de código delimitados ```lang ... ```
    var codeBlocks = [];
    src = src.replace(/```([a-zA-Z0-9_\-\+\.]*)\n([\s\S]*?)```/g, function (match, lang, code) {
      var idx = codeBlocks.length;
      codeBlocks.push({ lang: lang.trim() || 'code', code: code });
      return '@@@K4CODEBLOCK_' + idx + '@@@';
    });

    // 2. Extraer bloques de código inline `code`
    var inlineCodes = [];
    src = src.replace(/`([^`\n]+)`/g, function (match, code) {
      var idx = inlineCodes.length;
      inlineCodes.push(escapeHtml(code));
      return '@@@K4INLINECODE_' + idx + '@@@';
    });

    // 3. GitHub Callout Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
    src = src.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>[^\n]*\n?)+)/gim, function (match, type, content) {
      var alertType = type.toLowerCase();
      var cleanContent = content.replace(/^>\s?/gm, '').trim();
      var titles = {
        note: 'ℹ️ INFORMACIÓN / NOTA',
        tip: '💡 CONSEJO TÁCTICO',
        important: '⚡ IMPORTANTE',
        warning: '⚠️ ADVERTENCIA',
        caution: '🚨 ATENCIÓN / RIESGO'
      };
      return '<div class="k4-alert k4-alert-' + alertType + '">' +
             '<div class="k4-alert-title">' + titles[alertType] + '</div>' +
             '<div>' + parseInline(cleanContent) + '</div>' +
             '</div>\n';
    });

    // 4. Blockquotes estándar
    src = src.replace(/^>((?:[^\n]+\n?)+)/gm, function (match, content) {
      var clean = content.replace(/^>\s?/gm, '').trim();
      return '<blockquote>' + parseInline(clean) + '</blockquote>\n';
    });

    // 5. Encabezados (# a ######)
    src = src.replace(/^(#{1,6})\s+(.+)$/gm, function (match, hashes, text) {
      var level = hashes.length;
      var cleanText = text.trim();
      var slug = cleanText.toLowerCase().replace(/[^a-z0-9_\-]+/g, '-').replace(/^-|-$/g, '');
      return '<h' + level + ' id="' + slug + '">' + parseInline(cleanText) + '</h' + level + '>';
    });

    // 6. Reglas horizontales
    src = src.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>');

    // 7. Tablas GFM (| col1 | col2 |)
    src = src.replace(/((?:^\|[^\n]+\|\r?\n)+)/gm, function (match, tableText) {
      var lines = tableText.trim().split('\n');
      if (lines.length < 2) return tableText;

      var headerLine = lines[0];
      var sepLine = lines[1];
      if (!sepLine.includes('---')) return tableText;

      var headers = headerLine.split('|').map(function (c) { return c.trim(); }).filter(function (c, i, a) { return i > 0 && i < a.length - 1; });
      var rows = lines.slice(2).map(function (line) {
        return line.split('|').map(function (c) { return c.trim(); }).filter(function (c, i, a) { return i > 0 && i < a.length - 1; });
      });

      var html = '<div class="k4-table-wrap"><table><thead><tr>';
      headers.forEach(function (h) { html += '<th>' + parseInline(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach(function (row) {
        if (row.length === 0) return;
        html += '<tr>';
        row.forEach(function (cell) { html += '<td>' + parseInline(cell) + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    });

    // 8. Listas de tareas y listas normales
    src = src.replace(/^([ \t]*)[-\*\+]\s+\[([ xX])\]\s+(.+)$/gm, function (match, indent, checked, text) {
      var isChecked = checked.toLowerCase() === 'x' ? ' checked' : '';
      return indent + '<li class="task-list-item"><input type="checkbox" disabled' + isChecked + '> <span>' + parseInline(text) + '</span></li>';
    });

    src = src.replace(/^([ \t]*)[-\*\+]\s+(.+)$/gm, function (match, indent, text) {
      if (text.startsWith('<li class="task-list-item"')) return match;
      return indent + '<li>' + parseInline(text) + '</li>';
    });

    src = src.replace(/^([ \t]*)\d+\.\s+(.+)$/gm, function (match, indent, text) {
      return indent + '<li>' + parseInline(text) + '</li>';
    });

    // Envolver listas consecutivas en <ul> o <ol>
    src = src.replace(/((?:<li>[^\n]+<\/li>\n?)+)/g, function (match) {
      return '<ul>\n' + match + '</ul>\n';
    });

    // 9. Párrafos
    var blocks = src.split(/\n{2,}/);
    var parsedBlocks = blocks.map(function (b) {
      var trimmed = b.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|div|table|ul|ol|li|blockquote|hr)/i.test(trimmed)) {
        return trimmed;
      }
      return '<p>' + parseInline(trimmed.replace(/\n/g, '<br>')) + '</p>';
    });
    src = parsedBlocks.join('\n\n');

    // 10. Restaurar bloques de código con cabecera y botón de copia
    src = src.replace(/@@@K4CODEBLOCK_(\d+)@@@/g, function (match, idx) {
      var item = codeBlocks[parseInt(idx, 10)];
      if (!item) return '';
      var rawEsc = escapeHtml(item.code);
      return '<div class="k4-code-block-wrap">' +
             '<div class="k4-code-header">' +
             '<span class="k4-code-lang">' + item.lang + '</span>' +
             '<button class="k4-code-copy-btn" onclick="window.k4CopyCode(this)">📋 Copiar</button>' +
             '</div>' +
             '<pre><code>' + rawEsc + '</code></pre>' +
             '</div>';
    });

    // 11. Restaurar código inline
    src = src.replace(/@@@K4INLINECODE_(\d+)@@@/g, function (match, idx) {
      return '<code>' + inlineCodes[parseInt(idx, 10)] + '</code>';
    });

    return src;
  }

  function parseInline(text) {
    if (!text) return '';
    var out = text;
    // Negrita
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Cursiva
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    out = out.replace(/_(.*?)_/g, '<em>$1</em>');
    // Tachado
    out = out.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Imágenes: ![alt](url)
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:0.5rem; margin:1rem 0;">');
    // Enlaces: [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return out;
  }

  // Copia de código desde bloques fenced
  window.k4CopyCode = function (btn) {
    var pre = btn.closest('.k4-code-block-wrap').querySelector('pre code');
    if (!pre) return;
    var text = pre.innerText || pre.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = '✔ Copiado';
        setTimeout(function () { btn.textContent = '📋 Copiar'; }, 2000);
      });
    }
  };

  /* -------------------------------------------------------------------------
     MODAL HTML & INYECCIÓN EN EL DOM
     ------------------------------------------------------------------------- */
  function ensureModal() {
    if (modalEl) return modalEl;

    var el = document.createElement('div');
    el.id = 'k4-doc-modal';
    el.innerHTML =
      '<div class="k4-doc-frame" onclick="event.stopPropagation()">' +
        '<div class="k4-doc-header">' +
          '<div class="k4-doc-title-wrap">' +
            '<span class="k4-doc-glyph">☥</span>' +
            '<span id="k4-doc-current-title" class="k4-doc-title">Documento</span>' +
            '<span class="k4-doc-badge">K4L1 FORGE</span>' +
          '</div>' +
          '<div class="k4-doc-actions">' +
            '<button id="k4-tab-reader" class="k4-doc-btn active" onclick="window.switchK4DocTab(\'reader\')">📖 Lector</button>' +
            '<button id="k4-tab-editor" class="k4-doc-btn" onclick="window.switchK4DocTab(\'editor\')">✏️ Editor / Live</button>' +
            '<button id="k4-btn-copy-doc" class="k4-doc-btn" onclick="window.copyCurrentDocRaw()">📋 Copiar .md</button>' +
            '<button class="k4-doc-close" onclick="window.closeK4DocModal()" title="Cerrar (Esc)">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="k4-doc-body">' +
          '<aside class="k4-doc-sidebar" id="k4-doc-sidebar">' +
            '<div class="k4-doc-search-box">' +
              '<input type="text" id="k4-doc-search" class="k4-doc-search-input" placeholder="🔍 Filtrar documentos..." oninput="window.filterK4Docs(this.value)">' +
            '</div>' +
            '<div class="k4-doc-list" id="k4-doc-list"></div>' +
          '</aside>' +
          '<main class="k4-doc-content-pane">' +
            '<div id="k4-doc-reader-view" class="k4-doc-scroll-wrap">' +
              '<div id="k4-markdown-output" class="k4-markdown-body"></div>' +
            '</div>' +
            '<div id="k4-doc-editor-view" class="k4-doc-editor-pane" style="display:none;">' +
              '<textarea id="k4-doc-editor-input" class="k4-doc-editor-textarea" placeholder="Escribe o pega aquí tu texto en Markdown para previsualizarlo en tiempo real..."></textarea>' +
            '</div>' +
          '</main>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
    modalEl = el;

    // Cerrar al hacer clic fuera
    modalEl.addEventListener('click', function () {
      window.closeK4DocModal();
    });

    // Soporte Drag and Drop sobre el frame
    var frame = modalEl.querySelector('.k4-doc-frame');
    frame.addEventListener('dragover', function (e) {
      e.preventDefault();
      frame.style.borderColor = 'var(--accent-secondary, #c084fc)';
    });
    frame.addEventListener('dragleave', function () {
      frame.style.borderColor = '';
    });
    frame.addEventListener('drop', function (e) {
      e.preventDefault();
      frame.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function (ev) {
          window.loadCustomMarkdown(ev.target.result, file.name);
        };
        reader.readAsText(file);
      }
    });

    // Tecla Escape
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
        window.closeK4DocModal();
      }
    });

    // Evento de input en el editor en vivo
    var editor = document.getElementById('k4-doc-editor-input');
    editor.addEventListener('input', function () {
      var md = editor.value;
      var out = document.getElementById('k4-markdown-output');
      out.innerHTML = parseMarkdown(md);
    });

    renderSidebarList('');
    return modalEl;
  }

  function renderSidebarList(filterText) {
    var list = document.getElementById('k4-doc-list');
    if (!list) return;

    var q = (filterText || '').toLowerCase().trim();
    var html = '';

    DOCS_CATALOG.forEach(function (group) {
      var matchingItems = group.items.filter(function (it) {
        return !q || it.title.toLowerCase().includes(q) || it.path.toLowerCase().includes(q);
      });

      if (matchingItems.length > 0) {
        html += '<div class="k4-doc-group-title">' + group.group + '</div>';
        matchingItems.forEach(function (it) {
          var activeClass = (it.id === currentDocId) ? ' active' : '';
          html += '<button class="k4-doc-item' + activeClass + '" onclick="window.openK4L1Doc(\'' + it.id + '\')">' +
                  '<span>' + it.icon + '</span>' +
                  '<span>' + it.title + '</span>' +
                  '</button>';
        });
      }
    });

    list.innerHTML = html;
  }

  window.filterK4Docs = function (text) {
    renderSidebarList(text);
  };

  window.switchK4DocTab = function (tab) {
    activeTab = tab;
    var readerView = document.getElementById('k4-doc-reader-view');
    var editorView = document.getElementById('k4-doc-editor-view');
    var tabReader = document.getElementById('k4-tab-reader');
    var tabEditor = document.getElementById('k4-tab-editor');

    if (tab === 'editor') {
      tabReader.classList.remove('active');
      tabEditor.classList.add('active');
      readerView.style.display = 'block';
      editorView.style.display = 'flex';
      // Ajustar split
      var pane = document.querySelector('.k4-doc-content-pane');
      pane.style.display = 'grid';
      pane.style.gridTemplateColumns = '1fr 1fr';
    } else {
      tabEditor.classList.remove('active');
      tabReader.classList.add('active');
      editorView.style.display = 'none';
      readerView.style.display = 'block';
      var pane2 = document.querySelector('.k4-doc-content-pane');
      pane2.style.display = 'flex';
    }
  };

  window.copyCurrentDocRaw = function () {
    var editor = document.getElementById('k4-doc-editor-input');
    var raw = editor.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(raw).then(function () {
        var btn = document.getElementById('k4-btn-copy-doc');
        var orig = btn.innerHTML;
        btn.innerHTML = '✔ ¡Copiado!';
        setTimeout(function () { btn.innerHTML = orig; }, 2000);
      });
    }
  };

  window.loadCustomMarkdown = function (markdownText, title) {
    ensureModal();
    currentDocId = "custom";
    document.getElementById('k4-doc-current-title').textContent = title || "Documento Local";
    document.getElementById('k4-doc-editor-input').value = markdownText;
    document.getElementById('k4-markdown-output').innerHTML = parseMarkdown(markdownText);
    renderSidebarList('');
    modalEl.classList.add('active');
  };

  // Carga un documento por ID o ruta
  window.openK4L1Doc = function (docIdOrPath) {
    ensureModal();

    var targetDoc = null;
    DOCS_CATALOG.forEach(function (g) {
      g.items.forEach(function (it) {
        if (it.id === docIdOrPath || it.path === docIdOrPath) {
          targetDoc = it;
        }
      });
    });

    if (!targetDoc) {
      targetDoc = {
        id: "direct",
        title: docIdOrPath.split('/').pop(),
        path: docIdOrPath,
        icon: "📄"
      };
    }

    currentDocId = targetDoc.id;
    document.getElementById('k4-doc-current-title').textContent = targetDoc.title;
    renderSidebarList('');

    // Comprobar caché
    if (docCache[targetDoc.path]) {
      var raw = docCache[targetDoc.path];
      document.getElementById('k4-doc-editor-input').value = raw;
      document.getElementById('k4-markdown-output').innerHTML = parseMarkdown(raw);
      modalEl.classList.add('active');
      return;
    }

    // Resolver ruta relativa con respecto a la ubicación actual
    var fetchUrl = targetDoc.path;
    if (window.location.pathname.includes('/components/')) {
      fetchUrl = '../' + targetDoc.path;
    }

    document.getElementById('k4-markdown-output').innerHTML =
      '<div style="text-align:center; padding:3rem; color:#a1a1aa; font-family:monospace;">' +
      '<div style="font-size:1.5rem; margin-bottom:1rem; animation:pulse 1s infinite;">⚡</div>' +
      'Descifrando y parseando ' + escapeHtml(targetDoc.title) + ' a 189.89.619 Hz...' +
      '</div>';

    modalEl.classList.add('active');

    fetch(fetchUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (mdText) {
        docCache[targetDoc.path] = mdText;
        document.getElementById('k4-doc-editor-input').value = mdText;
        document.getElementById('k4-markdown-output').innerHTML = parseMarkdown(mdText);
      })
      .catch(function (err) {
        document.getElementById('k4-markdown-output').innerHTML =
          '<div style="padding:2rem; background:rgba(244,63,94,0.1); border:1px solid #f43f5e; border-radius:0.75rem; color:#fecdd3; font-family:monospace;">' +
          '<strong>Error cargando documento:</strong> ' + escapeHtml(err.message) + '<br>' +
          '<small>Ruta solicitada: ' + escapeHtml(fetchUrl) + '</small>' +
          '</div>';
      });
  };

  window.closeK4DocModal = function () {
    if (modalEl) modalEl.classList.remove('active');
  };

  window.toggleK4L1DocModal = function () {
    if (modalEl && modalEl.classList.contains('active')) {
      window.closeK4DocModal();
    } else {
      window.openK4L1Doc('espacio89');
    }
  };

  // Exponer motor de parseo markdown directo
  window.renderK4L1Markdown = parseMarkdown;

  // Integración en DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    // Escuchar atajo Ctrl+M o Cmd+M para abrir la Wiki
    window.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        window.toggleK4L1DocModal();
      }
    });
  });

})(window, document);
