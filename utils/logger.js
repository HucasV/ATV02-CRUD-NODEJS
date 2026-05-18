const db = require("../config/db");

async function registrarLogCampanha(id_campanha, id_jogador, id_personagem, acao, nome_acao, detalhes, resultado = null) {
  if (!id_campanha) return; // sem campanha ativa, não registra
  try {
    await db.query(
      `INSERT INTO campanha_logs (id_campanha, id_jogador, id_personagem, acao, nome_acao, detalhes, resultado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_campanha, id_jogador, id_personagem, acao, nome_acao, detalhes, resultado]
    );
  } catch (err) {
    console.error("Erro ao registrar log:", err);
  }
}

module.exports = { registrarLogCampanha };