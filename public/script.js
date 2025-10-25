// ============================================================
// script.js — Lado do cliente (Frontend da Biblioteca Escolar)
// (FINAL - CORREÇÃO DE PATHS E CHAMADAS)
// ============================================================

// URL base das rotas do backend
const BASE_API_URL = '/api';

// ============================================================
// 🔹 UTILITÁRIOS GERAIS
// ============================================================

/**
 * Exibe mensagens na tela com estilos visuais.
 */
function showMessage(message, type = 'info') {
  const box = document.createElement('div');
  box.className = `msg-box ${type}`;
  box.textContent = message;

  document.body.appendChild(box);
  setTimeout(() => box.classList.add('show'), 50);

  setTimeout(() => {
    box.classList.remove('show');
    setTimeout(() => box.remove(), 500);
  }, 4000);
}

/**
 * Função genérica para chamadas à API com tratamento de erro.
 */
async function tryFetch(url, opts = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };

  if (opts.body && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
  }

  try {
    const res = await fetch(url, { ...opts, headers: { ...defaultHeaders, ...opts.headers } });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Erro HTTP ${res.status}` }));
      throw new Error(err.error || `Erro ${res.status}`);
    }

    // Tenta retornar o JSON, ou null se a resposta for vazia (ex: PUT/DELETE sem corpo)
    return res.status === 204 ? null : await res.json().catch(() => ({ message: 'Ação concluída.' }));
  } catch (e) {
    console.error('❌ Erro na requisição:', e.message);
    showMessage(e.message, 'error');
    return null;
  }
}

// ============================================================
// 🔹 VALIDAÇÃO E MÁSCARA DE CPF E TELEFONE
// ============================================================

function formatarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length > 11) cpf = cpf.substring(0, 11);
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

function formatarTelefone(telefone) {
    let value = telefone.replace(/\D/g, '');
    let maskedValue = '';

    if (value.length > 0) maskedValue += '(' + value.substring(0, 2);
    if (value.length > 2) {
        if (value.length > 10) { // Celular 9 dígitos
            maskedValue += ') ' + value.substring(2, 7);
            if (value.length > 7) maskedValue += '-' + value.substring(7, 11);
        } else { // Fixo 8 dígitos
            maskedValue += ') ' + value.substring(2, 6);
            if (value.length > 6) maskedValue += '-' + value.substring(6, 10);
        }
    }
    return maskedValue;
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

document.addEventListener('input', (e) => {
  if (e.target.id === 'usuario-cpf') {
    const input = e.target;
    input.value = formatarCPF(input.value);
  }
  if (e.target.id === 'usuario-telefone') {
    const input = e.target;
    input.value = formatarTelefone(input.value);
  }
});

document.addEventListener('blur', (e) => {
  if (e.target.id === 'usuario-cpf') {
    const cpfMsg = document.getElementById('cpf-msg');
    const cpf = e.target.value;
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length === 11 && !validarCPF(cpfLimpo)) {
      cpfMsg.textContent = '❌ CPF inválido!';
      e.target.setCustomValidity('CPF inválido');
    } else {
      cpfMsg.textContent = '';
      e.target.setCustomValidity('');
    }
  }
}, true);

// ============================================================
// 🔹 BUSCA DE ISBN NA OPEN LIBRARY
// ============================================================

async function buscarISBN() {
  const isbnInput = document.getElementById('livro-isbn');
  const isbn = isbnInput.value.replace(/[-\s]/g, '');
  const msg = document.getElementById('isbn-msg');

  if (!isbn) return;

  msg.textContent = '🔎 Buscando informações...';
  msg.style.color = '#007bff';

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(url);
    const data = await res.json();

    const info = data[`ISBN:${isbn}`];

    if (info) {
      document.getElementById('livro-nome').value = info.title || '';
      document.getElementById('livro-autor').value = info.authors?.[0]?.name || '';
      document.getElementById('livro-editora').value = info.publishers?.[0]?.name || '';
      document.getElementById('livro-ano').value = info.publish_date ? info.publish_date.substring(0, 4) : ''; 
      
      msg.textContent = '✅ Dados encontrados!';
      msg.style.color = 'green';
    } else {
      msg.textContent = '⚠️ Nenhum dado encontrado para este ISBN.';
      msg.style.color = 'orange';
    }
  } catch (err) {
    console.error(err);
    msg.textContent = '❌ Erro ao buscar informações.';
    msg.style.color = 'red';
  }
}

// ============================================================
// 🔹 CADASTRO DE USUÁRIOS
// ============================================================

async function handleCadastrarUsuario(e) {
  e.preventDefault();
  
  const cpfMascara = document.getElementById('usuario-cpf').value;
  const cpfLimpo = cpfMascara.replace(/\D/g, '');

  if (!validarCPF(cpfLimpo)) {
    showMessage('CPF inválido!', 'error');
    return;
  }
  // Garante que o frontend envia apenas os números
  const telefoneLimpo = document.getElementById('usuario-telefone').value.replace(/\D/g, ''); 

  const newUsuario = {
    matricula: document.getElementById('usuario-matricula').value, 
    nome: document.getElementById('usuario-nome').value, 
    cpf: cpfLimpo, // Envia limpo
    email: document.getElementById('usuario-email').value, 
    telefone: telefoneLimpo // Envia limpo
  };
  
  // Chamada correta: /api/usuarios
  const result = await tryFetch(`${BASE_API_URL}/usuarios`, { method: 'POST', body: newUsuario });

  if (result) {
    showMessage('Usuário cadastrado com sucesso!', 'success');
    e.target.reset();
    document.getElementById('cpf-msg').textContent = ''; 
    renderUsuarios();
  }
}

// ============================================================
// 🔹 CADASTRO DE LIVROS
// ============================================================

async function handleCadastrarLivro(e) {
  e.preventDefault();

  const titulo = document.getElementById('livro-nome').value;
  const autor = document.getElementById('livro-autor').value;
  const genero = document.getElementById('livro-genero').value;
  const editora = document.getElementById('livro-editora').value;
  const edicao = document.getElementById('livro-edicao').value;
  const ano_publicacao = document.getElementById('livro-ano').value;
  // Envia limpo
  const isbn = document.getElementById('livro-isbn').value.replace(/[-\s]/g, ''); 
  // Envia limpo
  const cod_barras = document.getElementById('livro-codbarras').value.replace(/\D/g, '');

  if (!titulo || !autor || !isbn) {
    showMessage('Preencha os campos obrigatórios!', 'error');
    return;
  }

  const newLivro = { titulo, autor, genero, editora, edicao, ano_publicacao, isbn, cod_barras };
  const result = await tryFetch(`${BASE_API_URL}/livros`, { method: 'POST', body: newLivro });

  if (result) {
    showMessage(`Livro "${titulo}" cadastrado com sucesso!`, 'success');
    e.target.reset();
    renderLivros();
  }
}

// ============================================================
// 🔹 MOVIMENTAÇÕES
// ============================================================

async function handleRegistrarMovimentacao(e) {
  e.preventDefault();

  const matricula = document.getElementById('emprestimo-usuario-matricula').value.trim();
  const livroId = document.getElementById('emprestimo-livro-id').value.trim();
  const observacao = document.getElementById('emprestimo-observacao').value;

  if (!matricula || !livroId) {
    showMessage('Informe matrícula e ID do livro!', 'error');
    return;
  }
  
  // 1. Busca o usuário para obter o ID
  const usuario = await tryFetch(`${BASE_API_URL}/usuarios/matricula/${matricula}`);
  if (!usuario || !usuario.id_usuario) {
    showMessage('Usuário não encontrado.', 'error');
    return;
  }

  const newMov = {
    id_usuario: usuario.id_usuario,
    id_livro: parseInt(livroId),
    tipo: 'Empréstimo',
    observacao,
  };

  const result = await tryFetch(`${BASE_API_URL}/movimentacoes`, { method: 'POST', body: newMov });

  if (result) {
    showMessage('Movimentação registrada com sucesso!', 'success');
    e.target.reset();
    renderMovimentacoes();
    renderLivros(); // Atualiza a tabela de livros para refletir o novo status
  }
}

// ============================================================
// 🔹 RENDERIZAÇÕES (Tabelas)
// ============================================================

async function renderUsuarios() {
  const data = await tryFetch(`${BASE_API_URL}/usuarios`);
  const tbody = document.querySelector('#tabela-usuarios tbody');
  if (!tbody || !data) return;

  tbody.innerHTML = '';
  data.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id_usuario}</td>
      <td>${u.matricula}</td>
      <td>${u.nome}</td>
      <td>${formatarCPF(u.cpf)}</td>
      <td>${u.email}</td>
      <td>${formatarTelefone(u.telefone)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function renderLivros() {
  const data = await tryFetch(`${BASE_API_URL}/livros`);
  const tbody = document.querySelector('#tabela-livros tbody');
  if (!tbody || !data) return;

  tbody.innerHTML = '';
  data.forEach(l => {
    const statusColor = l.status === 'Disponível' ? '#28a745' : '#dc3545';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.id_livro}</td>
      <td>${l.titulo}</td>
      <td>${l.autor}</td>
      <td>${l.genero || '-'}</td>
      <td>${l.editora || '-'}</td>
      <td style="font-weight:bold;color:${statusColor};">${l.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function renderMovimentacoes() {
  const data = await tryFetch(`${BASE_API_URL}/movimentacoes`);
  const tbody = document.querySelector('#tabela-movimentacoes tbody');
  if (!tbody || !data) return;

  tbody.innerHTML = '';
  data.forEach(m => {
    const tr = document.createElement('tr');
    const devolvido = m.data_devolucao ? '✅' : '🔴';
    const dataDevolucaoTexto = m.data_devolucao ? new Date(m.data_devolucao).toLocaleString('pt-BR') : 'Pendente';
    
    tr.innerHTML = `
      <td>${m.id_movimentacao}</td>
      <td>${m.livro_titulo}</td>
      <td>${m.usuario_nome}</td>
      <td>${m.tipo} ${devolvido}</td>
      <td>${new Date(m.data_movimento).toLocaleString('pt-BR')}</td>
      <td>${dataDevolucaoTexto}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================
// 🔹 NAVEGAÇÃO E MENU HAMBÚRGUER
// ============================================================

let currentButton = null;

/**
 * Carrega a página parcial e atualiza o menu.
 * @param {string} url O caminho da página parcial (Ex: 'pages/CadastroUsuario.html')
 * @param {HTMLElement} btn O botão que foi clicado.
 * @param {string} renderFn Nome da função de renderização da tabela.
 */
async function loadPage(url, btn, renderFn) {
  const main = document.getElementById('content-area');
  if (!main) return;

  // URL CORRIGIDA: Usa o path direto, sem o prefixo 'public/'
  const res = await fetch(url); 
  const html = await res.text();
  main.innerHTML = html;

  if (currentButton) currentButton.classList.remove('active');
  btn?.classList.add('active');
  currentButton = btn;

  attachEventListeners(url);
  if (renderFn && typeof window[renderFn] === 'function') window[renderFn]();
}

function attachEventListeners(page) {
  if (page.includes('Usuario')) {
    document.getElementById('form-usuario')?.addEventListener('submit', handleCadastrarUsuario);
  } else if (page.includes('Livro')) {
    document.getElementById('form-livro')?.addEventListener('submit', handleCadastrarLivro);
    document.getElementById('livro-isbn')?.addEventListener('blur', buscarISBN);
  } else if (page.includes('Movimentacao')) {
    document.getElementById('form-emprestimo')?.addEventListener('submit', handleRegistrarMovimentacao);
  }
}

function toggleMenu() {
  document.getElementById('main-nav').classList.toggle('hidden');
}

// ============================================================
// 🔹 INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const firstBtn = document.querySelector('#main-nav button');
  
  // Simulação de um clique no primeiro botão para carregar a página inicial
  if (firstBtn) {
    const onclickAttr = firstBtn.getAttribute('onclick');
    // Regex para extrair a URL e o renderFn
    const match = onclickAttr.match(/loadPage\('(.*?)', this, '(.*?)'\)/); 

    if (match && match[1] && match[2]) {
      const page = match[1]; // Ex: 'pages/CadastroUsuario.html'
      const renderFn = match[2];
      loadPage(page, firstBtn, renderFn);
    } else {
      console.warn("Padrão de onclick não encontrado. Carregando CadastroUsuario por padrão.");
      // Fallback seguro (URLs sem /public/)
      loadPage('pages/CadastroUsuario.html', firstBtn, 'renderUsuarios');
    }
  }
});