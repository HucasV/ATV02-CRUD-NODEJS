const CampanhaModel = require("../models/CampanhaModel");
const SolicitacaoModel = require("../models/SolicitacaoModel");
const db = require("../config/db");

async function listarMestre(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const campanhas = await CampanhaModel.findAllByMestre(req.session.userId);
  res.render("campanhasMestre", { campanhas });
}

async function novaForm(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  res.render("novaCampanha");
}

async function criar(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const { nome, descricao } = req.body;
  await CampanhaModel.create({ nome, descricao, id_mestre: req.session.userId });
  res.redirect("/campanhas/mestre");
}

async function gerenciar(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const campanhaId = req.params.id;
  const campanha = await CampanhaModel.findById(campanhaId);
  const [todosJogadores] = await db.query("SELECT id, nome, email FROM jogador WHERE role = 'jogador'");
  const jogadores = await CampanhaModel.getJogadoresDaCampanha(campanhaId);
  const jogadoresNaCampanha = [];
  for (let j of jogadores) {
    const atribuidos = await CampanhaModel.getPersonagensAtribuidos(campanhaId, j.id_jogador);
    const [allPersonagens] = await db.query("SELECT id, nome FROM personagens WHERE id_jogador = ?", [j.id_jogador]);
    const idsAtribuidos = atribuidos.map(a => a.id);
    const disponiveis = allPersonagens.filter(p => !idsAtribuidos.includes(p.id));
    jogadoresNaCampanha.push({
      id_jogador: j.id_jogador,
      nome: j.nome,
      email: j.email,
      personagensAtribuidos: atribuidos,
      personagensDisponiveis: disponiveis
    });
  }

  // Buscar logs da campanha (últimos 100)
  const [logs] = await db.query(
    `SELECT l.*, j.nome as jogador_nome, p.nome as personagem_nome
     FROM campanha_logs l
     JOIN jogador j ON l.id_jogador = j.id
     JOIN personagens p ON l.id_personagem = p.id
     WHERE l.id_campanha = ?
     ORDER BY l.data_hora DESC
     LIMIT 100`,
    [campanhaId]
  );

  res.render("gerenciarCampanha", { 
    campanha, 
    todosJogadores, 
    jogadoresNaCampanha,
    logs 
  });
}

async function adicionarJogador(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const id_campanha = req.params.id;
  const { id_jogador } = req.body;
  await CampanhaModel.addJogador(id_campanha, id_jogador);
  res.redirect(`/campanhas/${id_campanha}/gerenciar`);
}

async function removerJogador(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const campanhaId = req.params.id;
  const { id_jogador } = req.body;
  await CampanhaModel.removeJogador(campanhaId, id_jogador);
  res.redirect(`/campanhas/${campanhaId}/gerenciar`);
}

async function atribuirPersonagem(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const id_campanha = req.params.id;
  let { id_jogador, id_personagem } = req.body;

  // Converte para números inteiros
  id_jogador = parseInt(id_jogador);
  id_personagem = parseInt(id_personagem);

  if (isNaN(id_jogador) || isNaN(id_personagem)) {
    return res.status(400).send("IDs inválidos.");
  }

  const [[personagem]] = await db.query("SELECT id_jogador FROM personagens WHERE id = ?", [id_personagem]);
  if (!personagem || personagem.id_jogador !== id_jogador) {
    // Log para debug (opcional)
    console.log(`Falha: personagem.id_jogador = ${personagem?.id_jogador}, id_jogador recebido = ${id_jogador}`);
    return res.status(400).send("Personagem não pertence ao jogador informado.");
  }
  await CampanhaModel.atribuirPersonagem(id_campanha, id_jogador, id_personagem);
  res.redirect(`/campanhas/${id_campanha}/gerenciar`);
}
async function removerPersonagem(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const campanhaId = req.params.id;
  const { id_personagem } = req.body;
  await CampanhaModel.removerPersonagem(campanhaId, id_personagem);
  res.redirect(`/campanhas/${campanhaId}/gerenciar`);
}

