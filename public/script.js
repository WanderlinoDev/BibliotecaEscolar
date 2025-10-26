const BASE_API_URL = "http://localhost:3000/api";

// Cadastrar usuário
document.getElementById("form-usuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = {
    matricula: document.getElementById("usuario-matricula").value.trim(),
    nome: document.getElementById("usuario-nome").value.trim(),
    cpf: document.getElementById("usuario-cpf").value.trim(),
    email: document.getElementById("usuario-email").value.trim(),
    telefone: document.getElementById("usuario-telefone").value.trim(),
    tipo: document.getElementById("usuario-tipo").value
  };

  if (!usuario.matricula || !usuario.nome || !usuario.cpf || !usuario.tipo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const response = await fetch(`${BASE_API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuario),
    });

    const data = await response.json();
    if (!response.ok) {
      alert(`Erro ao cadastrar: ${data.error || "Erro desconhecido"}`);
      return;
    }

    alert("✅ Usuário cadastrado com sucesso!");
    document.getElementById("form-usuario").reset();
  } catch (err) {
    console.error("❌ Erro ao conectar:", err);
    alert("Erro ao conectar ao servidor.");
  }
});

// Pesquisa automática
document.querySelectorAll("#usuario-matricula, #usuario-nome, #usuario-cpf")
  .forEach(input => input.addEventListener("blur", buscarUsuario));

async function buscarUsuario() {
  const matricula = document.getElementById("usuario-matricula").value.trim();
  const nome = document.getElementById("usuario-nome").value.trim();
  const cpf = document.getElementById("usuario-cpf").value.trim();

  if (!matricula && !nome && !cpf) return;

  try {
    const params = new URLSearchParams();
    if (matricula) params.append("matricula", matricula);
    if (nome) params.append("nome", nome);
    if (cpf) params.append("cpf", cpf);

    const response = await fetch(`${BASE_API_URL}/usuarios/search?${params}`);
    const data = await response.json();

    if (data.length > 0) {
      const user = data[0];
      document.getElementById("usuario-matricula").value = user.matricula || "";
      document.getElementById("usuario-nome").value = user.nome || "";
      document.getElementById("usuario-cpf").value = user.cpf || "";
      document.getElementById("usuario-email").value = user.email || "";
      document.getElementById("usuario-telefone").value = user.telefone || "";
      if (user.tipo) document.getElementById("usuario-tipo").value = user.tipo;
      alert(`Usuário encontrado: ${user.nome}`);
    }
  } catch (err) {
    console.error("❌ Erro ao buscar usuário:", err);
  }
}
// Exibir notificação suave
function mostrarNotificacao(mensagem, cor = "#0B2447") {
  const box = document.getElementById("notificacao");
  box.textContent = mensagem;
  box.style.backgroundColor = cor;
  box.style.opacity = "1";
  setTimeout(() => (box.style.opacity = "0"), 3000);
}

// Limpar formulário
function limparFormulario() {
  document.getElementById("form-usuario").reset();
  mostrarNotificacao("🧹 Formulário limpo");
}

// Excluir usuário
async function excluirUsuario() {
  const matricula = document.getElementById("usuario-matricula").value.trim();
  if (!matricula) {
    mostrarNotificacao("Informe a matrícula para excluir.", "#b30000");
    return;
  }

  if (!confirm("Deseja realmente excluir este usuário?")) return;

  try {
    const response = await fetch(`${BASE_API_URL}/usuarios/search?matricula=${matricula}`);
    const data = await response.json();

    if (data.length === 0) {
      mostrarNotificacao("Usuário não encontrado.", "#b30000");
      return;
    }

    const id = data[0].id_usuario;
    await fetch(`${BASE_API_URL}/usuarios/${id}`, { method: "DELETE" });
    limparFormulario();
    mostrarNotificacao("✅ Usuário excluído com sucesso!", "green");
  } catch (err) {
    console.error(err);
    mostrarNotificacao("Erro ao excluir usuário.", "#b30000");
  }
}
