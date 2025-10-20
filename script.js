// --- Funções de Utilidade e Persistência (localStorage) ---
const loadData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

let livros = loadData('livros');
let usuarios = loadData('usuarios');
let emprestimos = loadData('emprestimos');

// --- 1. Controle do Menu e Navegação ---

function toggleMenu() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    // Altera a visibilidade do menu
    nav.classList.toggle('hidden');
    // Altera o ícone do hambúrguer (X ou 3 barras)
    hamburger.classList.toggle('open');
}

/**
 * Carrega o conteúdo de um arquivo HTML na área principal (main) 
 * e executa a função de renderização correspondente.
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
        
        // 3. RE-ATRIBUIÇÃO DE LISTENERS (Pois o conteúdo foi recarregado)
        attachEventListeners(pageUrl);

        // 4. Chama a função de renderização para preencher a tabela
        if (window[renderFunctionName]) {
            window[renderFunctionName]();
        }

    } catch (error) {
        contentArea.innerHTML = `<section class="section"><h2>Erro ao carregar página</h2><p>Verifique se os arquivos HTML parciais (CadastroLivro.html, etc.) estão no mesmo diretório. Erro: ${error.message}</p></section>`;
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


// --- 2. Funções de Manipulação de Dados ---

function calculateDueDate(date) {
    const result = new Date(date);
    result.setDate(result.getDate() + 10);
    return result.toLocaleDateString('pt-BR');
}

function handleCadastrarLivro(e) {
    e.preventDefault();
    const titulo = document.getElementById('livro-titulo').value.trim();
    const autor = document.getElementById('livro-autor').value.trim();
    const quantidadeStr = document.getElementById('livro-quantidade').value.trim();
    const quantidade = parseInt(quantidadeStr);
    
    if (isNaN(quantidade) || quantidade <= 0) {
         alert('Erro: A quantidade deve ser um número inteiro positivo.');
         return;
    }

    const id = (livros.length > 0 ? Math.max(...livros.map(l => l.id)) : 0) + 1;
    livros.push({ id, titulo, autor, total: quantidade, disponivel: quantidade });
    saveData('livros', livros);
    alert(`Livro "${titulo}" cadastrado! ID: ${id}`);
    renderLivros();
    this.reset();
}

function handleCadastrarUsuario(e) {
    e.preventDefault();
    const nome = document.getElementById('usuario-nome').value.trim();
    const matricula = document.getElementById('usuario-matricula').value.trim();
    if (usuarios.some(u => u.matricula === matricula)) {
        alert('Erro: Matrícula já cadastrada.');
        return;
    }
    usuarios.push({ matricula, nome });
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
    if (livro.disponivel <= 0) { alert(`Erro: O livro "${livro.titulo}" não tem cópias disponíveis.`); return; }
    
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

// Global para ser chamada do HTML da tabela
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


// --- 3. Funções de Renderização (Globais) ---
window.renderLivros = function() {
    const tbody = document.getElementById('tabela-livros')?.querySelector('tbody');
    if (!tbody) return; 

    tbody.innerHTML = '';
    livros.forEach(livro => {
        const row = tbody.insertRow();
        row.insertCell().textContent = livro.id;
        row.insertCell().textContent = livro.titulo;
        row.insertCell().textContent = livro.autor;
        row.insertCell().textContent = livro.total;
        row.insertCell().textContent = livro.disponivel;
    });
}

window.renderUsuarios = function() {
    const tbody = document.getElementById('tabela-usuarios')?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    usuarios.forEach(usuario => {
        const row = tbody.insertRow();
        row.insertCell().textContent = usuario.matricula;
        row.insertCell().textContent = usuario.nome;
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
        row.insertCell().textContent = livro ? livro.titulo : 'Livro Removido';
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