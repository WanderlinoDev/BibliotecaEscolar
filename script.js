// --- Funções de Utilidade e Persistência (localStorage) ---
const loadData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Carrega os dados salvos ou inicializa arrays vazios
let livros = loadData('livros');
let usuarios = loadData('usuarios');
let emprestimos = loadData('emprestimos');

// --- 1. Controle do Menu e Navegação ---

function toggleMenu() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    // Altera a visibilidade do menu e o ícone
    nav.classList.toggle('hidden');
    hamburger.classList.toggle('open');
}

/**
 * Carrega o conteúdo de um arquivo HTML na área principal (main), 
 * define o botão ativo e recolhe o menu.
 */
async function loadPage(pageUrl, element, renderFunctionName) {
    // 1. GARANTE QUE O MENU É FECHADO APÓS CLICAR
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    // Se o menu estiver visível (não tem a classe 'hidden'), fecha-o.
    if (!nav.classList.contains('hidden')) {
        nav.classList.add('hidden');
        hamburger.classList.remove('open');
    }
    
    // 2. Define o botão ativo (Visual)
    document.querySelectorAll('nav button').forEach(button => {
        button.classList.remove('active');
    });
    element.classList.add('active');
    
    const contentArea = document.getElementById('content-area');

    try {
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`Não foi possível carregar ${pageUrl}`);
        }
        const htmlContent = await response.text();
        
        contentArea.innerHTML = htmlContent;
        
        // 3. RE-ATRIBUIÇÃO DE LISTENERS
        attachEventListeners(pageUrl);

        // 4. Chama a função de renderização
        if (window[renderFunctionName]) {
            window[renderFunctionName]();
        }

    } catch (error) {
        contentArea.innerHTML = `<section class="section"><h2>Erro ao carregar página</h2><p>Verifique se os arquivos HTML parciais estão no mesmo diretório. Erro: ${error.message}</p></section>`;
        console.error(error);
    }
}

function attachEventListeners(pageUrl) {
    if (pageUrl === 'CadastroLivro.html') {
        document.getElementById('form-livro')?.addEventListener('submit', handleCadastrarLivro);
    } else if (pageUrl === 'CadastroUsuario.html') {
        document.getElementById('form-usuario')?.addEventListener('submit', handleCadastrarUsuario);
    } else if (pageUrl === 'Movimentacao.html') {
        document.getElementById('form-emprestimo')?.addEventListener('submit', handleRealizarEmprestimo);
    }
}


// --- 2. Funções de Manipulação de Dados (CRUD Básico) ---

function calculateDueDate(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + 10);
    return result.toLocaleDateString('pt-BR');
}

/**
 * Cadastra um novo livro, usando todos os campos do Livro.java.
 */
function handleCadastrarLivro(e) {
    e.preventDefault();
    // Campos do modelo Livro.java
    const nome = document.getElementById('livro-nome').value.trim();
    const autor = document.getElementById('livro-autor').value.trim();
    const genero = document.getElementById('livro-genero').value.trim();
    const editora = document.getElementById('livro-editora').value.trim();
    const edicao = document.getElementById('livro-edicao').value.trim();
    const ano = parseInt(document.getElementById('livro-ano').value.trim());
    const isbn = parseInt(document.getElementById('livro-isbn').value.trim());
    const codbarras = parseInt(document.getElementById('livro-codbarras').value.trim());
    const quantidadeStr = document.getElementById('livro-quantidade').value.trim();
    const quantidade = parseInt(quantidadeStr);
    
    if (isNaN(quantidade) || quantidade <= 0) {
         alert('Erro: A quantidade deve ser um número inteiro positivo.');
         return;
    }

    const id = (livros.length > 0 ? Math.max(...livros.map(l => l.id)) : 0) + 1;
    // Salva todos os campos, incluindo a disponibilidade
    livros.push({ 
        id, nome, autor, genero, editora, edicao, ano, isbn, codbarras, 
        total: quantidade, 
        disponivel: quantidade 
    }); 
    saveData('livros', livros);
    alert(`Livro "${nome}" cadastrado! ID: ${id}`);
    renderLivros();
    this.reset();
}

/**
 * Cadastra um novo usuário, usando todos os campos do Usuario.java.
 */
function handleCadastrarUsuario(e) {
    e.preventDefault();
    // Campos do modelo Usuario.java
    const nome = document.getElementById('usuario-nome').value.trim();
    const matricula = document.getElementById('usuario-matricula').value.trim();
    const cpf = document.getElementById('usuario-cpf').value.trim();
    const email = document.getElementById('usuario-email').value.trim();
    const telefone = document.getElementById('usuario-telefone').value.trim();

    if (usuarios.some(u => u.matricula === matricula)) {
        alert('Erro: Matrícula já cadastrada.');
        return;
    }
    // Salva todos os campos
    usuarios.push({ nome, matricula, cpf, email, telefone });
    saveData('usuarios', usuarios);
    alert(`Usuário "${nome}" (Matrícula: ${matricula}) cadastrado!`);
    renderUsuarios();
    this.reset();
}