async function listarJogador(req, res) {
  if (req.session.userRole !== 'jogador') return res.status(403).send("Acesso negado");
  const campanhas = await CampanhaModel.getCampanhasByJogador(req.session.userId);
  for (let camp of campanhas) {
    const personagens = await CampanhaModel.getPersonagensAtribuidos(camp.id, req.session.userId);
    camp.personagens = personagens;
  }
  const [personagensDoJogador] = await db.query("SELECT id, nome FROM personagens WHERE id_jogador = ?", [req.session.userId]);
  res.render("campanhasJogador", { campanhas, personagensDoJogador });
}

async function escolherPersonagem(req, res) {
  const campanhaId = req.params.id;
  const { id_personagem } = req.body;
  const jogadorId = req.session.userId;
  const [[personagem]] = await db.query("SELECT id_jogador FROM personagens WHERE id = ?", [id_personagem]);
  if (!personagem || personagem.id_jogador !== jogadorId) return res.status(400).send("Personagem inválido.");
  const [existe] = await db.query("SELECT id_personagem FROM campanha_personagens WHERE id_campanha = ? AND id_jogador = ?", [campanhaId, jogadorId]);
  if (existe.length > 0) return res.status(400).send("Você já possui um personagem atribuído a esta campanha.");
  await CampanhaModel.atribuirPersonagem(campanhaId, jogadorId, id_personagem);
  res.redirect("/campanhas/jogador");
}

async function deletar(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).send("Acesso negado");
  const campanhaId = req.params.id;
  await CampanhaModel.deleteCampanha(campanhaId);
  res.redirect("/campanhas/mestre");
}

async function solicitar(req, res) {
  if (req.session.userRole !== 'mestre') return res.status(403).json({ erro: "Acesso negado" });
  const campanhaId = req.params.id;
  const { id_jogador } = req.body;
  const existePendente = await SolicitacaoModel.existsPendente(campanhaId, id_jogador);
  if (existePendente) return res.json({ mensagem: "Já existe uma solicitação pendente para este jogador." });
  const [membro] = await db.query("SELECT id_jogador FROM campanha_jogadores WHERE id_campanha = ? AND id_jogador = ?", [campanhaId, id_jogador]);
  if (membro.length > 0) return res.json({ mensagem: "Este jogador já faz parte da campanha." });
  await SolicitacaoModel.create(campanhaId, id_jogador);
  res.json({ mensagem: "Solicitação enviada com sucesso!" });
}

async function minhasSolicitacoes(req, res) {
  res.render("solicitacoes");
}

async function listarSolicitacoesJson(req, res) {
  const solicitacoes = await SolicitacaoModel.findPendentesByJogador(req.session.userId);
  res.json(solicitacoes);
}

async function aceitarSolicitacao(req, res) {
  const { id } = req.params;
  const solicitacao = await SolicitacaoModel.findById(id);
  if (!solicitacao) return res.status(404).json({ erro: "Solicitação não encontrada" });
  await CampanhaModel.addJogador(solicitacao.id_campanha, solicitacao.id_jogador);
  await SolicitacaoModel.aceitar(id);
  res.json({ ok: true });
}

async function recusarSolicitacao(req, res) {
  const { id } = req.params;
  await SolicitacaoModel.recusar(id);
  res.json({ ok: true });
}

