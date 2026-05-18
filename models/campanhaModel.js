
const db = require("../config/db");

async function findById(id) {
  const [rows] = await db.query("SELECT * FROM campanhas WHERE id = ?", [id]);
  return rows[0];
}

async function findAllByMestre(id_mestre) {
  const [rows] = await db.query("SELECT * FROM campanhas WHERE id_mestre = ? ORDER BY created_at DESC", [id_mestre]);
  return rows;
}

async function create({ nome, descricao, id_mestre }) {
  const [result] = await db.query(
    "INSERT INTO campanhas (nome, descricao, id_mestre) VALUES (?, ?, ?)",
    [nome, descricao, id_mestre]
  );
  return result.insertId;
}

async function addJogador(id_campanha, id_jogador) {
  await db.query(
    "INSERT IGNORE INTO campanha_jogadores (id_campanha, id_jogador) VALUES (?, ?)",
    [id_campanha, id_jogador]
  );
}

async function removeJogador(id_campanha, id_jogador) {
  await db.query("DELETE FROM campanha_jogadores WHERE id_campanha = ? AND id_jogador = ?", [id_campanha, id_jogador]);
  await db.query("DELETE FROM campanha_personagens WHERE id_campanha = ? AND id_jogador = ?", [id_campanha, id_jogador]);
}

async function getJogadoresDaCampanha(id_campanha) {
  const [rows] = await db.query(`
    SELECT j.id AS id_jogador, j.nome, j.email
    FROM campanha_jogadores cj
    JOIN jogador j ON cj.id_jogador = j.id
    WHERE cj.id_campanha = ?
  `, [id_campanha]);
  return rows;
}

async function getPersonagensAtribuidos(id_campanha, id_jogador) {
  const [rows] = await db.query(`
    SELECT p.id, p.nome, p.nivel, p.imagem
    FROM campanha_personagens cp
    JOIN personagens p ON cp.id_personagem = p.id
    WHERE cp.id_campanha = ? AND cp.id_jogador = ?
  `, [id_campanha, id_jogador]);
  return rows;
}

async function atribuirPersonagem(id_campanha, id_jogador, id_personagem) {
  await db.query(
    `INSERT INTO campanha_personagens (id_campanha, id_jogador, id_personagem)
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE id_personagem = VALUES(id_personagem)`,
    [id_campanha, id_jogador, id_personagem]
  );
}

async function removerPersonagem(id_campanha, id_personagem) {
  await db.query("DELETE FROM campanha_personagens WHERE id_campanha = ? AND id_personagem = ?", [id_campanha, id_personagem]);
}

async function getCampanhasByJogador(id_jogador) {
  const [rows] = await db.query(`
    SELECT c.id, c.nome, c.descricao
    FROM campanha_jogadores cj
    JOIN campanhas c ON cj.id_campanha = c.id
    WHERE cj.id_jogador = ?
  `, [id_jogador]);
  return rows;
}

async function deleteCampanha(id_campanha) {
  await db.query("DELETE FROM solicitacoes_campanha WHERE id_campanha = ?", [id_campanha]);
  await db.query("DELETE FROM campanha_personagens WHERE id_campanha = ?", [id_campanha]);
  await db.query("DELETE FROM campanha_jogadores WHERE id_campanha = ?", [id_campanha]);
  await db.query("DELETE FROM campanhas WHERE id = ?", [id_campanha]);
}

async function getCampanhaAtivaDoPersonagem(id_personagem) {
  const [rows] = await db.query(
    `SELECT id_campanha FROM campanha_personagens WHERE id_personagem = ? LIMIT 1`,
    [id_personagem]
  );
  return rows[0]?.id_campanha || null;
}

module.exports = {
  findById,
  findAllByMestre,
  create,
  addJogador,
  removeJogador,
  getJogadoresDaCampanha,
  getPersonagensAtribuidos,
  atribuirPersonagem,
  removerPersonagem,
  getCampanhasByJogador,
  deleteCampanha,
  getCampanhaAtivaDoPersonagem
};