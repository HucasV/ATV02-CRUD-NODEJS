-- =============================================
-- SCRIPT COMPLETO PARA CRIAÇÃO DO BANCO DE DADOS RPG
-- =============================================

-- Criação do banco
CREATE DATABASE IF NOT EXISTS RPG;
USE RPG;

-- --------------------------------------------------
-- Tabela: jogador
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS jogador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('jogador', 'mestre') DEFAULT 'jogador',
    avatar VARCHAR(255) DEFAULT NULL
);

-- --------------------------------------------------
-- Tabela: personagens
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS personagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nivel INT NOT NULL,
    descricao LONGTEXT,
    forca INT,
    agilidade INT,
    constituicao INT,
    intelecto INT,
    atencao INT,
    estabilidade INT,
    vida_atual INT,
    sanidade_atual INT,
    id_jogador INT NOT NULL,
    imagem VARCHAR(255),
    xp INT DEFAULT 0,
    vida_max_custom INT DEFAULT NULL,
    sanidade_max_custom INT DEFAULT NULL,
	ca INT DEFAULT 10,
	bonus_armadura INT DEFAULT 0,
	bonus_outros INT DEFAULT 0,
    ca_equipamentos INT DEFAULT 0,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- Tabela: habilidades (habilidades aprendidas pelo personagem)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS habilidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nivel INT DEFAULT 1,
    tipo VARCHAR(50),           -- 'dano' ou 'cura'
    modo VARCHAR(50),           -- 'singular' ou 'area'
    id_personagem INT NOT NULL,
    descricao TEXT,
    tipo_acao ENUM('ativa', 'passiva') DEFAULT 'ativa',
    custo_vida INT DEFAULT 0,
    custo_sanidade INT DEFAULT 0,
    efeito TEXT,
    is_upgradeable BOOLEAN DEFAULT TRUE,
    dano_fixo VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (id_personagem) REFERENCES personagens(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- Tabela: habilidades_biblioteca (habilidades base reutilizáveis, por jogador ou gerais)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS habilidades_biblioteca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo ENUM('dano', 'cura') NOT NULL,
    modo ENUM('alvo_unico', 'area') NOT NULL,
    nivel_base INT DEFAULT 1,
    is_geral BOOLEAN DEFAULT FALSE,
    id_jogador INT NULL,
    descricao TEXT,
    tipo_acao ENUM('ativa', 'passiva') DEFAULT 'ativa',
    custo_vida_base INT DEFAULT 0,
    custo_sanidade_base INT DEFAULT 0,
    efeito TEXT,
    is_upgradeable_original TINYINT(1) DEFAULT 1,
    dano_base VARCHAR(50) DEFAULT NULL,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- Tabela: habilidades_divindades (poderes concedidos por divindades – gerais)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS habilidades_divindades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    divindade VARCHAR(50) NOT NULL,
    nivel INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    dano VARCHAR(50),
    tipo ENUM('dano', 'cura', 'efeito') DEFAULT 'dano',
    descricao TEXT,
    efeito TEXT,
    custo_tipo ENUM('vida', 'sanidade', 'ambos') DEFAULT 'ambos',
    is_geral BOOLEAN DEFAULT 1
);

-- --------------------------------------------------
-- Tabela: campanhas
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS campanhas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    id_mestre INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mestre) REFERENCES jogador(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- Tabela: campanha_jogadores (jogadores participantes)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS campanha_jogadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT NOT NULL,
    id_jogador INT NOT NULL,
    FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE,
    UNIQUE KEY (id_campanha, id_jogador)
);

-- --------------------------------------------------
-- Tabela: campanha_personagens (personagem usado por cada jogador na campanha)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS campanha_personagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT NOT NULL,
    id_jogador INT NOT NULL,
    id_personagem INT NOT NULL,
    FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE,
    FOREIGN KEY (id_personagem) REFERENCES personagens(id) ON DELETE CASCADE,
    UNIQUE KEY (id_campanha, id_jogador)
);

