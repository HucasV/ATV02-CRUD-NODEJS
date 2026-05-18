const InventarioModel = require("../models/inventarioModel");
const ItemModel = require("../models/itemModel");      // for biblioteca
const ModificacaoModel = require("../models/modificacaoModel");
const PersonagemModel = require("../models/personagemModel");
const { rollD20, rollDice } = require("../utils/diceRoller");

// Helper to recalc CA from equipped protections
async function recalcularCAEquipamentos(id_personagem) {
  const itens = await InventarioModel.listarPorPersonagem(id_personagem);
  let bonusTotal = 0;
  for (const item of itens) {
    if (item.esta_equipado && item.tipo === 'protecao') {
      bonusTotal += (item.bonus_ca || 0);
      const mods = await InventarioModel.listarModificacoesItem(item.id);
      for (const mod of mods) {
        bonusTotal += (mod.bonus_ca || 0);
      }
    }
  }
  await PersonagemModel.update(id_personagem, { ca_equipamentos: bonusTotal });
}

// Listar inventário
async function listar(req, res) {
  const { id_personagem } = req.params;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  const itens = await InventarioModel.listarPorPersonagem(id_personagem);
  res.json(itens);
}

// Adicionar item da biblioteca
async function adicionar(req, res) {
  const { id_personagem, id_item_biblioteca, nome_personalizado } = req.body;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  const id_item = await InventarioModel.adicionarItem(id_personagem, id_item_biblioteca, nome_personalizado);
  // Se for proteção, recalcular CA (embora ainda não equipado)
  res.json({ ok: true, id_item_personagem: id_item });
}

// Remover item
async function remover(req, res) {
  const { id_personagem, id_item_personagem } = req.params;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  await InventarioModel.removerItem(id_item_personagem, id_personagem);
  await recalcularCAEquipamentos(id_personagem);
  res.json({ ok: true });
}

// Equipar / desequipar
async function equipar(req, res) {
  const { id_personagem, id_item_personagem } = req.params;
  const { equipado } = req.body;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  await InventarioModel.equiparItem(id_item_personagem, id_personagem, equipado);
  await recalcularCAEquipamentos(id_personagem);
  res.json({ ok: true });
}


// Usar item (genérico, para itens não armas)
async function usarItem(req, res) {
  const { id_personagem, id_item_personagem } = req.params;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  const item = await InventarioModel.obterItemPersonagem(id_item_personagem, id_personagem);
  if (!item) return res.status(404).json({ erro: "Item não encontrado" });
  
  let removido = false;
  if (item.tipo === 'anomalo') {
    let usos = item.usos_restantes;
    if (usos === null || usos === undefined) usos = item.usos_maximos;
    if (usos <= 0) return res.status(400).json({ erro: "Sem usos restantes" });
    const novosUsos = usos - 1;
    if (novosUsos === 0) {
      // Remove o item do inventário
      await InventarioModel.removerItem(id_item_personagem, id_personagem);
      removido = true;
    } else {
      await InventarioModel.atualizarUsos(id_item_personagem, novosUsos);
    }
  } else {
    // Para itens não anômalos, apenas aplica efeito se houver (ex: cura, dano, etc.)
    // Você pode expandir aqui conforme necessidade
  }
  // Aqui você pode implementar efeitos específicos (curar, dar dano, etc.)
  res.json({ ok: true, mensagem: `${item.nome} utilizado.`, removido });
}

// Atacar com arma
async function atacarComArma(req, res) {
  const { id_personagem, id_item_personagem } = req.params;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  const item = await InventarioModel.obterItemPersonagem(id_item_personagem, id_personagem);
  if (!item || item.tipo !== 'arma') return res.status(400).json({ erro: "Item não é arma" });

  // Buscar modificações
  const mods = await InventarioModel.listarModificacoesItem(id_item_personagem);
  let bonusAtaque = (item.bonus_acerto || 0);
  let bonusDanoStr = "";
  let atributoAdicional = 0;
  for (const mod of mods) {
    bonusAtaque += (mod.bonus_ataque || 0);
    if (mod.bonus_dano) bonusDanoStr += `+${mod.bonus_dano}`;
    if (mod.atributo_adicional) {
      atributoAdicional += (personagem[mod.atributo_adicional] || 0);
    }
  }
  const atributoBase = item.atributo_acerto || 'forca';
  const valorAtributo = personagem[atributoBase] || 1;
  const totalBonus = valorAtributo + bonusAtaque + atributoAdicional;
  const ataqueRoll = rollD20(totalBonus);
  const ehCritico = (ataqueRoll.roll >= (item.margem_critico || 20));
  let danoTotal = 0;
  let danoRolls = [];
  const danoBase = item.dado_dano || "1d4";
  if (ehCritico) {
    const multiplicador = item.multiplicador_critico || 2;
    for (let i = 0; i < multiplicador; i++) {
      const resultado = rollDice(danoBase);
      danoTotal += resultado.total;
      danoRolls.push(...resultado.rolls);
    }
    if (bonusDanoStr) {
      const bonusRoll = rollDice(bonusDanoStr.replace(/^\+/, ""));
      danoTotal += bonusRoll.total * multiplicador;
    }
  } else {
    const resultado = rollDice(danoBase);
    danoTotal = resultado.total;
    danoRolls = resultado.rolls;
    if (bonusDanoStr) {
      const bonusRoll = rollDice(bonusDanoStr.replace(/^\+/, ""));
      danoTotal += bonusRoll.total;
      danoRolls.push(...bonusRoll.rolls);
    }
  }
  res.json({
    ok: true,
     arma_nome: item.nome,  
    ataque: { roll: ataqueRoll.roll, bonus: totalBonus, total: ataqueRoll.total, critico: ehCritico, margem: item.margem_critico, multiplicador: item.multiplicador_critico },
    dano: { rolagens: danoRolls, total: danoTotal, string: danoBase + (bonusDanoStr ? ` ${bonusDanoStr}` : "") }
  });
}

