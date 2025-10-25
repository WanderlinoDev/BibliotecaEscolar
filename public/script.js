/* =============================
   Funções utilitárias
============================= */
const loadData = (k) => JSON.parse(localStorage.getItem(k)) || [];
const saveData = (k, v) => localStorage.setItem(k, JSON.stringify(v));

async function tryFetch(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Erro ao buscar ${url}`);
    return await res.json();
  } catch {
    return null;
  }
}

/* =============================
   Menu Hambúrguer
============================= */
function toggleMenu() {
  const nav = document.getElementById("main-nav");
  const hamburgerBtn = document.querySelector(".hamburger");
  if (!nav || !hamburgerBtn) return;
  nav.classList.toggle("open");
  hamburgerBtn.classList.toggle("open");
}

/* =============================
   Carregamento dinâmico de páginas
============================= */
async function loadPage(pageUrl, buttonElement, renderFunctionName) {
  try {
    if (!pageUrl.startsWith("/")) pageUrl = "/" + pageUrl;

    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Erro ao carregar ${pageUrl}`);

    const html = await response.text();
    document.getElementById("content-area").innerHTML = html;

    // Destaque no menu
    document.querySelectorAll("#main-nav button").forEach((btn) => btn.classList.remove("active"));
    if (buttonElement) buttonElement.classList.add("active");

    // Fecha o menu após clicar
    if (window.innerWidth <= 768) {
      const nav = document.getElementById("main-nav");
      if (nav && nav.classList.contains("open")) toggleMenu();
    }

    attachEventListeners(pageUrl);

    if (renderFunctionName && window[`${renderFunctionName}Local`]) {
      window[`${renderFunctionName}Local`]();
    }
  } catch (err) {
    console.error("❌ Erro ao carregar página:", err);
    document.getElementById("content-area").innerHTML =
      `<p style="color:red">${err.message}</p>`;
  }
}

/* =============================
   Validação de CPF
============================= */
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
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

/* =============================
   Cadastrar Usuário
============================= */
async function handleCadastrarUsuario(e) {
  e.preventDefault();
  const form = e.target;
  const usuario = {
    matricula: form.elements["usuario-matricula"].value,
    nome: form.elements["usuario-nome"].value,
    cpf: form.elements["usuario-cpf"].value,
    email: form.elements["usuario-email"].value,
    telefone: form.elements["usuario-telefone"].value,
    tipo: form.elements["usuario-tipo"].value,
  };

  if (!validarCPF(usuario.cpf)) {
    alert("CPF inválido!");
    return;
  }

  const result = await tryFetch("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });

  if (result) {
    alert("Usuário cadastrado com sucesso!");
    form.reset();
  } else {
    const usuarios = loadData("usuarios");
    usuarios.push({ ...usuario, id_usuario: "Local-" + Date.now() });
    saveData("usuarios", usuarios);
    form.reset();
  }
}

/* =============================
   Buscar Usuário (matrícula, nome ou CPF)
============================= */
function buscarUsuario() {
  const matriculaInput = document.getElementById("usuario-matricula");
  const nomeInput = document.getElementById("usuario-nome");
  const cpfInput = document.getElementById("usuario-cpf");

  const matricula = matriculaInput.value.trim();
  const nome = nomeInput.value.trim().toLowerCase();
  const cpf = cpfInput.value.trim().replace(/\D/g, "");

  const usuarios = loadData("usuarios");
  const usuario = usuarios.find(
    (u) =>
      u.matricula === matricula ||
      u.nome.toLowerCase() === nome ||
      u.cpf.replace(/\D/g, "") === cpf
  );

  if (usuario) {
    matriculaInput.value = usuario.matricula;
    nomeInput.value = usuario.nome;
    cpfInput.value = usuario.cpf;
    document.getElementById("usuario-email").value = usuario.email || "";
    document.getElementById("usuario-telefone").value = usuario.telefone || "";
    document.getElementById("usuario-tipo").value = usuario.tipo || "";
    alert("Usuário encontrado!");
  }
}

/* =============================
   Eventos por página
============================= */
function attachEventListeners(pageUrl) {
  if (pageUrl.includes("CadastroUsuario")) {
    const form = document.getElementById("form-usuario");
    if (form) form.addEventListener("submit", handleCadastrarUsuario);

    ["usuario-matricula", "usuario-nome", "usuario-cpf"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("keyup", (e) => e.key === "Enter" && buscarUsuario());
        el.addEventListener("blur", buscarUsuario);
      }
    });
  }

  if (pageUrl.includes("CadastroLivro")) {
    const form = document.getElementById("form-livro");
    if (form)
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Cadastro de livro salvo localmente!");
      });
  }
}

/* =============================
   Inicialização
============================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Aplicação carregada!");
});
