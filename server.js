// server.js
require('dotenv').config();
const express = require('express');
const { Groq } = require('groq-sdk');
const crypto = require('crypto'); // Para gerar um ID para o prompt
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002;

if (!process.env.GROQ_API_KEY) {
  console.error("ERRO: GROQ_API_KEY não está definida no arquivo .env");
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function generateRequestId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Constrói um prompt robusto para anúncios, extrai atributos e impõe formatação JSON.
 * Suporta Google Ads e Facebook Ads, focado em imóveis de alto padrão.
 */
function buildAdsPrompt({ productDescription, targetAudience = 'não especificado', adPlatform }) {
    const extractInfo =
      'Antes de tudo, analise a descrição do imóvel e identifique mentalmente até 8 atributos-chave ou diferenciais (ex: Suíte Master, Varanda Gourmet, 125m², Vista Mar, Segurança 24h). Você usará esses atributos para os sitelinks do Google Ads.';
  
    const baseInstructions = `
  Requisitos Gerais OBRIGATÓRIOS:
  - Idioma: Português Brasileiro
  - Tom de Voz: Sofisticado, elegante, aspiracional e focado em exclusividade e qualidade premium.
  - Formato da Resposta: JSON puro e válido, sem nenhum texto, comentário ou introdução fora do objeto JSON.
  - Limites de Caracteres: CUMPRA RIGOROSAMENTE TODOS OS LIMITES DE CARACTERES ESPECIFICADOS. Textos que excederem serão inutilizáveis e REJEITADOS. Verifique o comprimento de CADA item gerado. É SUA RESPONSABILIDADE GARANTIR OS LIMITES.
  `; // Adicionado "REJEITADOS"
  
    const audienceFocusInstruction = `
  IMPORTANTE: Se um público-alvo específico for fornecido em "Dados de Entrada", adapte CUIDADOSAMENTE a linguagem, os benefícios destacados e o tom geral para ressoar profundamente com esse grupo específico. Mantenha o foco geral em alto padrão, mas personalize a abordagem para o público-alvo informado. Se "não especificado", mantenha o foco amplo em alto padrão.
  `;
  
    if (adPlatform === 'Google Ads') {
      return `Você é um especialista em marketing digital e copywriting para Google Ads, mestre em criar anúncios concisos e persuasivos para um público de altíssimo padrão.
  ${audienceFocusInstruction}
  Dados de Entrada:
  - Descrição do Imóvel: "${productDescription}"
  - Público-alvo: ${targetAudience}
  - Plataforma: ${adPlatform}
  ${baseInstructions}
  ${extractInfo}
  
  Componentes a serem gerados para Google Ads (JSON):
  1. "headlines": 20 (vinte) títulos. ATENÇÃO MÁXIMA: CADA TÍTULO DEVE TER EXATAMENTE 30 CARACTERES OU MENOS. NÃO PODE HAVER EXCEÇÕES. TÍTULOS MAIORES QUE 30 CARACTERES SÃO COMPLETAMENTE INÚTEIS. Seja extremamente conciso e direto, mas mantendo a sofisticação. Foque em uma única ideia forte por título. ADAPTE para o público-alvo, se fornecido.
  2. "descriptions": 8 (oito) descrições. Para CADA descrição, siga este processo:
     a. Elabore uma mensagem central elegante que ressalte o luxo e os benefícios premium do imóvel, direcionada ao público-alvo.
     b. Escreva uma primeira versão.
     c. VERIFIQUE CUIDADOSAMENTE o número de caracteres.
     d. Se tiver MAIS de 90 caracteres, REESCREVA-A de forma mais concisa e direta, removendo palavras ou frases menos essenciais, até que tenha EXATAMENTE entre 70 e 90 caracteres.
     e. Se tiver MENOS de 70 caracteres, enriqueça-a com detalhes sofisticados ou benefícios relevantes, mantendo a elegância, até atingir pelo menos 70 caracteres.
     f. O TEXTO FINAL DE CADA DESCRIÇÃO ENVIADO NO JSON DEVE, OBRIGATORIAMENTE, TER ENTRE 70 E 90 CARACTERES. NENHUMA DESCRIÇÃO PODE EXCEDER 90 CARACTERES.
  3. "sitelinks": 8 (oito) sitelinks. Utilize os atributos-chave do imóvel que você identificou anteriormente. ADAPTE os títulos e descrições dos sitelinks para o público-alvo, se fornecido, destacando o que seria mais relevante para ele. Cada sitelink deve ter:
     - "sitelink_title": Título curto e direto. MÁXIMO 25 caracteres.
     - "sitelink_desc1": Primeira linha da descrição. MÁXIMO 35 caracteres.
     - "sitelink_desc2": Segunda linha da descrição. MÁXIMO 35 caracteres.
  4. "callouts": 8 (oito) frases de destaque. Devem ser curtas, reforçando a exclusividade ou características premium. ADAPTE para o público-alvo, se fornecido. MÁXIMO 25 caracteres CADA.
  5. "structured_snippets": Um conjunto, contendo:
     - "header": Escolha UM dos seguintes cabeçalhos, o mais apropriado para o imóvel E para o público-alvo (se fornecido): "Comodidades de Luxo", "Estilos de Vida", "Serviços Premium", "Localizações Exclusivas", "Diferenciais Únicos", "Acabamentos".
     - "values": Uma lista de 5 a 8 valores relevantes para o cabeçalho escolhido, detalhando atributos premium que atrairiam o público-alvo. MÁXIMO 25 caracteres CADA VALOR.
  6. "call_to_actions": 3 (três) chamadas para ação. Devem ser curtas, diretas e sofisticadas, convidando para uma ação de alto valor. ADAPTE o CTA para o que mais motivaria o público-alvo. (ex: “Agende Sua Visita Privativa”, “Descubra a Exclusividade”, “Consulte Condições Especiais”). MÁXIMO 25 caracteres CADA.
  
  Formato de Saída JSON Esperado:
  \`\`\`json
  {
    "headlines": ["Título Curto (<=30)", "Exclusivo Já (<=30)", "..."],
    "descriptions": ["Descrição elegante e precisa entre 70 e 90 caracteres...", "..."],
    "sitelinks": [
      {"sitelink_title":"Ex: Suíte Master","sitelink_desc1":"Refúgio de puro conforto","sitelink_desc2":"Com closet e hidro"}
    ],
    "callouts": ["Alto Padrão Garantido", "Design Sofisticado", "..."],
    "structured_snippets": {"header":"Comodidades de Luxo","values":["Piscina Aquecida", "Espaço Gourmet Premium", "..."]},
    "call_to_actions": ["Agende Visita VIP", "Conheça Seu Novo Lar", "Fale com Consultor"]
  }
  \`\`\`
  INSTRUÇÃO FINAL E CRÍTICA: Verifique meticulosamente TODOS os limites de caracteres de CADA item gerado antes de finalizar a resposta JSON. A precisão no comprimento, especialmente para os TÍTULOS do Google Ads (máximo 30 caracteres), é absolutamente essencial.
  `;
    }
  
    // Prompt do Facebook Ads (mantido como antes, mas você pode aplicar reforços similares se necessário)
    if (adPlatform === 'Facebook Ads') {
      return `Você é um especialista em marketing digital e copywriting para Facebook Ads, mestre em criar narrativas visuais e textuais que encantam um público de altíssimo padrão interessado em imóveis.
  ${audienceFocusInstruction}
  Dados de Entrada:
  - Descrição do Imóvel: "${productDescription}"
  - Público-alvo: ${targetAudience}
  - Plataforma: ${adPlatform}
  ${baseInstructions}
  ${extractInfo} 
  
  Componentes a serem gerados para Facebook Ads (JSON):
  1. "facebook_primary_texts": 5 (cinco) opções de Textos Principais. Devem ser narrativas envolventes e aspiracionais, pintando um quadro do estilo de vida que o imóvel proporciona e que seria desejado pelo público-alvo. Use parágrafos curtos e inclua 2 a 3 emojis estrategicamente posicionados para adicionar emoção e apelo visual (ex: ✨🏡💎). MÁXIMO 300 caracteres CADA (idealmente entre 150-250).
  2. "facebook_headlines": 5 (cinco) opções de Títulos. Devem ser curtos, extremamente chamativos e capturar a atenção do público-alvo imediatamente. Inclua 1 emoji relevante no início ou final de cada título. MÁXIMO 40 caracteres CADA.
  3. "facebook_link_descriptions": 3 (três) opções de Descrições de Link (News Feed Link Description). Devem ser concisas e complementar o título, incentivando o clique do público-alvo. MÁXIMO 30 caracteres CADA.
  4. "facebook_ctas": 3 (três) sugestões de texto para botões de Call to Action, que sejam convidativos para o público-alvo, usando emojis se apropriado (ex: "✨ Saiba Mais", "🗓️ Agendar Visita", "💎 Descubra o Luxo", "📲 Fale Conosco").
  
  Formato de Saída JSON Esperado:
  \`\`\`json
  {
    "facebook_primary_texts": ["✨ Viva o ápice do luxo neste imóvel espetacular... [mais detalhes e emojis relevantes para o público]...", "..."],
    "facebook_headlines": ["🏡 Seu Novo Paraíso Particular!", "💎 Exclusividade e Sofisticação", "..."],
    "facebook_link_descriptions": ["Localização Ímpar. Agende!", "Detalhes que Fascinam.", "..."],
    "facebook_ctas": ["✨ Saiba Mais", "🗓️ Agendar Visita", "💎 Descubra o Luxo"]
  }
  \`\`\`
  INSTRUÇÃO FINAL E CRÍTICA: Verifique meticulosamente TODOS os limites de caracteres de CADA item gerado antes de finalizar a resposta JSON. A precisão no comprimento é essencial.
  `;
    }
    throw new Error(`Plataforma '${adPlatform}' não suportada para geração de prompt.`);
  }
  
  app.post('/api/generate-ads', async (req, res) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const { productDescription, targetAudience, adPlatform } = req.body;
    let assistantResponseContent; 
  
    console.log(`[Req ID: ${requestId}] Nova requisição recebida. Plataforma: ${adPlatform}, Público: ${targetAudience || 'N/A'}`);
  
    if (!productDescription || !adPlatform) {
      console.error(`[Req ID: ${requestId}] Erro de validação: productDescription ou adPlatform ausentes.`);
      return res.status(400).json({ error: 'Descrição do produto/serviço e plataforma de anúncio são obrigatórios.' });
    }
  
    try {
      const prompt = buildAdsPrompt({ productDescription, targetAudience, adPlatform });
      
      console.log(`[Req ID: ${requestId}] Enviando para Groq...`);
      const response = await groq.chat.completions.create({
        model: 'llama3-8b-8192', 
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.55, // **REDUZIDO AINDA MAIS** para máxima conformidade
        max_tokens: 4500, 
        top_p: 1,
        stream: false,
        response_format: { type: 'json_object' },
      });
  
      assistantResponseContent = response.choices?.[0]?.message?.content;
      const duration = Date.now() - startTime;
      console.log(`[Req ID: ${requestId}] Resposta da Groq recebida em ${duration}ms.`);
  
      if (!assistantResponseContent) {
        console.error(`[Req ID: ${requestId}] Erro: Resposta vazia da API Groq.`);
        throw new Error('Resposta vazia da API Groq');
      }
  
      let parsed = JSON.parse(assistantResponseContent);
      parsed.platform_used = adPlatform;
  
      // --- INÍCIO DO PÓS-PROCESSAMENTO ---
      if (adPlatform === 'Google Ads') {
        // Pós-processamento para TÍTULOS do Google Ads
        if (parsed.headlines) {
          const MAX_TITLE_LENGTH = 30;
          parsed.headlines = parsed.headlines.map(title => {
            if (typeof title === 'string' && title.length > MAX_TITLE_LENGTH) {
              let originalLength = title.length;
              let truncatedTitle = title.substring(0, MAX_TITLE_LENGTH + 1); // Pega um pouco a mais
              let lastSpaceIndex = truncatedTitle.lastIndexOf(' ');
              
              if (lastSpaceIndex > MAX_TITLE_LENGTH - 10 && lastSpaceIndex > 0) { // Tenta cortar na palavra
                truncatedTitle = truncatedTitle.substring(0, lastSpaceIndex);
              } else { // Senão, corte direto
                truncatedTitle = title.substring(0, MAX_TITLE_LENGTH);
              }
              // Reticências não são comuns em títulos, então evitamos, a menos que o corte seja muito abrupto
              // No entanto, o mais importante é NÃO EXCEDER 30.
              if (truncatedTitle.length > MAX_TITLE_LENGTH) { // Garantia final
                  truncatedTitle = truncatedTitle.substring(0, MAX_TITLE_LENGTH);
              }
              console.warn(`[Req ID: ${requestId}] WARN: TÍTULO do Google Ads truncado. Original ("${title}", ${originalLength} chars) -> Truncado para: ("${truncatedTitle}", ${truncatedTitle.length} chars)`);
              return truncatedTitle;
            }
            return title;
          });
        }
  
        // Pós-processamento para DESCRIÇÕES do Google Ads
        if (parsed.descriptions) {
          const MAX_DESC_LENGTH = 90;
          parsed.descriptions = parsed.descriptions.map(desc => {
            if (typeof desc !== 'string') return desc; 
            if (desc.length > MAX_DESC_LENGTH) {
              let originalLength = desc.length;
              let truncatedDesc = desc.substring(0, MAX_DESC_LENGTH + 1); 
              let lastSpaceIndex = truncatedDesc.lastIndexOf(' ');
              
              if (lastSpaceIndex > MAX_DESC_LENGTH - 25 && lastSpaceIndex > 0) { 
                truncatedDesc = truncatedDesc.substring(0, lastSpaceIndex);
              } else { 
                truncatedDesc = desc.substring(0, MAX_DESC_LENGTH);
              }
              
              if (truncatedDesc.length < originalLength && !['.', '!', '?'].includes(truncatedDesc.slice(-1))) {
                if (truncatedDesc.length <= MAX_DESC_LENGTH - 3) {
                  truncatedDesc += '...';
                } else { 
                    truncatedDesc = truncatedDesc.substring(0, MAX_DESC_LENGTH - 3) + '...';
                }
              }
              if (truncatedDesc.length > MAX_DESC_LENGTH) {
                 truncatedDesc = truncatedDesc.substring(0, MAX_DESC_LENGTH);
              }
              console.warn(`[Req ID: ${requestId}] WARN: Descrição do Google Ads truncada. Original ("${desc.substring(0,50)}...", ${originalLength} chars) -> Truncada para: ("${truncatedDesc.substring(0,50)}...", ${truncatedDesc.length} chars)`);
              return truncatedDesc;
            }
            return desc;
          });
        }
      }
      // --- FIM DO PÓS-PROCESSAMENTO ---
  
      console.log(`[Req ID: ${requestId}] Processamento concluído. Enviando resposta para o cliente.`);
      return res.json(parsed);
  
    } catch (err) {
      // ... (seu tratamento de erro existente, já está bom) ...
      const duration = Date.now() - startTime;
      console.error(`[Req ID: ${requestId}] Erro após ${duration}ms:`, err.message);
      const isSyntaxError = err instanceof SyntaxError;
      let errorMessage = 'Ocorreu um erro ao gerar os anúncios. Por favor, tente novamente.';
      let errorDetails = err.message || 'Detalhes do erro não disponíveis.';
  
      if (isSyntaxError) {
        errorMessage = 'Erro ao processar a resposta da IA (formato JSON inválido). Tente refinar sua descrição ou tente novamente.';
        errorDetails = assistantResponseContent 
          ? `Início da resposta que causou o erro: ${assistantResponseContent.slice(0, 1000)}...` 
          : 'Não foi possível obter a resposta da API que causou o erro de parse.';
        console.error(`[Req ID: ${requestId}] Detalhe SyntaxError:`, errorDetails);
      } else if (err.message === 'Resposta vazia da API Groq') {
          errorMessage = 'A IA não retornou uma resposta. Verifique sua descrição e tente novamente.';
          errorDetails = "A API retornou uma resposta sem conteúdo.";
      } else if (err.response?.data?.error?.message) { 
          errorMessage = `Erro da API da IA: ${err.response.data.error.message}`;
          errorDetails = JSON.stringify(err.response.data.error);
          console.error(`[Req ID: ${requestId}] Detalhe Erro API Groq:`, errorDetails);
      } else { 
          console.error(`[Req ID: ${requestId}] Detalhe Erro Genérico:`, err);
      }
      
      return res.status(500).json({
        error: errorMessage,
        details_dev: errorDetails, 
      });
    }
  });
  
  app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));