-- --------------------------------------------------
-- Tabela: solicitacoes_campanha (convites pendentes)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitacoes_campanha (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_campanha INT,
    id_jogador INT,
    status ENUM('pendente', 'aceita', 'recusada') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);


-- --------------------------------------------------
-- Tabela principal de itens
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_personagem INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('arma', 'protecao', 'geral', 'anomalo') NOT NULL,
  descricao TEXT,
  dado_dano VARCHAR(20) DEFAULT NULL,  -- ex: "2d6"
  atributo_acerto ENUM('forca', 'agilidade') DEFAULT 'forca',
  bonus_acerto INT DEFAULT 0,
  margem_critico INT DEFAULT 20,  -- 20, 19, 18
  multiplicador_critico INT DEFAULT 2,  -- 2x, 3x, 4x
  bonus_ca INT DEFAULT 0,
  usos_maximos INT DEFAULT NULL,
  usos_restantes INT DEFAULT NULL,
  imagem VARCHAR(255) DEFAULT NULL,
  esta_equipado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_personagem) REFERENCES personagens(id) ON DELETE CASCADE
);


-- --------------------------------------------------
-- Tabela de modificações (pré-definidas por tipo de item)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS modificacoes_base (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo_item ENUM('arma', 'protecao', 'geral', 'anomalo') NOT NULL,
  descricao TEXT,
  bonus_dano VARCHAR(20) DEFAULT NULL,  -- ex: "+1d6"
  bonus_acerto INT DEFAULT 0,
  bonus_ca INT DEFAULT 0,
  altera_margem_critico INT DEFAULT NULL,
  altera_multiplicador INT DEFAULT NULL,
  aumenta_usos INT DEFAULT NULL,
  efeito_especial TEXT
);
-- --------------------------------------------------
-- Tabela de modificações aplicadas a itens específicos
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS item_modificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_item INT NOT NULL,
  id_modificacao INT NOT NULL,
  FOREIGN KEY (id_item) REFERENCES inventario(id) ON DELETE CASCADE,
  FOREIGN KEY (id_modificacao) REFERENCES modificacoes_base(id) ON DELETE CASCADE,
  UNIQUE KEY (id_item, id_modificacao)
);

-- --------------------------------------------------
-- Tabela: itens_biblioteca (modelo/catálogo de itens)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_biblioteca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('arma', 'protecao', 'geral', 'anomalo') NOT NULL,
    descricao TEXT,
    dano VARCHAR(20) DEFAULT NULL,
    atributo_ataque ENUM('forca', 'agilidade') DEFAULT 'forca',
    margem_critico INT DEFAULT 20,
    multiplicador_critico INT DEFAULT 2,
    bonus_ataque INT DEFAULT 0,
    bonus_ca INT DEFAULT 0,
    usos_maximos INT DEFAULT NULL,
    is_geral BOOLEAN DEFAULT 1,
    id_jogador INT NULL,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- Tabela: modificacoes_biblioteca (modificações disponíveis)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS modificacoes_biblioteca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_item ENUM('arma', 'protecao', 'geral', 'anomalo') NOT NULL,
    efeito_descricao TEXT,
    bonus_dano VARCHAR(20) DEFAULT NULL,
    bonus_ataque INT DEFAULT 0,
    bonus_ca INT DEFAULT 0,
    atributo_adicional ENUM('forca', 'agilidade', 'constituicao', 'intelecto', 'atencao', 'estabilidade') DEFAULT NULL,
    is_geral BOOLEAN DEFAULT 1,
    id_jogador INT NULL,
    FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE
);
-- --------------------------------------------------
-- Tabela: Logs do campanha
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS campanha_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_campanha INT NOT NULL,
  id_jogador INT NOT NULL,
  id_personagem INT NOT NULL,
  acao VARCHAR(50) NOT NULL,           -- 'atributo', 'habilidade', 'ataque'
  nome_acao VARCHAR(255),               -- nome do atributo, habilidade ou arma
  detalhes TEXT,                        -- descrição completa da rolagem
  resultado INT DEFAULT NULL,           -- valor total (opcional)
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_campanha) REFERENCES campanhas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_jogador) REFERENCES jogador(id) ON DELETE CASCADE,
  FOREIGN KEY (id_personagem) REFERENCES personagens(id) ON DELETE CASCADE
);

