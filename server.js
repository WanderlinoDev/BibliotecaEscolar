// ============================================================
// SERVER.JS — Biblioteca Escolar (versão final com driver PG)
// ============================================================

import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;
const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());

// ============================================================
// CONEXÃO COM BANCO — PostgreSQL (via driver PG)
// ============================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});


(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao banco PostgreSQL (pg)");
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  }
})();

// ============================================================
// ROTAS DE API
// ============================================================

const apiRouter = express.Router();

// ============================================================
// 🔹 CADASTRAR USUÁRIO
// ============================================================
apiRouter.post("/usuarios", async (req, res) => {
  console.log("[API] POST /usuarios chamado.");
  try {
    const { matricula, nome, cpf, email, telefone } = req.body;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, "") : null;
    const telefoneLimpo = telefone ? telefone.replace(/\D/g, "") : null;

    if (!matricula || !nome || !cpfLimpo || !email || cpfLimpo.length !== 11) {
      console.log("❌ Dados inválidos recebidos:", req.body);
      return res.status(400).json({ error: "Campos obrigatórios inválidos." });
    }

    const result = await pool.query(
      `INSERT INTO public.usuarios (matricula, nome, cpf, email, telefone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario`,
      [matricula, nome, cpfLimpo, email, telefoneLimpo]
    );

    console.log("✅ Usuário cadastrado:", result.rows[0]);
    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      id: result.rows[0].id_usuario,
    });
  } catch (err) {
    if (err.message && err.message.includes("duplicate key")) {
      return res
        .status(409)
        .json({ error: "Matrícula ou CPF já cadastrados." });
    }
    console.error("❌ Erro ao cadastrar usuário:", err.message);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// ============================================================
// 🔹 LISTAR USUÁRIOS
// ============================================================
apiRouter.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_usuario, matricula, nome, cpf, email, telefone, data_cadastro
       FROM public.usuarios
       ORDER BY id_usuario ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err.message);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// ============================================================
// 🔹 PESQUISAR USUÁRIO (por matrícula e/ou nome)
// ============================================================
apiRouter.get("/usuarios/search", async (req, res) => {
  const { matricula, nome } = req.query;
  try {
    let query = `
      SELECT id_usuario, matricula, nome, cpf, email, telefone
      FROM public.usuarios
      WHERE 1=1`;
    const params = [];

    if (matricula) {
      params.push(`%${matricula}%`);
      query += ` AND matricula ILIKE $${params.length}`;
    }
    if (nome) {
      params.push(`%${nome}%`);
      query += ` AND nome ILIKE $${params.length}`;
    }

    query += ` ORDER BY id_usuario ASC;`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erro ao pesquisar usuários:", err.message);
    res.status(500).json({ error: "Erro ao pesquisar usuários." });
  }
});

// ============================================================
// 🔹 ATUALIZAR USUÁRIO
// ============================================================
apiRouter.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { matricula, nome, cpf, email, telefone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.usuarios
       SET matricula = $1,
           nome = $2,
           cpf = $3,
           email = $4,
           telefone = $5
       WHERE id_usuario = $6
       RETURNING *`,
      [
        matricula,
        nome,
        cpf.replace(/\D/g, ""),
        email,
        telefone.replace(/\D/g, ""),
        id,
      ]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    res.json({
      message: "Usuário atualizado com sucesso!",
      usuario: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Erro ao atualizar usuário:", err.message);
    res.status(500).json({ error: "Erro ao atualizar usuário." });
  }
});

// ============================================================
// 🔹 EXCLUIR USUÁRIO
// ============================================================
apiRouter.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM public.usuarios WHERE id_usuario = $1 RETURNING id_usuario`,
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuário não encontrado." });

    res.json({ message: "Usuário excluído com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao excluir usuário:", err.message);
    res.status(500).json({ error: "Erro ao excluir usuário." });
  }
});

// ============================================================
// MONTAGEM DO SERVIDOR
// ============================================================

app.use("/api", apiRouter);
app.use(express.static(path.join(__dirname, "public")));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
