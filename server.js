// ============================================================
// SERVER.JS — Biblioteca Escolar (versão NEON SERVERLESS)
// ============================================================

import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless"; // ✅ Novo client Neon Serverless

// ============================================================
// CONFIGURAÇÃO BÁSICA
// ============================================================
dotenv.config();
const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());

// ============================================================
// CONEXÃO COM NEONDB (SERVERLESS)
// ============================================================
// O client Neon é stateless — abre e fecha conexão a cada query
const sql = neon(process.env.DATABASE_URL);

// 🔎 Verifica conexão inicial
(async () => {
  try {
    await sql`SELECT 1`;
    console.log("✅ Conectado ao banco Neon PostgreSQL (serverless)");
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  }
})();

// ============================================================
// SERVE ARQUIVOS ESTÁTICOS DO FRONTEND
// ============================================================
app.use(express.static(path.join(__dirname, "public")));

// ============================================================
// ROTAS DA API — USUÁRIOS
// ============================================================
const apiRouter = express.Router();

// 1️⃣ — Cadastrar novo usuário
apiRouter.post("/usuarios", async (req, res) => {
  console.log("[API] POST /usuarios chamado.");
  try {
    const { matricula, nome, cpf, email, telefone } = req.body;

    const cpfLimpo = cpf ? cpf.replace(/\D/g, "") : null;
    const telefoneLimpo = telefone ? telefone.replace(/\D/g, "") : null;

    if (!matricula || !nome || !cpfLimpo || !email || cpfLimpo.length !== 11) {
      return res
        .status(400)
        .json({ error: "Preencha todos os campos obrigatórios corretamente." });
    }

    const result = await sql`
      INSERT INTO public.usuarios (matricula, nome, cpf, email, telefone)
      VALUES (${matricula}, ${nome}, ${cpfLimpo}, ${email}, ${telefoneLimpo})
      RETURNING id_usuario;
    `;

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      id: result[0].id_usuario,
    });

    console.log("👤 Usuário cadastrado:", nome);
  } catch (err) {
    if (err.message.includes("duplicate key")) {
      return res
        .status(409)
        .json({ error: "Matrícula ou CPF já cadastrados." });
    }
    console.error("❌ Erro ao cadastrar usuário:", err.message);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// 2️⃣ — Listar todos os usuários
apiRouter.get("/usuarios", async (req, res) => {
  try {
    const result = await sql`
      SELECT id_usuario, matricula, nome, cpf, email, telefone, data_cadastro
      FROM public.usuarios
      ORDER BY id_usuario ASC;
    `;
    res.json(result);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err.message);
    res.status(500).json({ error: "Erro ao listar usuários." });
  }
});

// 3️⃣ — Buscar usuário por matrícula
apiRouter.get("/usuarios/matricula/:matricula", async (req, res) => {
  const { matricula } = req.params;
  try {
    const result = await sql`
      SELECT id_usuario, nome
      FROM public.usuarios
      WHERE matricula = ${matricula};
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json(result[0]);
  } catch (err) {
    console.error("❌ Erro ao buscar usuário:", err.message);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

// ============================================================
// MONTAGEM DO ROUTER
// ============================================================
app.use("/api", apiRouter);

// ============================================================
// ROTA FALLBACK — SPA (Single Page Application)
// ============================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