-- --------------------------------------------------
-- DADOS INICIAIS: Habilidades das Divindades
-- --------------------------------------------------
INSERT INTO habilidades_divindades (divindade, nivel, nome, dano, tipo, descricao, efeito, custo_tipo) VALUES
('Rei inforcado', 1, 'Decadencia', '5d10', 'dano', 'Uma habilidade de 5d10 de dano em alvo único, o alvo fica sobre "decadência do rei" perdendo 1 de modificador de ataque e defesa por turno, ao passar em um teste de vigor DT 20+vigor, gasta metade', 'perda de modificador', 'ambos'),
('Rei inforcado', 2, 'Corromper', '4d10+15', 'dano', 'Uma vez por sessão, você pode corromper algo com o toque do rei.', 'Inimigos ou objetos corrompidos ficam com desvantagem em testes físicos', 'ambos'),
('Rei inforcado', 3, 'Decomposição onírica', '5d8', 'dano', 'Corrompe a mente do alvo, dando dano extremo e apagando um momento da vida dele', 'Apaga uma memória (efeito aleatório nos atributos)', 'ambos'),
('Rei inforcado', 4, 'Profanar', '8d10+20', 'dano', 'Dano extremo, o alvo se torna um ser profano, o mundo o rejeita', 'Anula cura passiva, desvantagem em testes até deixar de ser profano', 'ambos'),

('Rei Escarlate', 1, 'Fúria Escarlate', '6d10', 'dano', 'Gera uma erupção escarlate que destrói inimigos', 'Nenhum', 'ambos'),
('Rei Escarlate', 2, 'Lodo Vermelho', '8d10', 'dano', 'Cria uma poça de lodo vermelho que prende o alvo', 'Deixa o alvo preso, com desvantagem em testes de agilidade', 'ambos'),
('Rei Escarlate', 3, 'Fúria do Rei', '3d10', 'efeito', 'Aumento de todo dano em 3d10', 'Aumento nos atributos de força, vigor e agilidade em 3', 'ambos'),
('Rei Escarlate', 4, 'DESTRUIR, DESTRUIR, DESTRUIR', '2d100', 'dano', 'O usuário explode, tudo a sua volta vira pura destruição', 'DESTRUIR, DESTRUIR, DESTRUIR', 'ambos'),

('Mekhane', 1, 'Metal Cinético', '3d10', 'dano', 'Permite manipular livremente o metal, de forma passiva ou ofensiva', 'Essa habilidade não tem custo', 'ambos'),
('Mekhane', 2, 'Mecanizado', '0', 'efeito', 'Mecaniza qualquer parte do corpo, concedendo vantagem e +5 em testes', 'Vantagem e +5 em testes', 'ambos'),
('Mekhane', 3, 'Microrrobôs', '4d10+20', 'cura', 'Cria robôs microscópicos que curam o alvo', 'O alvo recebe RD permanente não acumulativa de +10', 'ambos'),
('Mekhane', 4, 'Mundo de Metal', '10d10', 'dano', 'Escolhe um alvo que vira sucata, partes metálicas e enferrujadas', 'Desmembra 1 membro (exceto cabeça)', 'ambos'),

