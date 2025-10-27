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

app.use("/api", apiRouter);

// ========================================================= //

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
