-- =========================================================
-- 📚 SISTEMA DE BIBLIOTECA ESCOLAR
-- Autor: Wanderlino & ChatGPT
-- Descrição: Criação das tabelas e inserção dos tipos de movimentação
-- Banco compatível com: MySQL / MariaDB / SQLite / PostgreSQL
-- =========================================================

-- ==========================================
-- 🧾 TABELA DE USUÁRIOS
-- ==========================================
CREATE TABLE usuarios (
    id_usuario       INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula        VARCHAR(20) NOT NULL UNIQUE,
    nome             VARCHAR(100) NOT NULL,
    cpf              VARCHAR(11) NOT NULL UNIQUE,
    email            VARCHAR(100),
    telefone         VARCHAR(11),
    data_cadastro    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 📘 TABELA DE LIVROS
-- ==========================================
CREATE TABLE livros (
    id_livro         INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo           VARCHAR(150) NOT NULL,
    autor            VARCHAR(100),
    genero           VARCHAR(50),
    editora          VARCHAR(100),
    edicao           VARCHAR(20),
    ano_publicacao   VARCHAR(4),
    isbn             VARCHAR(20),
    cod_barras       VARCHAR(30),
    status           VARCHAR(20) DEFAULT 'Disponível',
    data_cadastro    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 🔄 TABELA DE MOVIMENTAÇÕES
-- ==========================================
CREATE TABLE movimentacoes (
    id_movimentacao  INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario       INTEGER NOT NULL,
    id_livro         INTEGER NOT NULL,
    tipo             VARCHAR(30) NOT NULL,
    data_movimento   DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacao       TEXT,
    cor              VARCHAR(10),    -- cor para exibição (ex: #007bff)
    icone            VARCHAR(50),    -- nome do ícone (ex: "📘", "🔁", "🚫")
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_livro) REFERENCES livros(id_livro)
);

-- ==========================================
-- 🧩 TABELA DE TIPOS DE MOVIMENTAÇÃO
-- ==========================================
CREATE TABLE tipos_movimentacao (
    id_tipo          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome             VARCHAR(50) NOT NULL,
    descricao        TEXT,
    icone            VARCHAR(10),
    cor              VARCHAR(10)
);

-- ==========================================
-- 🌈 INSERÇÃO DOS TIPOS DE MOVIMENTAÇÃO
-- ==========================================
INSERT INTO tipos_movimentacao (nome, descricao, icone, cor) VALUES
('Empréstimo', 'Livro emprestado a um usuário', '📗', '#007bff'),
('Devolução', 'Livro devolvido à biblioteca', '📘', '#28a745'),
('Renovação', 'Prazo de empréstimo prorrogado', '🔁', '#17a2b8'),
('Reserva', 'Usuário reservou um livro emprestado', '📒', '#ffc107'),
('Aquisição', 'Novo livro adicionado ao acervo', '➕', '#6f42c1'),
('Baixa', 'Livro removido do acervo', '❌', '#dc3545'),
('Transferência', 'Livro transferido para outro local', '🚚', '#20c997'),
('Extravio', 'Livro perdido ou extraviado', '⚠️', '#fd7e14'),
('Em Reparo', 'Livro em manutenção ou restauro', '🛠️', '#6610f2'),
('Consulta Local', 'Leitura dentro da biblioteca', '📖', '#17a2b8'),
('Devolução Atrasada', 'Devolvido após o prazo', '⏰', '#d63384');
