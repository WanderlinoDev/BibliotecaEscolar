import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

// Configuração da conexão com PostgreSQL (Neon ou local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Teste de conexão
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Conectado ao banco PostgreSQL (pg)");
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  }
})();

// ====================== ROTAS API ========================= //
const apiRouter = express.Router();

// 🔹 Cadastrar novo usuário
apiRouter.post("/usuarios", async (req, res) => {
  try {
    const { matricula, nome, cpf, email, telefone } = req.body;
    const cpfLimpo = cpf?.replace(/\D/g, "");
    const telefoneLimpo = telefone?.replace(/\D/g, "");

    const query = `
      INSERT INTO usuarios (matricula, nome, cpf, email, telefone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [matricula, nome, cpfLimpo, email, telefoneLimpo];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.includes("duplicate key")) {
      return res
        .status(400)
        .json({ error: "Usuário já cadastrado (CPF ou matrícula duplicada)." });
    }
    console.error("❌ Erro ao cadastrar usuário:", err.message);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// 🔹 Listar todos os usuários
apiRouter.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id_usuario DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err.message);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// 🔹 Pesquisar usuário por matrícula e/ou nome
apiRouter.get("/usuarios/search", async (req, res) => {
  try {
    const { matricula, nome } = req.query;

    let query = "SELECT * FROM usuarios WHERE 1=1";
    const values = [];
    let index = 1;

    if (matricula) {
      query += ` AND matricula ILIKE $${index++}`;
      values.push(`%${matricula}%`);
    }

    if (nome) {
      query += ` AND nome ILIKE $${index++}`;
      values.push(`%${nome}%`);
    }

    query += " ORDER BY id_usuario DESC";
    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao pesquisar usuários:", err.message);
    res.status(500).json({ error: "Erro ao pesquisar usuários." });
  }
});

// 🔹 Atualizar usuário
apiRouter.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { matricula, nome, cpf, email, telefone } = req.body;
    const cpfLimpo = cpf?.replace(/\D/g, "");
    const telefoneLimpo = telefone?.replace(/\D/g, "");

    const result = await pool.query(
      `UPDATE usuarios
       SET matricula = $1, nome = $2, cpf = $3, email = $4, telefone = $5
       WHERE id_usuario = $6
       RETURNING *`,
      [matricula, nome, cpfLimpo, email, telefoneLimpo, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    res.json({ message: "Usuário atualizado com sucesso!", usuario: result.rows[0] });
  } catch (err) {
    console.error("❌ Erro ao atualizar usuário:", err.message);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
});

// 🔹 Excluir usuário
apiRouter.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    res.json({ message: "Usuário excluído com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao excluir usuário:", err.message);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
});


// ====================== ROTAS DE LIVROS ========================= //

// 🔹 Cadastrar novo livro
apiRouter.post('/livros', async (req, res) => {
  try {
    const {
      isbn, titulo, subtitulo, autor, genero,
      editora, edicao, ano_publicacao, descricao
    } = req.body;

    const query = `
      INSERT INTO livros (isbn, titulo, subtitulo, autor, genero, editora, edicao, ano_publicacao, descricao)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;
    const values = [isbn, titulo, subtitulo, autor, genero, editora, edicao, ano_publicacao, descricao];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erro ao cadastrar livro:', err.message);
    res.status(500).json({ error: 'Erro ao cadastrar livro.' });
  }
});

// 🔹 Buscar livros por ISBN ou título (search)
apiRouter.get('/livros/search', async (req, res) => {
  try {
    const { isbn, titulo } = req.query;
    let query = 'SELECT * FROM livros WHERE 1=1';
    const values = [];
    let idx = 1;
    if (isbn) {
      query += ` AND isbn = $${idx++}`;
      values.push(isbn);
    }
    if (titulo) {
      query += ` AND titulo ILIKE $${idx++}`;
      values.push('%' + titulo + '%');
    }
    query += ' ORDER BY id_livro DESC LIMIT 50';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao buscar livros:', err.message);
    res.status(500).json({ error: 'Erro ao buscar livros.' });
  }
});

// 🔹 Listar todos os livros
apiRouter.get('/livros', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM livros ORDER BY id_livro DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erro ao listar livros:', err.message);
    res.status(500).json({ error: 'Erro ao listar livros.' });
  }
});

// 🔹 Atualizar livro
apiRouter.put('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isbn, titulo, subtitulo, autor, genero,
      editora, edicao, ano_publicacao, descricao, status
    } = req.body;

    const result = await pool.query(
      `UPDATE livros SET isbn=$1, titulo=$2, subtitulo=$3, autor=$4, genero=$5, editora=$6, edicao=$7, ano_publicacao=$8, descricao=$9, status=$10 WHERE id_livro=$11 RETURNING *`,
      [isbn, titulo, subtitulo, autor, genero, editora, edicao, ano_publicacao, descricao, status || 'Disponível', id]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Livro não encontrado.' });
    res.json({ message: 'Livro atualizado com sucesso!', livro: result.rows[0] });
  } catch (err) {
    console.error('❌ Erro ao atualizar livro:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar livro.' });
  }
});

// 🔹 Excluir livro
apiRouter.delete('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM livros WHERE id_livro = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Livro não encontrado.' });
    res.json({ message: 'Livro excluído com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao excluir livro:', err.message);
    res.status(500).json({ error: 'Erro ao excluir livro.' });
  }
});


app.use("/api", apiRouter);

// ========================================================= //

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