// Listar itens da biblioteca
async function listarBibliotecaItens(req, res) {
  const { tipo } = req.query;
  const data = await ItemModel.listarBiblioteca(req.session.userId);
  let resultado = data;
  if (tipo) {
    resultado.gerais = data.gerais.filter(i => i.tipo === tipo);
    resultado.pessoais = data.pessoais.filter(i => i.tipo === tipo);
  }
  res.json(resultado);
}

// Modificações disponíveis
async function listarModificacoesDisponiveis(req, res) {
  const { tipo_item } = req.query;
  const mods = await ModificacaoModel.listarPorTipo(tipo_item, req.session.userId);
  res.json(mods);
}

// Aplicar modificação
async function aplicarModificacao(req, res) {
  const { id_item_personagem, id_modificacao } = req.body;
  const item = await InventarioModel.obterItemPersonagem(id_item_personagem, req.session.userId);
  if (!item) return res.status(404).json({ erro: "Item não encontrado" });
  await InventarioModel.adicionarModificacaoItem(id_item_personagem, id_modificacao);
  if (item.tipo === 'protecao' && item.esta_equipado) {
    await recalcularCAEquipamentos(item.id_personagem);
  }
  res.json({ ok: true });
}

// Remover modificação
async function removerModificacao(req, res) {
  const { id_item_personagem, id_modificacao } = req.body;
  const item = await InventarioModel.obterItemPersonagem(id_item_personagem, req.session.userId);
  if (!item) return res.status(404).json({ erro: "Item não encontrado" });
  await InventarioModel.removerModificacaoItem(id_item_personagem, id_modificacao);
  if (item.tipo === 'protecao' && item.esta_equipado) {
    await recalcularCAEquipamentos(item.id_personagem);
  }
  res.json({ ok: true });
}

// Obter modificações de um item (usado pelo frontend)
async function listarModificacoesDoItem(req, res) {
  const { id_personagem, id_item_personagem } = req.params;
  const personagem = await PersonagemModel.findByIdAndJogador(id_personagem, req.session.userId);
  if (!personagem) return res.status(403).json({ erro: "Acesso negado" });
  const mods = await InventarioModel.listarModificacoesItem(id_item_personagem);
  res.json(mods);
}
async function criarItemPersonalizado(req, res) {
  try {
    const { id_personagem } = req.params;
    const { nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos } = req.body;

    // Validações simples
    if (!nome || !tipo) return res.status(400).json({ erro: "Nome e tipo são obrigatórios" });

    // 1. Salva na biblioteca pessoal do jogador
    const idItemBiblioteca = await ItemModel.criarItemBiblioteca({
      nome,
      tipo,
      descricao,
      dano,
      atributo_ataque: atributo_ataque || 'forca',
      margem_critico: margem_critico || 20,
      multiplicador_critico: multiplicador_critico || 2,
      bonus_ataque: bonus_ataque || 0,
      bonus_ca: bonus_ca || 0,
      usos_maximos: usos_maximos || null,
      is_geral: 0,
      id_jogador: req.session.userId
    });

    // 2. Adiciona ao inventário do personagem
    const idItemInventario = await InventarioModel.adicionarItem(id_personagem, idItemBiblioteca, nome);
    
    res.json({
      ok: true,
      id_item_personagem: idItemInventario,
      mensagem: "Item criado e adicionado ao inventário!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar item" });
  }
}
module.exports = {
  listar,
  adicionar,
  remover,
  equipar,
  usarItem,
  atacarComArma,
  listarBibliotecaItens,
  listarModificacoesDisponiveis,
  aplicarModificacao,
  removerModificacao,
  listarModificacoesDoItem,
  criarItemPersonalizado
};