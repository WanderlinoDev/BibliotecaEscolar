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
