// ============================================================
// 📘 Biblioteca Escolar - Frontend Script
// ============================================================

const BASE_API_URL = 'http://localhost:3000/api';

// ============================================================
// 🔹 Funções utilitárias
// ============================================================

// Exibe mensagens padronizadas na tela
function showMessage(message, type = 'info') {
  const box = document.createElement('div');
  box.className = `msg-box ${type}`;
  box.textContent = message;
  document.body.appendChild(box);

  setTimeout(() => box.classList.add('show'), 50);
  setTimeout(() => {
    box.classList.remove('show');
    setTimeout(() => box.remove(), 500);
  }, 3500);
}

// Fetch com tratamento de erro
async function tryFetch(url, opts = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);

  try {
    const res = await fetch(url, { ...opts, headers: { ...defaultHeaders, ...(opts.headers || {}) } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Erro HTTP ${res.status}` }));
      throw new Error(err.error || `Erro ${res.status}`);
    }
    return res.status === 204 ? null : await res.json().catch(() => ({}));
  } catch (e) {
    console.error('❌ Erro na requisição:', e.message);
    showMessage(e.message, 'error');
    return null;
  }
}

// ============================================================
// 🔹 Máscara e Validação de CPF
// ============================================================

function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length > 11) cpf = cpf.substring(0, 11);
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(cpf[10]);
}

// Aplica máscaras dinamicamente
document.addEventListener('input', (e) => {
  if (e.target.id === 'usuario-cpf') e.target.value = formatarCPF(e.target.value);
});

// Exibe erro de CPF inválido
document.addEventListener('blur', (e) => {
  if (e.target.id === 'usuario-cpf') {
    const msg = document.getElementById('cpf-msg');
    const cpfLimpo = e.target.value.replace(/\D/g, '');
    if (cpfLimpo.length === 11 && !validarCPF(cpfLimpo)) {
      msg.textContent = '❌ CPF inválido!';
      e.target.setCustomValidity('CPF inválido');
    } else {
      msg.textContent = '';
      e.target.setCustomValidity('');
    }
  }
}, true);

// ============================================================
// 🔹 Navegação e Menu (ATUALIZADO)
// ============================================================

let currentButton = null;

// Alterna visibilidade do menu
function toggleMenu() {
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('hidden');
}

// Nova função: ao clicar em uma opção, carrega a página e fecha o menu
async function navigate(page, btn, renderFn) {
  await loadPage(page, btn, renderFn);

  const nav = document.getElementById('main-nav');
  if (nav && !nav.classList.contains('hidden')) {
    nav.classList.add('hidden');
  }
}

// Carrega uma página dentro do <main>
async function loadPage(url, btn, renderFn) {
  const main = document.getElementById('content-area');
  if (!main) return;

  const res = await fetch(url);
  if (!res.ok) {
    showMessage('Erro ao carregar página: ' + res.status, 'error');
    return;
  }

  main.innerHTML = await res.text();
  if (currentButton) currentButton.classList.remove('active');
  if (btn) btn.classList.add('active');
  currentButton = btn;

  attachEventListeners(url);
  if (renderFn && typeof window[renderFn] === 'function') window[renderFn]();
}

// Carrega automaticamente a primeira página
document.addEventListener('DOMContentLoaded', () => {
  const firstBtn = document.querySelector('#main-nav button');
  if (firstBtn) {
    const match = firstBtn.getAttribute('onclick')?.match(/loadPage\('(.*?)', this, '(.*?)'\)/);
    if (match && match[1] && match[2]) {
      loadPage(match[1], firstBtn, match[2]);
    } else {
      loadPage('pages/CadastroUsuario.html', firstBtn, 'renderUsuarios');
    }
  }
});

// ============================================================
// 🔹 CRUD de Usuários
// ============================================================

// Cadastrar / Atualizar
async function handleSalvarUsuario(e) {
  e.preventDefault();
  const id = document.getElementById('usuario-id')?.value;
  const cpf = document.getElementById('usuario-cpf').value.replace(/\D/g, '');

  if (!validarCPF(cpf)) return showMessage('CPF inválido!', 'error');

  const usuario = {
    matricula: document.getElementById('usuario-matricula').value,
    nome: document.getElementById('usuario-nome').value,
    cpf,
    email: document.getElementById('usuario-email').value,
    telefone: document.getElementById('usuario-telefone').value.replace(/\D/g, '')
  };

  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `${BASE_API_URL}/usuarios/${id}` : `${BASE_API_URL}/usuarios`;

  const result = await tryFetch(endpoint, { method, body: usuario });
  if (result) {
    showMessage(id ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado!', 'success');
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
  }
}

// Excluir
async function handleExcluirUsuario() {
  const id = document.getElementById('usuario-id').value;
  if (!id) return showMessage('Selecione um usuário antes de excluir.', 'error');
  if (!confirm('Deseja realmente excluir este usuário?')) return;

  const result = await tryFetch(`${BASE_API_URL}/usuarios/${id}`, { method: 'DELETE' });
  if (result) {
    showMessage('Usuário excluído com sucesso!', 'success');
    document.getElementById('form-usuario').reset();
  }
}

// ============================================================
// 🔍 Pesquisas com Lupa
// ============================================================

async function buscarUsuario(campo, valor) {
  if (!valor.trim()) return showMessage('Digite algo para pesquisar.', 'info');
  const query = new URLSearchParams();
  query.append(campo, valor.trim());

  const data = await tryFetch(`${BASE_API_URL}/usuarios/search?${query.toString()}`);
  if (data && data.length > 0) {
    const u = data[0];
    document.getElementById('usuario-id').value = u.id_usuario;
    document.getElementById('usuario-matricula').value = u.matricula;
    document.getElementById('usuario-nome').value = u.nome;
    document.getElementById('usuario-cpf').value = formatarCPF(u.cpf);
    document.getElementById('usuario-email').value = u.email;
    document.getElementById('usuario-telefone').value = u.telefone;
    showMessage('Usuário encontrado e carregado.', 'success');
  } else {
    showMessage('Usuário não encontrado.', 'info');
  }
}

async function handlePesquisarUsuarios() {
  const matricula = document.getElementById('pesquisa-matricula')?.value.trim();
  const nome = document.getElementById('pesquisa-nome')?.value.trim();
  const cpf = document.getElementById('pesquisa-cpf')?.value.trim();

  const query = new URLSearchParams();
  if (matricula) query.append('matricula', matricula);
  if (nome) query.append('nome', nome);
  if (cpf) query.append('cpf', cpf.replace(/\D/g, ''));

  const data = await tryFetch(`${BASE_API_URL}/usuarios/search?${query.toString()}`);

  if (data && data.length > 0) {
    const u = data[0];
    document.getElementById('usuario-id').value = u.id_usuario;
    document.getElementById('usuario-matricula').value = u.matricula;
    document.getElementById('usuario-nome').value = u.nome;
    document.getElementById('usuario-cpf').value = formatarCPF(u.cpf);
    document.getElementById('usuario-email').value = u.email;
    document.getElementById('usuario-telefone').value = formatarTelefone(u.telefone);
    showMessage('Usuário encontrado!', 'success');
  } else {
    showMessage('Nenhum usuário encontrado.', 'info');
  }
}

// ============================================================
// 🔹 Associações de eventos
// ============================================================

function attachEventListeners(page) {
  if (page.includes('Usuario')) {
    document.getElementById('form-usuario')?.addEventListener('submit', handleSalvarUsuario);
    document.getElementById('btn-excluir')?.addEventListener('click', handleExcluirUsuario);
    document.getElementById('btn-limpar')?.addEventListener('click', () => {
      document.getElementById('form-usuario').reset();
      document.getElementById('usuario-id').value = '';
      showMessage('Formulário limpo.', 'info');
    });

    // LUPAS 🔍
    document.getElementById('btn-pesq-matricula')?.addEventListener('click', () => {
      buscarUsuario('matricula', document.getElementById('usuario-matricula').value);
    });
    document.getElementById('btn-pesq-nome')?.addEventListener('click', () => {
      buscarUsuario('nome', document.getElementById('usuario-nome').value);
    });
    document.getElementById('btn-pesq-cpf')?.addEventListener('click', () => {
      buscarUsuario('cpf', document.getElementById('usuario-cpf').value.replace(/\D/g, ''));
    });
  }
}
// ============================================================
// 🔹 Controle do Menu Hambúrguer
// ============================================================

function toggleMenu() {
  const nav = document.getElementById('main-nav');
  const bg = document.querySelector('.background');

  if (nav) nav.classList.toggle('hidden');
  if (bg) bg.classList.toggle('active'); // alterna o X vermelho
}

// Fecha automaticamente o menu ao escolher uma opção
async function navigate(page, btn, renderFn) {
  await loadPage(page, btn, renderFn);

  const nav = document.getElementById('main-nav');
  const bg = document.querySelector('.background');

  if (nav && !nav.classList.contains('hidden')) {
    nav.classList.add('hidden');
    if (bg) bg.classList.remove('active'); // volta ao ícone azul
  }
}


// ====================== FUNÇÕES DE LIVROS ====================== //

// Preenche campos do formulário de livro
function preencherCamposLivro(livro) {
  document.getElementById('livro-id').value = livro.id_livro || '';
  document.getElementById('livro-isbn').value = livro.isbn || '';
  document.getElementById('livro-titulo').value = livro.titulo || '';
  document.getElementById('livro-subtitulo').value = livro.subtitulo || '';
  document.getElementById('livro-autor').value = livro.autor || '';
  document.getElementById('livro-genero').value = livro.genero || '';
  document.getElementById('livro-editora').value = livro.editora || '';
  document.getElementById('livro-edicao').value = livro.edicao || '';
  document.getElementById('livro-ano').value = livro.ano_publicacao || '';
  document.getElementById('livro-descricao').value = livro.descricao || '';
}

// Busca livro por ISBN: primeiro no banco, depois no Google Books
async function buscarLivroPorISBN() {
  const isbnEl = document.getElementById('livro-isbn');
  const isbn = isbnEl?.value?.trim();
  if (!isbn) return showMessage('Digite um ISBN para pesquisar.', 'info');

  // 1) busca no banco
  const data = await tryFetch(`${BASE_API_URL}/livros/search?isbn=${encodeURIComponent(isbn)}`);
  if (data && data.length > 0) {
    preencherCamposLivro(data[0]);
    showMessage('📘 Livro encontrado no sistema.', 'success');
    return;
  }

  // 2) busca no Google Books
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro na requisição: ' + res.status);
    const json = await res.json();
    if (json.totalItems > 0) {
      const book = json.items[0].volumeInfo;
      const livro = {
        isbn,
        titulo: book.title || '',
        subtitulo: book.subtitle || '',
        autor: book.authors ? book.authors.join(', ') : '',
        genero: book.categories ? book.categories.join(', ') : '',
        editora: book.publisher || '',
        edicao: book?.industryIdentifiers ? (book.industryIdentifiers[0]?.type || '') : '',
        ano_publicacao: book.publishedDate ? String(book.publishedDate).substring(0,4) : '',
        descricao: book.description || ''
      };
      preencherCamposLivro(livro);
      showMessage('📗 Dados importados do Google Books. Grave o livro para salvar no sistema.', 'info');
    } else {
      showMessage('⚠️ Nenhum livro encontrado para este ISBN.', 'info');
    }
  } catch (error) {
    console.error('❌ Erro ao consultar Google Books:', error);
    showMessage('Erro ao consultar Google Books.', 'error');
  }
}

// Salvar (inserir ou atualizar) livro
async function handleSalvarLivro(e) {
  e.preventDefault();
  const id = document.getElementById('livro-id')?.value;
  const livro = {
    isbn: document.getElementById('livro-isbn').value.trim(),
    titulo: document.getElementById('livro-titulo').value.trim(),
    subtitulo: document.getElementById('livro-subtitulo').value.trim(),
    autor: document.getElementById('livro-autor').value.trim(),
    genero: document.getElementById('livro-genero').value.trim(),
    editora: document.getElementById('livro-editora').value.trim(),
    edicao: document.getElementById('livro-edicao').value.trim(),
    ano_publicacao: document.getElementById('livro-ano').value.trim(),
    descricao: document.getElementById('livro-descricao').value.trim()
  };

  if (!livro.titulo) return showMessage('O título é obrigatório.', 'error');

  try {
    if (id) {
      const result = await tryFetch(`${BASE_API_URL}/livros/${id}`, { method: 'PUT', body: livro });
      if (result) showMessage('Livro atualizado com sucesso!', 'success');
    } else {
      const result = await tryFetch(`${BASE_API_URL}/livros`, { method: 'POST', body: livro });
      if (result) {
        showMessage('Livro cadastrado com sucesso!', 'success');
        document.getElementById('form-livro').reset();
      }
    }
  } catch (err) {
    console.error('Erro ao salvar livro:', err);
    showMessage('Erro ao salvar livro.', 'error');
  }
}

// Excluir livro
async function handleExcluirLivro() {
  const id = document.getElementById('livro-id').value;
  if (!id) return showMessage('Selecione um livro antes de excluir.', 'error');
  if (!confirm('Deseja realmente excluir este livro?')) return;

  const result = await tryFetch(`${BASE_API_URL}/livros/${id}`, { method: 'DELETE' });
  if (result) {
    showMessage('Livro excluído com sucesso!', 'success');
    document.getElementById('form-livro').reset();
    document.getElementById('livro-id').value = '';
  }
}

// Pesquisar por título (lupa)
async function buscarLivroPorTitulo() {
  const titulo = document.getElementById('livro-titulo').value.trim();
  if (!titulo) return showMessage('Digite o título para pesquisar.', 'info');

  const data = await tryFetch(`${BASE_API_URL}/livros/search?titulo=${encodeURIComponent(titulo)}`);
  if (data && data.length > 0) {
    preencherCamposLivro(data[0]);
    showMessage('📘 Livro encontrado no sistema.', 'success');
  } else {
    showMessage('Nenhum livro encontrado com esse título.', 'info');
  }
}

// Quando o conteúdo do main muda, tenta vincular listeners do livro
(function initLivroAutoBinder(){
  const target = document.getElementById('content-area');
  if (!target) return;
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          if (node.querySelector && node.querySelector('#form-livro')) {
            // attach listeners
            document.getElementById('form-livro')?.addEventListener('submit', handleSalvarLivro);
            document.getElementById('btn-excluir-livro')?.addEventListener('click', handleExcluirLivro);
            document.getElementById('btn-limpar-livro')?.addEventListener('click', () => {
              document.getElementById('form-livro').reset();
              document.getElementById('livro-id').value = '';
              showMessage('Formulário limpo.', 'info');
            });
            document.getElementById('btn-pesq-isbn')?.addEventListener('click', buscarLivroPorISBN);
            document.getElementById('btn-pesq-titulo')?.addEventListener('click', buscarLivroPorTitulo);
          }
        }
      }
    }
  });
  obs.observe(target, { childList: true, subtree: true });
})();
