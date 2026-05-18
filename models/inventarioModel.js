const db = require("../config/db");

async function listarPorPersonagem(id_personagem) {
  const [rows] = await db.query(
    `SELECT * FROM inventario WHERE id_personagem = ? ORDER BY esta_equipado DESC, tipo, nome`,
    [id_personagem]
  );
  return rows;
}

async function adicionarItem(id_personagem, id_item_biblioteca, nome_personalizado = null) {
  const [itemBase] = await db.query("SELECT * FROM itens_biblioteca WHERE id = ?", [id_item_biblioteca]);
  if (!itemBase.length) throw new Error("Item não encontrado");
  const base = itemBase[0];
  const usosRestantes = base.usos_maximos ? base.usos_maximos : null;
  const [result] = await db.query(
    `INSERT INTO inventario 
    (id_personagem, nome, tipo, descricao, dado_dano, atributo_acerto, bonus_acerto, 
     margem_critico, multiplicador_critico, bonus_ca, usos_maximos, usos_restantes, esta_equipado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_personagem,
      nome_personalizado || base.nome,
      base.tipo,
      base.descricao,
      base.dano,
      base.atributo_ataque,
      base.bonus_ataque,
      base.margem_critico,
      base.multiplicador_critico,
      base.bonus_ca,
      base.usos_maximos,
      usosRestantes,
      0
    ]
  );
  return result.insertId;
}

async function removerItem(id_item_personagem, id_personagem) {
  await db.query("DELETE FROM inventario WHERE id = ? AND id_personagem = ?", [id_item_personagem, id_personagem]);
}

async function equiparItem(id_item_personagem, id_personagem, equipado) {
  await db.query("UPDATE inventario SET esta_equipado = ? WHERE id = ? AND id_personagem = ?", [equipado ? 1 : 0, id_item_personagem, id_personagem]);
}

async function atualizarUsos(id_item_personagem, usos_restantes) {
  await db.query("UPDATE inventario SET usos_restantes = ? WHERE id = ?", [usos_restantes, id_item_personagem]);
}

async function obterItemPersonagem(id_item_personagem, id_personagem) {
  const [rows] = await db.query("SELECT * FROM inventario WHERE id = ? AND id_personagem = ?", [id_item_personagem, id_personagem]);
  return rows[0];
}

// Modificações
async function adicionarModificacaoItem(id_item_personagem, id_modificacao) {
  await db.query("INSERT INTO item_modificacoes (id_item, id_modificacao) VALUES (?, ?)", [id_item_personagem, id_modificacao]);
}
async function removerModificacaoItem(id_item_personagem, id_modificacao) {
  await db.query("DELETE FROM item_modificacoes WHERE id_item = ? AND id_modificacao = ?", [id_item_personagem, id_modificacao]);
}
async function listarModificacoesItem(id_item_personagem) {
  const [rows] = await db.query(
    `SELECT m.* FROM modificacoes_biblioteca m 
     JOIN item_modificacoes im ON m.id = im.id_modificacao 
     WHERE im.id_item = ?`,
    [id_item_personagem]
  );
  return rows;
}
// models/itemModel.js
async function criarItemBiblioteca(data) {
  const { nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador } = data;
  const [result] = await db.query(
    `INSERT INTO itens_biblioteca 
    (nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador]
  );
  return result.insertId;
}
module.exports = {
  listarPorPersonagem,
  adicionarItem,
  removerItem,
  equiparItem,
  atualizarUsos,
  obterItemPersonagem,
  adicionarModificacaoItem,
  removerModificacaoItem,
  listarModificacoesItem,
  criarItemBiblioteca
};