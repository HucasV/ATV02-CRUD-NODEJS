const express = require("express");
const router = express.Router();
const { verificarLogin } = require("../middlewares/auth");
const inventarioController = require("../controllers/inventarioController");

router.get("/personagens/:id_personagem/inventario", verificarLogin, inventarioController.listar);
router.post("/personagens/:id_personagem/inventario/adicionar", verificarLogin, inventarioController.adicionar);
router.delete("/personagens/:id_personagem/inventario/:id_item_personagem", verificarLogin, inventarioController.remover);
router.put("/personagens/:id_personagem/inventario/:id_item_personagem/equipar", verificarLogin, inventarioController.equipar);
router.post("/personagens/:id_personagem/inventario/:id_item_personagem/usar", verificarLogin, inventarioController.usarItem);
router.post("/personagens/:id_personagem/inventario/:id_item_personagem/atacar", verificarLogin, inventarioController.atacarComArma);
router.get("/personagens/:id_personagem/inventario/:id_item_personagem/modificacoes", verificarLogin, inventarioController.listarModificacoesDoItem);
router.get("/itens/biblioteca", verificarLogin, inventarioController.listarBibliotecaItens);
router.get("/modificacoes", verificarLogin, inventarioController.listarModificacoesDisponiveis);
router.post("/inventario/item/modificacao", verificarLogin, inventarioController.aplicarModificacao);
router.delete("/inventario/item/modificacao", verificarLogin, inventarioController.removerModificacao);
router.post("/personagens/:id_personagem/itens/criar", verificarLogin, inventarioController.criarItemPersonalizado);

module.exports = router;