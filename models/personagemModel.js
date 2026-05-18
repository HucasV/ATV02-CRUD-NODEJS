
const db = require("../config/db");

async function findByIdAndJogador(id, id_jogador) {
  const [rows] = await db.query(
    "SELECT * FROM personagens WHERE id = ? AND id_jogador = ?",
    [id, id_jogador]
  );
  return rows[0];
}

async function findAllByJogador(id_jogador) {
  const [rows] = await db.query(
    "SELECT * FROM personagens WHERE id_jogador = ?",
    [id_jogador]
  );
  return rows;
}

async function create(data) {
  const {
    nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade,
    vida_atual, sanidade_atual, id_jogador, imagem
  } = data;
  const [result] = await db.query(
    `INSERT INTO personagens 
    (nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade, 
     vida_atual, sanidade_atual, id_jogador, imagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, nivel, descricao, forca, agilidade, constituicao, intelecto, atencao, estabilidade,
     vida_atual, sanidade_atual, id_jogador, imagem]
  );
  return result.insertId;
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map(k => `${k} = ?`).join(", ");
  await db.query(`UPDATE personagens SET ${setClause} WHERE id = ?`, [...values, id]);
}

async function deleteById(id, id_jogador) {
  await db.query("DELETE FROM personagens WHERE id = ? AND id_jogador = ?", [id, id_jogador]);
}


async function getBonus(id) {
  const [rows] = await db.query(
    "SELECT bonus_armadura, bonus_outros FROM personagens WHERE id = ?",
    [id]
  );
  return rows[0];
}

async function updateCA(id, ca) {
  await db.query("UPDATE personagens SET ca = ? WHERE id = ?", [ca, id]);
}

async function updateBonus(id, bonusArmadura, bonusOutros) {
  const [personagem] = await db.query("SELECT agilidade FROM personagens WHERE id = ?", [id]);
  if (!personagem) throw new Error("Personagem não encontrado");
  const agilidade = personagem.agilidade || 0;
  const ca = 10 + agilidade + bonusArmadura + bonusOutros;
  await db.query(
    "UPDATE personagens SET bonus_armadura = ?, bonus_outros = ?, ca = ? WHERE id = ?",
    [bonusArmadura, bonusOutros, ca, id]
  );
  return { ca };
}

async function findById(id) {
  const [rows] = await db.query("SELECT * FROM personagens WHERE id = ?", [id]);
  return rows[0];
}

module.exports = { findByIdAndJogador, findAllByJogador, create, update, deleteById, getBonus, updateCA, updateBonus, findById};