function handleRealizarEmprestimo(e) {
    e.preventDefault();
    const livroId = parseInt(document.getElementById('emprestimo-livro-id').value.trim());
    const usuarioMatricula = document.getElementById('emprestimo-usuario-matricula').value.trim();

    if (isNaN(livroId) || livroId <= 0) {
        alert('Erro: ID do Livro deve ser um número inteiro positivo.');
        return;
    }

    const livro = livros.find(l => l.id === livroId);
    const usuarioExiste = usuarios.some(u => u.matricula === usuarioMatricula);

    if (!livro) { alert('Erro: Livro não encontrado.'); return; }
    if (!usuarioExiste) { alert('Erro: Usuário não encontrado. Verifique a matrícula.'); return; }
    if (livro.disponivel <= 0) { alert(`Erro: O livro "${livro.nome}" não tem cópias disponíveis.`); return; }
    
    livro.disponivel -= 1; 
    const emprestimoId = (emprestimos.length > 0 ? Math.max(...emprestimos.map(em => em.id)) : 0) + 1;
    const dataEmprestimo = new Date();
    
    emprestimos.push({
        id: emprestimoId,
        livroId: livro.id,
        usuarioMatricula: usuarioMatricula,
        dataEmprestimo: dataEmprestimo.toLocaleDateString('pt-BR'),
        dataPrevistaDevolucao: calculateDueDate(dataEmprestimo),
        status: 'EMPRESTADO'
    });

    saveData('livros', livros);
    saveData('emprestimos', emprestimos);
    alert(`Empréstimo ID ${emprestimoId} realizado.`);
    renderLivros(); 
    renderEmprestimos(); 
    this.reset();
}

// Lógica de Devolução
window.handleDevolucao = function(emprestimoId) {
    const emprestimo = emprestimos.find(em => em.id === emprestimoId);

    if (emprestimo && emprestimo.status === 'EMPRESTADO') {
        emprestimo.status = 'DEVOLVIDO';
        const livro = livros.find(l => l.id === emprestimo.livroId);
        if (livro) {
            livro.disponivel += 1;
            saveData('livros', livros);
        }
        saveData('emprestimos', emprestimos);
        alert(`Devolução do empréstimo ID ${emprestimoId} registrada com sucesso.`);
        renderLivros();
        renderEmprestimos();
    }
}

// --- 3. FUNÇÃO DE BUSCA DINÂMICA (Filtro) ---

/**
 * Filtra as linhas de uma tabela com base no texto de um input.
 * @param {string} inputId - ID do elemento de input que contém o termo de busca.
 * @param {string} tableId - ID da tabela a ser filtrada.
 * @param {number[]} colsToFilter - Array de índices das colunas a serem consideradas na busca.
 */
window.filterTable = function(inputId, tableId, colsToFilter) {
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tableId);
    
    if (!table) return; 

    const tr = table.getElementsByTagName("tr");

    // Começa em i=1 para pular o cabeçalho (thead)
    for (let i = 1; i < tr.length; i++) {
        let rowMatch = false;
        
        // Itera sobre as colunas que devem ser filtradas
        for (const colIndex of colsToFilter) {
            const td = tr[i].getElementsByTagName("td")[colIndex];
            
            if (td) {
                const textValue = td.textContent || td.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    rowMatch = true;
                    break; 
                }
            }
        }
        
        // Define a exibição da linha
        tr[i].style.display = rowMatch ? "" : "none";
    }
}


// --- 4. Funções de Renderização (Tabelas) ---

/**
 * Renderiza a tabela de livros com base no modelo Livro.java.
 */
window.renderLivros = function() {
    const tbody = document.getElementById('tabela-livros')?.querySelector('tbody');
    if (!tbody) return; 

    tbody.innerHTML = '';
    livros.forEach(livro => {
        const row = tbody.insertRow();
        row.insertCell().textContent = livro.id;
        row.insertCell().textContent = livro.nome;
        row.insertCell().textContent = livro.autor;
        row.insertCell().textContent = livro.genero;
        row.insertCell().textContent = livro.total;
        row.insertCell().textContent = livro.disponivel;
    });
}

/**
 * Renderiza a tabela de usuários com base no modelo Usuario.java.
 */
window.renderUsuarios = function() {
    const tbody = document.getElementById('tabela-usuarios')?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    usuarios.forEach(usuario => {
        const row = tbody.insertRow();
        row.insertCell().textContent = usuario.matricula;
        row.insertCell().textContent = usuario.nome;
        row.insertCell().textContent = usuario.cpf || '-';
        row.insertCell().textContent = usuario.email || '-';
        row.insertCell().textContent = usuario.telefone || '-';
    });
}

window.renderEmprestimos = function() {
    const tbody = document.getElementById('tabela-emprestimos')?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    emprestimos.filter(em => em.status === 'EMPRESTADO').forEach(emprestimo => {
        const row = tbody.insertRow();
        
        // Lógica de atraso
        const [dia, mes, ano] = emprestimo.dataPrevistaDevolucao.split('/');
        const dataDevolucaoPrevista = new Date(`${mes}/${dia}/${ano}`);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 

        let statusText = emprestimo.status;
        if (dataDevolucaoPrevista < hoje) {
            statusText = 'ATRASADO';
            row.classList.add('atrasado');
        }

        const livro = livros.find(l => l.id === emprestimo.livroId);

        row.insertCell().textContent = emprestimo.id;
        row.insertCell().textContent = emprestimo.livroId;
        row.insertCell().textContent = livro ? livro.nome : 'Livro Removido'; // Usando livro.nome
        row.insertCell().textContent = emprestimo.usuarioMatricula;
        row.insertCell().textContent = emprestimo.dataEmprestimo;
        row.insertCell().textContent = emprestimo.dataPrevistaDevolucao;
        row.insertCell().textContent = statusText;

        const actionCell = row.insertCell();
        const btn = document.createElement('button');
        btn.textContent = 'Devolver';
        btn.className = 'action-btn';
        btn.onclick = () => window.handleDevolucao(emprestimo.id); 
        actionCell.appendChild(btn);
    });
}

// --- Inicialização (Página de Movimentação como Padrão) ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicia carregando a tela de Movimentação
    const initialButton = document.getElementById('nav-movimentacao');
    loadPage('Movimentacao.html', initialButton, 'renderEmprestimos');
});