async function buscarJogadores(req, res) {
  if (req.session.userRole !== 'mestre') {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const [jogadores] = await db.query(
      `SELECT id, nome, email 
       FROM jogador 
       WHERE (nome LIKE ? OR email LIKE ?) 
         AND role = 'jogador'
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );
    res.json(jogadores);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
}
const PersonagemModel = require("../models/personagemModel");
const HabilidadeModel = require("../models/habilidadeModel");
const { calcularPontosAtributoTotais, calcularPontosGastos, calcularDano } = require("../utils/rpgHelpers");

async function visualizarPersonagem(req, res) {
  // Verifica se o usuário é mestre
  if (req.session.userRole !== 'mestre') {
    return res.status(403).send("Acesso negado. Apenas mestres podem visualizar personagens.");
  }

  const { id_campanha, id_personagem } = req.params;

  try {
    // Verifica se a campanha pertence ao mestre logado
    const campanha = await CampanhaModel.findById(id_campanha);
    if (!campanha || campanha.id_mestre !== req.session.userId) {
      return res.status(403).send("Você não é o mestre desta campanha.");
    }

    // Verifica se o personagem está atribuído a algum jogador nesta campanha
    const [atribuicao] = await db.query(
      `SELECT id_jogador 
       FROM campanha_personagens 
       WHERE id_campanha = ? AND id_personagem = ?`,
      [id_campanha, id_personagem]
    );
    if (!atribuicao || atribuicao.length === 0) {
      return res.status(404).send("Personagem não está atribuído a nenhum jogador nesta campanha.");
    }

    // Busca os dados completos do personagem
    const personagem = await PersonagemModel.findById(id_personagem); // precisa de método findById (sem verificar id_jogador)
    if (!personagem) {
      return res.status(404).send("Personagem não encontrado.");
    }

    // Adiciona flag para o front‑end saber que é visualização (readonly)
    const isReadOnly = true;

    // Cálculos idênticos aos da ficha normal
    const nivel = Number(personagem.nivel);
    const forca = Number(personagem.forca) || 1;
    const agilidade = Number(personagem.agilidade) || 1;
    const constituicao = Number(personagem.constituicao) || 1;
    const intelecto = Number(personagem.intelecto) || 1;
    const atencao = Number(personagem.atencao) || 1;
    const estabilidade = Number(personagem.estabilidade) || 1;

    const pontos_totais_atributo = calcularPontosAtributoTotais(nivel);
    const pontos_gastos_atributo = calcularPontosGastos(forca, agilidade, constituicao, intelecto, atencao, estabilidade);
    const pontos_disponiveis_atributo = pontos_totais_atributo - pontos_gastos_atributo;

    let vida_max = 10 + constituicao + forca + (nivel * 6);
    if (personagem.vida_max_custom && personagem.vida_max_custom > 0) vida_max = personagem.vida_max_custom;
    let sanidade_max = 5 + estabilidade + (nivel * 3);
    if (personagem.sanidade_max_custom && personagem.sanidade_max_custom > 0) sanidade_max = personagem.sanidade_max_custom;

    const habilidades = await HabilidadeModel.findByPersonagem(id_personagem);
    const habilidadesComValor = habilidades.map(h => ({
      ...h,
      valor: h.dano_fixo || calcularDano(Number(h.nivel), h.tipo)
    }));

    const pontos_totais_habs = 3 + (nivel - 1) * 2;
    const pontos_usados = habilidades.reduce((t, h) => t + Number(h.nivel || 0), 0);
    const pontos_disponiveis_habs = pontos_totais_habs - pontos_usados;

    // Renderiza a mesma view de detalhes, mas com flag readonly
    res.render("detalhesPersonagem", {
      personagem,
      vida_max,
      sanidade_max,
      habilidades: habilidadesComValor,
      pontos_disponiveis: pontos_disponiveis_habs,
      pontos_disponiveis_atributo,
      pontos_totais_atributo,
      pontos_gastos_atributo,
      readonly: true   // ← importante para desabilitar edição
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao visualizar personagem");
  }
}

async function verLogs(req, res) {
  const campanhaId = req.params.id;
  // Verifica se o usuário é mestre desta campanha
  const campanha = await CampanhaModel.findById(campanhaId);
  if (!campanha || campanha.id_mestre !== req.session.userId) {
    return res.status(403).send("Acesso negado");
  }

  const [logs] = await db.query(
    `SELECT l.*, j.nome as jogador_nome, p.nome as personagem_nome
     FROM campanha_logs l
     JOIN jogador j ON l.id_jogador = j.id
     JOIN personagens p ON l.id_personagem = p.id
     WHERE l.id_campanha = ?
     ORDER BY l.data_hora DESC
     LIMIT 100`,
    [campanhaId]
  );

  res.render("campanhaLogs", { campanha, logs });
}

module.exports = {
  listarMestre,
  novaForm,
  criar,
  gerenciar,
  adicionarJogador,
  removerJogador,
  atribuirPersonagem,
  removerPersonagem,
  listarJogador,
  escolherPersonagem,
  deletar,
  solicitar,
  minhasSolicitacoes,
  listarSolicitacoesJson,
  aceitarSolicitacao,
  recusarSolicitacao,
  buscarJogadores,
  visualizarPersonagem,
  verLogs
};