('Mentora', 1, 'Arrancar Página', '6d8', 'dano', 'A Mentora arranca a página da história de alguém', 'Deixa exausto com desvantagem até descansar. Essa habilidade não tem custo', 'ambos'),
('Mentora', 2, 'Ler', '0', 'efeito', 'Lê uma página do livro sobre algo ou alguém', 'Faça uma pergunta, o mestre deve responder verdadeiramente (uma vez por item/pessoa)', 'ambos'),
('Mentora', 3, 'Invocar Biblioteca', 'acumulativo', 'dano', 'Cria uma biblioteca que acumula informação na mente do alvo', 'O alvo recebe dano contínuo', 'ambos'),
('Mentora', 4, 'Reescrever História', '0', 'efeito', 'Recria uma parte inteira da história de algo ou alguém', 'O alvo recebe qualquer efeito permanente (positivo ou negativo) ou perde algo permanentemente. O usuário perde metade da vida e sanidade permanentemente', 'ambos');

-- ============================================
-- DADOS INICIAIS: ITENS BIBLIOTECA
-- ============================================

-- ARMAS
INSERT INTO itens_biblioteca (nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral, id_jogador) VALUES
('Revólver', 'arma', 'Revólver calibre .38, dano médio e crítico 19.', '2d6', 'agilidade', 19, 2, 0, 0, NULL, 1, NULL),
('Submetralhadora', 'arma', 'Dispara rajadas, taxa de crítico 18.', '2d8', 'agilidade', 18, 2, 0, 0, NULL, 1, NULL),
('Fuzil de Assalto', 'arma', 'Preciso e mortal, crítico 19.', '3d6', 'agilidade', 19, 2, 0, 0, NULL, 1, NULL),
('Espada', 'arma', 'Lâmina longa, equilíbrio entre dano e crítico.', '2d8', 'forca', 19, 2, 0, 0, NULL, 1, NULL),
('Machado', 'arma', 'Golpe pesado, crítico 20 com multiplicador x3.', '3d6', 'forca', 20, 3, 0, 0, NULL, 1, NULL),
('Bastão', 'arma', 'Arma de impacto, boa para manobras.', '1d8', 'forca', 20, 2, 1, 0, NULL, 1, NULL),
('Faca', 'arma', 'Arma ágil e fácil de esconder.', '1d6', 'agilidade', 19, 2, 0, 0, NULL, 1, NULL),
('Punhos', 'arma', 'Ataque desarmado.', '1d4', 'forca', 20, 2, 0, 0, NULL, 1, NULL);

-- PROTEÇÕES
INSERT INTO itens_biblioteca (nome, tipo, descricao, bonus_ca, is_geral) VALUES
('Colete Leve', 'protecao', 'Colete balístico simples, oferece proteção básica.', 2, 1),
('Colete Pesado', 'protecao', 'Colete balístico militar, alta proteção.', 4, 1),
('Armadura Tática', 'protecao', 'Conjunto de placas balísticas e joelheiras.', 6, 1),
('Vestimenta Reforçada', 'protecao', 'Jaqueta de couro com proteções internas.', 3, 1),
('Escudo Balístico', 'protecao', 'Escudo dobrável para cobertura.', 3, 1),
('Traje de Proteção', 'protecao', 'Trafe químico e balístico leve.', 5, 1);

-- ITENS GERAIS (equipamentos, utensílios)
INSERT INTO itens_biblioteca (nome, tipo, descricao, is_geral) VALUES
('Kit de Primeiros Socorros', 'geral', 'Permite curar 1d8+2 de vida uma vez por cena.', 1),
('Lanterna Tática', 'geral', 'Ilumina ambiente escuro, concede +2 em testes de percepção.', 1),
('Corda', 'geral', 'Corda de 15 metros, útil para escalada e amarrações.', 1),
('Granada de Fragmentação', 'geral', 'Área: 3d6 de dano, explosão 2m.', 1),
('Sinalizador', 'geral', 'Atrai atenção ou ilumina área por 1 rodada.', 1),
('Fita Isolante', 'geral', 'Útil para reparos rápidos, conserta equipamentos simples.', 1),
('Rádio Comunicador', 'geral', 'Comunicação a longa distância.', 1);

