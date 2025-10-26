import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔹 Banco de Dados PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then(() => console.log("✅ Conectado ao banco PostgreSQL (pg)"))
  .catch((err) => console.error("❌ Erro ao conectar ao banco:", err));

// =====================================================
// 🔹 ROTA: Listar todos os usuários
// =====================================================
app.get("/api/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id_usuario DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// =====================================================
// 🔹 ROTA: Pesquisar usuário por matrícula, nome ou CPF
// =====================================================
app.get("/api/usuarios/search", async (req, res) => {
  try {
    const { matricula, nome, cpf } = req.query;
    let query = "SELECT * FROM usuarios WHERE 1=1";
    const params = [];

    if (matricula) {
      params.push(`%${matricula}%`);
      query += ` AND matricula ILIKE $${params.length}`;
    }
    if (nome) {
      params.push(`%${nome}%`);
      query += ` AND nome ILIKE $${params.length}`;
    }
    if (cpf) {
      params.push(`%${cpf}%`);
      query += ` AND cpf ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao pesquisar usuários:", err);
    res.status(500).json({ error: "Erro ao pesquisar usuários" });
  }
});

// =====================================================
// 🔹 ROTA: Cadastrar novo usuário
// =====================================================
app.post("/api/usuarios", async (req, res) => {
  try {
    const { matricula, nome, cpf, email, telefone, tipo } = req.body;

    if (!matricula || !nome || !cpf) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });
    }

    const query = `
      INSERT INTO usuarios (matricula, nome, cpf, email, telefone, tipo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await pool.query(query, [matricula, nome, cpf, email, telefone, tipo]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao cadastrar usuário:", err);
    if (err.code === "23505") {
      res.status(409).json({ error: "Usuário com matrícula ou CPF já existe." });
    } else {
      res.status(500).json({ error: "Erro ao cadastrar usuário" });
    }
  }
});

// =====================================================
// 🔹 ROTA: Atualizar usuário
// =====================================================
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { matricula, nome, cpf, email, telefone, tipo } = req.body;

    const query = `
      UPDATE usuarios
      SET matricula=$1, nome=$2, cpf=$3, email=$4, telefone=$5, tipo=$6
      WHERE id_usuario=$7
      RETURNING *;
    `;

    const result = await pool.query(query, [matricula, nome, cpf, email, telefone, tipo, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// =====================================================
// 🔹 ROTA: Excluir usuário
// =====================================================
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id]);
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    console.error("❌ Erro ao excluir usuário:", err);
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

// =====================================================
// 🔹 Inicialização do servidor
// =====================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