-- ITENS ANÔMALOS 
INSERT INTO itens_biblioteca (nome, tipo, descricao, dano, atributo_ataque, margem_critico, multiplicador_critico, bonus_ataque, bonus_ca, usos_maximos, is_geral) VALUES
('Punhal de Sangue', 'anomalo', 'Ao causar dano, cura o usuário em 1d6.', '1d6', 'agilidade', 19, 2, 1, 0, 3, 1),
('Máscara da Verdade', 'anomalo', 'Permite fazer uma pergunta a um alvo e ele responde verdade (uma vez por cena).', NULL, NULL, NULL, NULL, 0, 1, 1, 1),
('Colar de Proteção', 'anomalo', 'Concede +2 de CA e resistência a dano paranormal.', NULL, NULL, NULL, NULL, 0, 2, NULL, 1),
('Manual de Rituais', 'anomalo', 'Permite aprender um ritual extra (uso único).', NULL, NULL, NULL, NULL, 0, 0, 1, 1),
('Pó de Vislumbre', 'anomalo', 'Revela criaturas invisíveis ou portais (3 usos).', NULL, NULL, NULL, NULL, 0, 0, 3, 1),
('Lâmina Sombria', 'anomalo', 'Causa dano extra de conhecimento (2d6).', '2d6', 'agilidade', 18, 3, 1, 0, 5, 1);

-- MODIFICAÇÕES 
INSERT INTO modificacoes_biblioteca (nome, tipo_item, efeito_descricao, bonus_dano, bonus_ataque, bonus_ca, atributo_adicional, is_geral) VALUES
-- Modificações para Armas
('Sangue Frio', 'arma', 'A arma concede +1 no acerto e +1d6 de dano de sangue.', '+1d6', 1, 0, NULL, 1),
('Lascinante', 'arma', 'Em crítico, o dano é multiplicado por x3.', NULL, 0, 0, NULL, 1),
('Conhecimento Perturbador', 'arma', 'Dano adicional de conhecimento (1d6) e reduz sanidade do alvo em 1.', '+1d6', 0, 0, NULL, 1),
('Precisa', 'arma', 'Margem de crítico aumenta em 1 (ex: 19→18).', NULL, 1, 0, NULL, 1),
('Pesada', 'arma', 'Aumenta o dano em 1 passo: 1d6 → 1d8.', '+1d2', 0, 0, NULL, 1),
('Energética', 'arma', 'Converte dano para energia e ignora resistência.', NULL, 0, 0, NULL, 1),

-- Modificações para Proteções
('Revestimento Balístico', 'protecao', '+2 de CA contra projéteis.', NULL, 0, 2, NULL, 1),
('Forrado', 'protecao', 'Concede +1 de CA e resistência a dano de energia.', NULL, 0, 1, NULL, 1),
('Leve', 'protecao', 'Reduz penalidade de agilidade em -1 (se houver).', NULL, 0, 0, 'agilidade', 1),
('Amaldiçoada', 'protecao', 'Concede +2 de CA, mas reduz 1 de sanidade ao equipar.', NULL, 0, 2, NULL, 1),
('Acolchoado', 'protecao', 'Resistência a dano de impacto +2.', NULL, 0, 0, NULL, 1),

-- Modificações para Itens Gerais
('Aprimorado', 'geral', 'O item funciona melhor: +2 no teste relacionado.', NULL, 0, 0, NULL, 1),
('Durabilidade', 'geral', 'O item não quebra em falha crítica.', NULL, 0, 0, NULL, 1),
('Microchip', 'geral', 'Item eletrônico com alcance estendido.', NULL, 0, 0, NULL, 1),

-- Modificações para Anômalos
('Carga Extra', 'anomalo', 'Aumenta usos máximos em +2.', NULL, 0, 0, NULL, 1),
('Vitalidade', 'anomalo', 'Ao usar, cura 1d6 de vida.', '+1d6', 0, 0, NULL, 1),
('Posse', 'anomalo', 'O item pode ser usado sem gastar uso uma vez por dia.', NULL, 0, 0, NULL, 1);